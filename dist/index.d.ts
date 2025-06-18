/**
 * Represents a command that is a simple CSS selector string.
 */
export interface CssSelectorCommand extends BaseCommand {
    type: "css-selector";
    selector: string;
}
/**
 * Represents a parsed function call command.
 */
export interface ParsedFunctionCommand {
    type: "function";
    command: string;
    params: string[] | null;
}
/**
 * Represents a parsed array position access command.
 */
export interface ParsedArrayPositionCommand {
    type: "arrayPosition";
    command: number;
}
/**
 * Represents a parsed property access command (for legacy parser).
 */
export interface ParsedPropertyCommand {
    type: "property";
    name: string;
}
/**
 * Union type for all possible parsed command types.
 */
export type ParsedCommand = CssSelectorCommand | ParsedFunctionCommand | ParsedArrayPositionCommand | ParsedPropertyCommand;
/**
 * Type for elements that SuperSelector can operate on initially.
 */
export type QueryableElement = Document | Element;
/**
 * Type for the current target of operations within SuperSelector, which can be a single item or an array.
 * It can also be any value if properties are being accessed.
 */
export type SelectorTarget = any | any[];
/**
 * Core type definitions for SuperSelector
 */
export type Primitive = string | number | boolean | null | undefined;
export type SelectorValue = Primitive | Element | Element[] | any[] | Record<string, any>;
export interface BaseCommand {
    type: string;
    name: string;
}
export interface FunctionCommand extends BaseCommand {
    type: "function";
    name: string;
    args: string[];
}
export interface PropertyCommand extends BaseCommand {
    type: "property";
    name: string;
}
export interface ArrayAccessCommand extends BaseCommand {
    type: "array-access";
    index: number;
}
export interface PipeCommand extends BaseCommand {
    type: "pipe";
    commands: Command[];
}
export type Command = CssSelectorCommand | FunctionCommand | PropertyCommand | ArrayAccessCommand | PipeCommand;
export interface ExecutionContext {
    element: Element | Document;
    currentValue: SelectorValue;
    config: SuperSelectorConfig;
    metadata: Record<string, any>;
    hadSoftError?: boolean;
    softError?: SuperSelectorError;
}
export interface Plugin {
    name: string;
    version: string;
    commands?: Record<string, CommandHandler>;
    hooks?: Record<string, HookHandler>;
    initialize?(config: SuperSelectorConfig): void;
    destroy?(): void;
}
export interface CommandHandler {
    execute(context: ExecutionContext, ...args: any[]): SelectorValue;
    validate?(args: any[]): boolean;
    description?: string;
}
export type HookHandler = (context: ExecutionContext, data?: any) => void | Promise<void>;
export interface SuperSelectorConfig {
    debug: boolean;
    timeout: number;
    maxDepth: number;
    cacheEnabled: boolean;
    cacheTTL: number;
    errorHandling: "throw" | "return-null" | "return-default";
    defaultValue: any;
    plugins: string[];
    customCommands: Record<string, CommandHandler>;
}
export interface ExecutionResult<T = SelectorValue> {
    success: boolean;
    value: T | null;
    error?: SuperSelectorError;
    metadata: {
        executionTime: number;
        commandsExecuted: number;
        cacheHit: boolean;
    };
}
export interface SuperSelectorError extends Error {
    code: string;
    command?: Command | undefined;
    context?: Partial<ExecutionContext> | undefined;
}
export interface ParseResult {
    commands: Command[];
    isValid: boolean;
    errors: string[];
}
export interface CacheEntry<T = SelectorValue> {
    value: T;
    timestamp: number;
    ttl: number;
    hits: number;
}
export interface SuperSelectorEvent {
    type: string;
    data: any;
    timestamp: number;
}
export type EventListener = (event: SuperSelectorEvent) => void;
export interface LegacyParsedFunctionCommand {
    type: "function";
    command: string;
    params: string[] | null;
}
export interface LegacyParsedArrayPositionCommand {
    type: "arrayPosition";
    command: number;
}
export type LegacyQueryableElement = Document | Element;
export type LegacySelectorTarget = any | any[];
//# sourceMappingURL=index.d.ts.map