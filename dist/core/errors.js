"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorFactory = exports.PluginError = exports.TimeoutError = exports.ValidationError = exports.ExecutionError = exports.ParseError = exports.SuperSelectorErrorImpl = void 0;
/**
 * Custom error classes for SuperSelector
 */
class SuperSelectorErrorImpl extends Error {
    constructor(message, code, command, context) {
        super(message);
        this.name = "SuperSelectorError";
        this.code = code;
        this.command = command;
        this.context = context;
    }
}
exports.SuperSelectorErrorImpl = SuperSelectorErrorImpl;
class ParseError extends SuperSelectorErrorImpl {
    constructor(message, command) {
        super(message, "PARSE_ERROR", command);
        this.name = "ParseError";
    }
}
exports.ParseError = ParseError;
class ExecutionError extends SuperSelectorErrorImpl {
    constructor(message, command, context) {
        super(message, "EXECUTION_ERROR", command, context);
        this.name = "ExecutionError";
    }
}
exports.ExecutionError = ExecutionError;
class ValidationError extends SuperSelectorErrorImpl {
    constructor(message, command) {
        super(message, "VALIDATION_ERROR", command);
        this.name = "ValidationError";
    }
}
exports.ValidationError = ValidationError;
class TimeoutError extends SuperSelectorErrorImpl {
    constructor(timeout) {
        super(`Operation timed out after ${timeout}ms`, "TIMEOUT_ERROR");
        this.name = "TimeoutError";
    }
}
exports.TimeoutError = TimeoutError;
class PluginError extends SuperSelectorErrorImpl {
    constructor(message, pluginName) {
        super(`Plugin '${pluginName}': ${message}`, "PLUGIN_ERROR");
        this.name = "PluginError";
    }
}
exports.PluginError = PluginError;
/**
 * Error factory for creating consistent errors
 */
class ErrorFactory {
    static parse(message, command) {
        return new ParseError(message, command);
    }
    static execution(message, command, context) {
        return new ExecutionError(message, command, context);
    }
    static validation(message, command) {
        return new ValidationError(message, command);
    }
    static timeout(timeout) {
        return new TimeoutError(timeout);
    }
    static plugin(message, pluginName) {
        return new PluginError(message, pluginName);
    }
}
exports.ErrorFactory = ErrorFactory;
//# sourceMappingURL=errors.js.map