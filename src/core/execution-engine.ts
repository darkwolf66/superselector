import type {
    Command,
    ExecutionContext,
    ExecutionResult,
    SelectorValue,
    SuperSelectorConfig,
    SuperSelectorError as SuperSelectorErrorType,
} from "../types" // Ensure SuperSelectorErrorType is imported if used directly
import { commandRegistry } from "../commands/registry"
import { ErrorFactory } from "./errors"
import { logger } from "./logger"
import type { Cache } from "./cache"
import type { EventEmitter } from "./event-emitter"

/**
 * Core execution engine for SuperSelector
 */
export class ExecutionEngine {
    private cache: Cache
    private eventEmitter: EventEmitter
    private executionDepth = 0

    constructor(cache: Cache, eventEmitter: EventEmitter) {
        this.cache = cache
        this.eventEmitter = eventEmitter
    }

    async execute(
        commands: Command[],
        element: Element | Document,
        config: SuperSelectorConfig,
    ): Promise<ExecutionResult> {
        const startTime = Date.now()
        let commandsExecuted = 0
        let cacheHit = false

        // Initialize context with soft error tracking
        const context: ExecutionContext = {
            element,
            currentValue: element,
            config,
            metadata: {},
            hadSoftError: false,
            softError: undefined,
        }

        try {
            const cacheKey = this.generateCacheKey(commands, element)
            if (config.cacheEnabled) {
                const cachedResult = this.cache.get(cacheKey)
                if (cachedResult !== null) {
                    cacheHit = true
                    ////logger.debug("Cache hit for selector execution")
                    return {
                        success: true,
                        value: cachedResult,
                        error: undefined, // Explicitly undefined for cache hit success
                        metadata: {
                            executionTime: Date.now() - startTime,
                            commandsExecuted: 0,
                            cacheHit: true,
                        },
                    }
                }
            }

            this.eventEmitter.emit("execution:start", { commands, element })

            const resultValue = await this.executeCommands(commands, context)
            commandsExecuted = commands.length

            if (config.cacheEnabled && resultValue !== null && !context.hadSoftError) {
                this.cache.set(cacheKey, resultValue, config.cacheTTL)
            }

            const executionTime = Date.now() - startTime
            this.eventEmitter.emit("execution:complete", { result: resultValue, executionTime, commandsExecuted })

            return {
                success: !context.hadSoftError,
                value: resultValue,
                error: context.hadSoftError ? context.softError : undefined,
                metadata: { executionTime, commandsExecuted, cacheHit },
            }
        } catch (error) {
            const executionTime = Date.now() - startTime
            // Ensure the caught error is of SuperSelectorErrorType or wrapped
            let superSelectorError: SuperSelectorErrorType
            if (error instanceof Error && "code" in error && typeof error.code === "string") {
                // It's likely already a SuperSelectorError or compatible
                superSelectorError = error as SuperSelectorErrorType
            } else {
                superSelectorError = ErrorFactory.execution(error instanceof Error ? error.message : String(error))
            }

            this.eventEmitter.emit("execution:error", { error: superSelectorError, executionTime, commandsExecuted })
            logger.error("Execution failed with hard error", { error: superSelectorError, commands })

            return {
                success: false,
                value:
                    config.errorHandling === "return-default" && !(error instanceof ErrorFactory.timeout(0).constructor)
                        ? config.defaultValue
                        : null,
                error: superSelectorError,
                metadata: { executionTime, commandsExecuted, cacheHit },
            }
        } finally {
            this.executionDepth = 0
        }
    }

    private async executeCommands(commands: Command[], context: ExecutionContext): Promise<SelectorValue> {
        if (this.executionDepth > context.config.maxDepth) {
            throw ErrorFactory.execution(`Maximum execution depth exceeded: ${context.config.maxDepth}`)
        }
        this.executionDepth++

        try {
            let currentValue = context.currentValue
            for (let i = 0; i < commands.length; i++) {
                const command = commands[i]
                context.currentValue = currentValue

                // //logger.debug(`Executing command ${i + 1}/${commands.length}: ${command.type} - ${command.name}`, {
                //   currentValue: currentValue,
                //   command: command,
                // })

                currentValue = await this.executeCommand(command, context)

                // //logger.debug(`Command ${i + 1} result:`, currentValue)

                if (currentValue === undefined && !context.hadSoftError && i < commands.length - 1) {
                    const err = ErrorFactory.execution(
                        `Command '${command.name}' resulted in undefined, breaking execution chain.`,
                        command,
                        context,
                    )
                    if (context.config.errorHandling === "throw") throw err

                    context.hadSoftError = true
                    context.softError = err
                    currentValue = context.config.errorHandling === "return-default" ? context.config.defaultValue : null
                }

                this.eventEmitter.emit("command:executed", { command, result: currentValue })
                if (context.hadSoftError && context.config.errorHandling !== "throw" && i < commands.length - 1) {
                    //logger.debug(`Soft error occurred, continuing with value: ${currentValue}`)
                }
            }
            return currentValue
        } finally {
            this.executionDepth--
        }
    }

    private async executeCommand(command: Command, context: ExecutionContext): Promise<SelectorValue> {
        // //logger.debug(`executeCommand: ${command.type} - ${command.name}`, { currentValue: context.currentValue })
        let err: SuperSelectorErrorType | undefined

        switch (command.type) {
            case "css-selector":
                return commandRegistry.execute("css-selector", context, command.selector)

            case "function":
                if (context.currentValue === null || context.currentValue === undefined) {
                    if (!context.hadSoftError) {
                        context.hadSoftError = true
                        err = ErrorFactory.execution(
                            `Cannot call method '${command.name}' on null or undefined value`,
                            command,
                            context,
                        )
                        context.softError = err
                    }
                    if (context.config.errorHandling === "throw") {
                        throw err || context.softError!
                    }
                    const defaultVal = context.config.errorHandling === "return-default" ? context.config.defaultValue : null
                    return defaultVal
                }

                // Add specific logging for getAttribute
                if (command.name === "getAttribute") {
                    console.log("=== getAttribute Debug ===")
                    console.log("Current value:", context.currentValue)
                    console.log("Current value type:", typeof context.currentValue)
                    console.log("Is Element:", context.currentValue instanceof Element)
                    console.log("Has getAttribute:", typeof (context.currentValue as any)?.getAttribute)
                    console.log("Command args:", command.args)
                }

                if (this.isNativeMethod(context.currentValue, command.name)) {
                    return this.executeNativeMethod(context.currentValue, command.name, command.args)
                }

                if (commandRegistry.has(command.name)) {
                    return commandRegistry.execute(command.name, context, ...command.args)
                }

                if (!context.hadSoftError) {
                    context.hadSoftError = true
                    err = ErrorFactory.execution(`Unknown method or command: ${command.name}`, command, context)
                    context.softError = err
                }
                if (context.config.errorHandling === "throw") {
                    throw err || context.softError!
                }
                const defaultValUnknown = context.config.errorHandling === "return-default" ? context.config.defaultValue : null
                return defaultValUnknown

            case "property":
                return commandRegistry.execute("property", context, command.name)

            case "array-access":
                return commandRegistry.execute("array-access", context, command.index)

            default:
                throw ErrorFactory.execution(`Unknown command type: ${(command as any).type}`)
        }
    }

    private isNativeMethod(value: any, methodName: string): boolean {
        if (value === null || value === undefined || (typeof value !== "object" && typeof value !== "function")) {
            return false
        }
        const hasMethod = typeof (value as any)[methodName] === "function"
        // //logger.debug(`isNativeMethod check for '${methodName}' on value of type ${typeof value}:`, {
        //   valueConstructor: value?.constructor?.name,
        //   hasMethod: hasMethod,
        // })
        return hasMethod
    }

    private executeNativeMethod(value: any, methodName: string, args: string[]): SelectorValue {
        try {
            // //logger.debug(`executeNativeMethod: ${methodName}`, { value_type: typeof value, args })
            const convertedArgs = args.map((arg) => {
                if (arg === "true") return true
                if (arg === "false") return false
                const num = Number(arg)
                // Ensure empty strings or strings that are just whitespace don't become 0
                if (!isNaN(num) && isFinite(num) && arg.trim() !== "") return num
                return arg
            })
            // //logger.debug(`Converted args for native method:`, convertedArgs)
            const result = (value as any)[methodName](...convertedArgs)
            // //logger.debug(`Native method '${methodName}' result:`, result)
            return result
        } catch (error) {
            logger.error(`Error in executeNativeMethod '${methodName}':`, error)
            throw ErrorFactory.execution(
                `Error calling native method '${methodName}': ${error instanceof Error ? error.message : String(error)}`,
            )
        }
    }

    private generateCacheKey(commands: Command[], element: Element | Document): string {
        const commandsStr = JSON.stringify(commands)
        const elementId = element instanceof Element ? element.id || element.tagName + element.className : "document"
        return `${commandsStr}:${elementId}`
    }
}
