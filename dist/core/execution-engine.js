"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionEngine = void 0;
const registry_1 = require("../commands/registry");
const errors_1 = require("./errors");
const logger_1 = require("./logger");
/**
 * Core execution engine for SuperSelector
 */
class ExecutionEngine {
    constructor(cache, eventEmitter) {
        this.executionDepth = 0;
        this.cache = cache;
        this.eventEmitter = eventEmitter;
    }
    async execute(commands, element, config) {
        const startTime = Date.now();
        let commandsExecuted = 0;
        let cacheHit = false;
        // Initialize context with soft error tracking
        const context = {
            element,
            currentValue: element,
            config,
            metadata: {},
            hadSoftError: false,
            softError: undefined,
        };
        try {
            const cacheKey = this.generateCacheKey(commands, element);
            if (config.cacheEnabled) {
                const cachedResult = this.cache.get(cacheKey);
                if (cachedResult !== null) {
                    cacheHit = true;
                    ////logger.debug("Cache hit for selector execution")
                    return {
                        success: true,
                        value: cachedResult,
                        error: undefined,
                        metadata: {
                            executionTime: Date.now() - startTime,
                            commandsExecuted: 0,
                            cacheHit: true,
                        },
                    };
                }
            }
            this.eventEmitter.emit("execution:start", { commands, element });
            const resultValue = await this.executeCommands(commands, context);
            commandsExecuted = commands.length;
            if (config.cacheEnabled && resultValue !== null && !context.hadSoftError) {
                this.cache.set(cacheKey, resultValue, config.cacheTTL);
            }
            const executionTime = Date.now() - startTime;
            this.eventEmitter.emit("execution:complete", { result: resultValue, executionTime, commandsExecuted });
            return {
                success: !context.hadSoftError,
                value: resultValue,
                error: context.hadSoftError ? context.softError : undefined,
                metadata: { executionTime, commandsExecuted, cacheHit },
            };
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            // Ensure the caught error is of SuperSelectorErrorType or wrapped
            let superSelectorError;
            if (error instanceof Error && "code" in error && typeof error.code === "string") {
                // It's likely already a SuperSelectorError or compatible
                superSelectorError = error;
            }
            else {
                superSelectorError = errors_1.ErrorFactory.execution(error instanceof Error ? error.message : String(error));
            }
            this.eventEmitter.emit("execution:error", { error: superSelectorError, executionTime, commandsExecuted });
            logger_1.logger.error("Execution failed with hard error", { error: superSelectorError, commands });
            return {
                success: false,
                value: config.errorHandling === "return-default" && !(error instanceof errors_1.ErrorFactory.timeout(0).constructor)
                    ? config.defaultValue
                    : null,
                error: superSelectorError,
                metadata: { executionTime, commandsExecuted, cacheHit },
            };
        }
        finally {
            this.executionDepth = 0;
        }
    }
    async executeCommands(commands, context) {
        if (this.executionDepth > context.config.maxDepth) {
            throw errors_1.ErrorFactory.execution(`Maximum execution depth exceeded: ${context.config.maxDepth}`);
        }
        this.executionDepth++;
        try {
            let currentValue = context.currentValue;
            for (let i = 0; i < commands.length; i++) {
                const command = commands[i];
                context.currentValue = currentValue;
                // //logger.debug(`Executing command ${i + 1}/${commands.length}: ${command.type} - ${command.name}`, {
                //   currentValue: currentValue,
                //   command: command,
                // })
                currentValue = await this.executeCommand(command, context);
                // //logger.debug(`Command ${i + 1} result:`, currentValue)
                if (currentValue === undefined && !context.hadSoftError && i < commands.length - 1) {
                    const err = errors_1.ErrorFactory.execution(`Command '${command.name}' resulted in undefined, breaking execution chain.`, command, context);
                    if (context.config.errorHandling === "throw")
                        throw err;
                    context.hadSoftError = true;
                    context.softError = err;
                    currentValue = context.config.errorHandling === "return-default" ? context.config.defaultValue : null;
                }
                this.eventEmitter.emit("command:executed", { command, result: currentValue });
                if (context.hadSoftError && context.config.errorHandling !== "throw" && i < commands.length - 1) {
                    //logger.debug(`Soft error occurred, continuing with value: ${currentValue}`)
                }
            }
            return currentValue;
        }
        finally {
            this.executionDepth--;
        }
    }
    async executeCommand(command, context) {
        // //logger.debug(`executeCommand: ${command.type} - ${command.name}`, { currentValue: context.currentValue })
        let err;
        switch (command.type) {
            case "css-selector":
                return registry_1.commandRegistry.execute("css-selector", context, command.selector);
            case "function":
                if (context.currentValue === null || context.currentValue === undefined) {
                    if (!context.hadSoftError) {
                        context.hadSoftError = true;
                        err = errors_1.ErrorFactory.execution(`Cannot call method '${command.name}' on null or undefined value`, command, context);
                        context.softError = err;
                    }
                    if (context.config.errorHandling === "throw") {
                        throw err || context.softError;
                    }
                    const defaultVal = context.config.errorHandling === "return-default" ? context.config.defaultValue : null;
                    return defaultVal;
                }
                // Add specific logging for getAttribute
                if (command.name === "getAttribute") {
                    console.log("=== getAttribute Debug ===");
                    console.log("Current value:", context.currentValue);
                    console.log("Current value type:", typeof context.currentValue);
                    console.log("Is Element:", context.currentValue instanceof Element);
                    console.log("Has getAttribute:", typeof context.currentValue?.getAttribute);
                    console.log("Command args:", command.args);
                }
                if (this.isNativeMethod(context.currentValue, command.name)) {
                    return this.executeNativeMethod(context.currentValue, command.name, command.args);
                }
                if (registry_1.commandRegistry.has(command.name)) {
                    return registry_1.commandRegistry.execute(command.name, context, ...command.args);
                }
                if (!context.hadSoftError) {
                    context.hadSoftError = true;
                    err = errors_1.ErrorFactory.execution(`Unknown method or command: ${command.name}`, command, context);
                    context.softError = err;
                }
                if (context.config.errorHandling === "throw") {
                    throw err || context.softError;
                }
                const defaultValUnknown = context.config.errorHandling === "return-default" ? context.config.defaultValue : null;
                return defaultValUnknown;
            case "property":
                return registry_1.commandRegistry.execute("property", context, command.name);
            case "array-access":
                return registry_1.commandRegistry.execute("array-access", context, command.index);
            default:
                throw errors_1.ErrorFactory.execution(`Unknown command type: ${command.type}`);
        }
    }
    isNativeMethod(value, methodName) {
        if (value === null || value === undefined || (typeof value !== "object" && typeof value !== "function")) {
            return false;
        }
        const hasMethod = typeof value[methodName] === "function";
        // //logger.debug(`isNativeMethod check for '${methodName}' on value of type ${typeof value}:`, {
        //   valueConstructor: value?.constructor?.name,
        //   hasMethod: hasMethod,
        // })
        return hasMethod;
    }
    executeNativeMethod(value, methodName, args) {
        try {
            // //logger.debug(`executeNativeMethod: ${methodName}`, { value_type: typeof value, args })
            const convertedArgs = args.map((arg) => {
                if (arg === "true")
                    return true;
                if (arg === "false")
                    return false;
                const num = Number(arg);
                // Ensure empty strings or strings that are just whitespace don't become 0
                if (!isNaN(num) && isFinite(num) && arg.trim() !== "")
                    return num;
                return arg;
            });
            // //logger.debug(`Converted args for native method:`, convertedArgs)
            const result = value[methodName](...convertedArgs);
            // //logger.debug(`Native method '${methodName}' result:`, result)
            return result;
        }
        catch (error) {
            logger_1.logger.error(`Error in executeNativeMethod '${methodName}':`, error);
            throw errors_1.ErrorFactory.execution(`Error calling native method '${methodName}': ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    generateCacheKey(commands, element) {
        const commandsStr = JSON.stringify(commands);
        const elementId = element instanceof Element ? element.id || element.tagName + element.className : "document";
        return `${commandsStr}:${elementId}`;
    }
}
exports.ExecutionEngine = ExecutionEngine;
//# sourceMappingURL=execution-engine.js.map