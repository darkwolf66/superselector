"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManager = exports.DEFAULT_CONFIG = void 0;
/**
 * Default configuration for SuperSelector
 */
exports.DEFAULT_CONFIG = {
    debug: false,
    timeout: 5000,
    maxDepth: 50,
    cacheEnabled: true,
    cacheTTL: 60000,
    errorHandling: "return-null",
    defaultValue: null,
    plugins: [],
    customCommands: {},
};
/**
 * Configuration manager for SuperSelector
 */
class ConfigManager {
    constructor(initialConfig = {}) {
        this.config = { ...exports.DEFAULT_CONFIG, ...initialConfig };
    }
    get(key) {
        return this.config[key];
    }
    set(key, value) {
        this.config[key] = value;
    }
    update(updates) {
        this.config = { ...this.config, ...updates };
    }
    getAll() {
        return { ...this.config };
    }
    reset() {
        this.config = { ...exports.DEFAULT_CONFIG };
    }
}
exports.ConfigManager = ConfigManager;
//# sourceMappingURL=config.js.map