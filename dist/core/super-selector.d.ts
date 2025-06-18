import type { SuperSelectorConfig, ExecutionResult, SelectorValue, Plugin } from "../types";
/**
 * Main SuperSelector class - refactored for extensibility
 */
export declare class SuperSelector {
    private static instance;
    private configManager;
    private parser;
    private executionEngine;
    private cache;
    private eventEmitter;
    private plugins;
    private initialized;
    constructor(config?: Partial<SuperSelectorConfig>);
    /**
     * Get singleton instance
     */
    static getInstance(config?: Partial<SuperSelectorConfig>): SuperSelector;
    /**
     * Static method for backward compatibility
     */
    static superSelector(selector: string, element?: Element | Document): Promise<SelectorValue>;
    /**
     * Static method for finding single element
     */
    static findElement(selector: string, element?: Element | Document): Promise<Element | null>;
    /**
     * Initialize the SuperSelector instance
     */
    private initialize;
    /**
     * Execute a selector string
     */
    execute(selector: string, element?: Element | Document): Promise<ExecutionResult>;
    /**
     * Plugin management
     */
    loadPlugin(plugin: Plugin): void;
    unloadPlugin(pluginName: string): boolean;
    private loadPlugins;
    /**
     * Configuration management
     */
    configure(updates: Partial<SuperSelectorConfig>): void;
    getConfig(): SuperSelectorConfig;
    /**
     * Utility methods
     */
    clearCache(): void;
    getCacheStats(): {
        size: number;
        totalHits: number;
        averageAge: number;
    };
    getLoadedPlugins(): string[];
    getAvailableCommands(): string[];
    on(event: string, listener: (data: any) => void): void;
    off(event: string, listener: (data: any) => void): void;
    /**
     * Cleanup
     */
    destroy(): void;
}
//# sourceMappingURL=super-selector.d.ts.map