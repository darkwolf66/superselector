import type { CommandHandler, ExecutionContext, SelectorValue } from "../types";
/**
 * Registry for all SuperSelector commands
 */
export declare class CommandRegistry {
    private commands;
    register(name: string, handler: CommandHandler): void;
    unregister(name: string): boolean;
    has(name: string): boolean;
    get(name: string): CommandHandler | undefined;
    execute(name: string, context: ExecutionContext, ...args: any[]): SelectorValue;
    list(): string[];
    getInfo(name: string): {
        name: string;
        description?: string;
        hasValidator: boolean;
    } | null;
    clear(): void;
}
export declare const commandRegistry: CommandRegistry;
//# sourceMappingURL=registry.d.ts.map