import type { Command, ExecutionResult, SuperSelectorConfig } from "../types";
import type { Cache } from "./cache";
import type { EventEmitter } from "./event-emitter";
/**
 * Core execution engine for SuperSelector
 */
export declare class ExecutionEngine {
    private cache;
    private eventEmitter;
    private executionDepth;
    constructor(cache: Cache, eventEmitter: EventEmitter);
    execute(commands: Command[], element: Element | Document, config: SuperSelectorConfig): Promise<ExecutionResult>;
    private executeCommands;
    private executeCommand;
    private isNativeMethod;
    private executeNativeMethod;
    private generateCacheKey;
}
//# sourceMappingURL=execution-engine.d.ts.map