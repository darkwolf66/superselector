import type { SuperSelectorConfig } from "../types"

/**
 * Default configuration for SuperSelector
 */
export const DEFAULT_CONFIG: SuperSelectorConfig = {
    debug: false,
    timeout: 5000,
    maxDepth: 50,
    cacheEnabled: true,
    cacheTTL: 60000, // 1 minute
    errorHandling: "return-null",
    defaultValue: null,
    plugins: [],
    customCommands: {},
}

/**
 * Configuration manager for SuperSelector
 */
export class ConfigManager {
    private config: SuperSelectorConfig

    constructor(initialConfig: Partial<SuperSelectorConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...initialConfig }
    }

    get<K extends keyof SuperSelectorConfig>(key: K): SuperSelectorConfig[K] {
        return this.config[key]
    }

    set<K extends keyof SuperSelectorConfig>(key: K, value: SuperSelectorConfig[K]): void {
        this.config[key] = value
    }

    update(updates: Partial<SuperSelectorConfig>): void {
        this.config = { ...this.config, ...updates }
    }

    getAll(): SuperSelectorConfig {
        return { ...this.config }
    }

    reset(): void {
        this.config = { ...DEFAULT_CONFIG }
    }
}
