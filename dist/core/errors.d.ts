import type { SuperSelectorError, Command, ExecutionContext } from "../types";
/**
 * Custom error classes for SuperSelector
 */
export declare class SuperSelectorErrorImpl extends Error implements SuperSelectorError {
    readonly code: string;
    readonly command?: Command | undefined;
    readonly context?: Partial<ExecutionContext> | undefined;
    constructor(message: string, code: string, command?: Command, context?: Partial<ExecutionContext>);
}
export declare class ParseError extends SuperSelectorErrorImpl {
    constructor(message: string, command?: Command);
}
export declare class ExecutionError extends SuperSelectorErrorImpl {
    constructor(message: string, command?: Command, context?: Partial<ExecutionContext>);
}
export declare class ValidationError extends SuperSelectorErrorImpl {
    constructor(message: string, command?: Command);
}
export declare class TimeoutError extends SuperSelectorErrorImpl {
    constructor(timeout: number);
}
export declare class PluginError extends SuperSelectorErrorImpl {
    constructor(message: string, pluginName: string);
}
/**
 * Error factory for creating consistent errors
 */
export declare class ErrorFactory {
    static parse(message: string, command?: Command): ParseError;
    static execution(message: string, command?: Command, context?: Partial<ExecutionContext>): ExecutionError;
    static validation(message: string, command?: Command): ValidationError;
    static timeout(timeout: number): TimeoutError;
    static plugin(message: string, pluginName: string): PluginError;
}
//# sourceMappingURL=errors.d.ts.map