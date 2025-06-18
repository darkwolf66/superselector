"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commandRegistry = exports.CommandRegistry = void 0;
const errors_1 = require("../core/errors");
const logger_1 = require("../core/logger");
/**
 * Registry for all SuperSelector commands
 */
class CommandRegistry {
    constructor() {
        this.commands = new Map();
    }
    register(name, handler) {
        if (this.commands.has(name)) {
            logger_1.logger.warn(`Command '${name}' is being overridden`);
        }
        this.commands.set(name, handler);
        // logger.debug(`Command registered: ${name}`)
    }
    unregister(name) {
        const removed = this.commands.delete(name);
        if (removed) {
            // logger.debug(`Command unregistered: ${name}`)
        }
        return removed;
    }
    has(name) {
        return this.commands.has(name);
    }
    get(name) {
        return this.commands.get(name);
    }
    execute(name, context, ...args) {
        const handler = this.commands.get(name);
        if (!handler) {
            throw errors_1.ErrorFactory.execution(`Unknown command: ${name}`);
        }
        // Validate arguments if validator exists
        if (handler.validate && !handler.validate(args)) {
            throw errors_1.ErrorFactory.validation(`Invalid arguments for command '${name}': ${JSON.stringify(args)}`);
        }
        try {
            return handler.execute(context, ...args);
        }
        catch (error) {
            throw errors_1.ErrorFactory.execution(`Error executing command '${name}': ${error instanceof Error ? error.message : String(error)}`, undefined, context);
        }
    }
    list() {
        return Array.from(this.commands.keys()).sort();
    }
    getInfo(name) {
        const handler = this.commands.get(name);
        if (!handler)
            return null;
        return {
            name,
            description: handler.description ?? 'No description provided',
            hasValidator: typeof handler.validate === "function",
        };
    }
    clear() {
        //const count = this.commands.size
        this.commands.clear();
        //logger.debug(`Command registry cleared: ${count} commands removed`)
    }
}
exports.CommandRegistry = CommandRegistry;
// Global command registry
exports.commandRegistry = new CommandRegistry();
//# sourceMappingURL=registry.js.map