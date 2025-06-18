import type { SuperSelectorError, Command, ExecutionContext } from "../types"

/**
 * Custom error classes for SuperSelector
 */
export class SuperSelectorErrorImpl extends Error implements SuperSelectorError {
    public readonly code: string
    public readonly command?: Command | undefined
    public readonly context?: Partial<ExecutionContext> | undefined

    constructor(message: string, code: string, command?: Command, context?: Partial<ExecutionContext>) {
        super(message)
        this.name = "SuperSelectorError"
        this.code = code
        this.command = command
        this.context = context
    }
}

export class ParseError extends SuperSelectorErrorImpl {
    constructor(message: string, command?: Command) {
        super(message, "PARSE_ERROR", command)
        this.name = "ParseError"
    }
}

export class ExecutionError extends SuperSelectorErrorImpl {
    constructor(message: string, command?: Command, context?: Partial<ExecutionContext>) {
        super(message, "EXECUTION_ERROR", command, context)
        this.name = "ExecutionError"
    }
}

export class ValidationError extends SuperSelectorErrorImpl {
    constructor(message: string, command?: Command) {
        super(message, "VALIDATION_ERROR", command)
        this.name = "ValidationError"
    }
}

export class TimeoutError extends SuperSelectorErrorImpl {
    constructor(timeout: number) {
        super(`Operation timed out after ${timeout}ms`, "TIMEOUT_ERROR")
        this.name = "TimeoutError"
    }
}

export class PluginError extends SuperSelectorErrorImpl {
    constructor(message: string, pluginName: string) {
        super(`Plugin '${pluginName}': ${message}`, "PLUGIN_ERROR")
        this.name = "PluginError"
    }
}

/**
 * Error factory for creating consistent errors
 */
export class ErrorFactory {
    static parse(message: string, command?: Command): ParseError {
        return new ParseError(message, command)
    }

    static execution(message: string, command?: Command, context?: Partial<ExecutionContext>): ExecutionError {
        return new ExecutionError(message, command, context)
    }

    static validation(message: string, command?: Command): ValidationError {
        return new ValidationError(message, command)
    }

    static timeout(timeout: number): TimeoutError {
        return new TimeoutError(timeout)
    }

    static plugin(message: string, pluginName: string): PluginError {
        return new PluginError(message, pluginName)
    }
}
