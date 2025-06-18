import type { SuperSelectorConfig } from "../types";
/**
 * Default configuration for SuperSelector
 */
export declare const DEFAULT_CONFIG: SuperSelectorConfig;
/**
 * Configuration manager for SuperSelector
 */
export declare class ConfigManager {
    private config;
    constructor(initialConfig?: Partial<SuperSelectorConfig>);
    get<K extends keyof SuperSelectorConfig>(key: K): SuperSelectorConfig[K];
    set<K extends keyof SuperSelectorConfig>(key: K, value: SuperSelectorConfig[K]): void;
    update(updates: Partial<SuperSelectorConfig>): void;
    getAll(): SuperSelectorConfig;
    reset(): void;
}
//# sourceMappingURL=config.d.ts.map