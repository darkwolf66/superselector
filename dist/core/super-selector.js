"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperSelector = void 0;
const config_1 = require("./config");
const parser_1 = require("../parser/parser");
const execution_engine_1 = require("./execution-engine");
const cache_1 = require("./cache");
const event_emitter_1 = require("./event-emitter");
const logger_1 = require("./logger");
const registry_1 = require("../commands/registry");
const built_in_1 = require("../commands/built-in");
const errors_1 = require("./errors");
/**
 * Main SuperSelector class - refactored for extensibility
 */
class SuperSelector {
    constructor(config = {}) {
        this.plugins = new Map();
        this.initialized = false;
        this.configManager = new config_1.ConfigManager(config);
        this.parser = new parser_1.Parser();
        this.cache = new cache_1.Cache(this.configManager.get("cacheTTL"));
        this.eventEmitter = new event_emitter_1.EventEmitter();
        this.executionEngine = new execution_engine_1.ExecutionEngine(this.cache, this.eventEmitter);
        this.initialize();
    }
    /**
     * Get singleton instance
     */
    static getInstance(config) {
        if (!SuperSelector.instance) {
            SuperSelector.instance = new SuperSelector(config);
        }
        return SuperSelector.instance;
    }
    /**
     * Static method for backward compatibility
     */
    static async superSelector(selector, element = document) {
        const instance = SuperSelector.getInstance();
        const result = await instance.execute(selector, element);
        return result.value;
    }
    /**
     * Static method for finding single element
     */
    static async findElement(selector, element = document) {
        const result = await SuperSelector.superSelector(selector, element);
        if (Array.isArray(result)) {
            return result[0] || null;
        }
        return result || null;
    }
    /**
     * Initialize the SuperSelector instance
     */
    initialize() {
        if (this.initialized)
            return;
        // Set up logging
        if (this.configManager.get("debug")) {
            logger_1.logger.setLevel(logger_1.LogLevel.DEBUG);
        }
        // Register built-in commands
        (0, built_in_1.registerBuiltInCommands)();
        // Register custom commands from config
        const customCommands = this.configManager.get("customCommands");
        for (const [name, handler] of Object.entries(customCommands)) {
            registry_1.commandRegistry.register(name, handler);
        }
        // Load plugins
        this.loadPlugins();
        // Set up cache cleanup interval
        if (this.configManager.get("cacheEnabled")) {
            setInterval(() => {
                this.cache.cleanup();
            }, 60000); // Cleanup every minute
        }
        this.initialized = true;
        //logger.info("SuperSelector initialized")
    }
    /**
     * Execute a selector string
     */
    async execute(selector, element = document) {
        if (!selector || !element) {
            return {
                success: false,
                value: null,
                error: errors_1.ErrorFactory.validation("Selector and element are required"),
                metadata: {
                    executionTime: 0,
                    commandsExecuted: 0,
                    cacheHit: false,
                },
            };
        }
        // Parse selector
        const parseResult = this.parser.parse(selector);
        if (!parseResult.isValid) {
            return {
                success: false,
                value: null,
                error: errors_1.ErrorFactory.parse(`Parse errors: ${parseResult.errors.join(", ")}`),
                metadata: {
                    executionTime: 0,
                    commandsExecuted: 0,
                    cacheHit: false,
                },
            };
        }
        // Execute commands
        return await this.executionEngine.execute(parseResult.commands, element, this.configManager.getAll());
    }
    /**
     * Plugin management
     */
    loadPlugin(plugin) {
        if (this.plugins.has(plugin.name)) {
            logger_1.logger.warn(`Plugin '${plugin.name}' is already loaded`);
            return;
        }
        try {
            // Register plugin commands
            if (plugin.commands) {
                for (const [name, handler] of Object.entries(plugin.commands)) {
                    registry_1.commandRegistry.register(name, handler);
                }
            }
            // Register plugin hooks
            if (plugin.hooks) {
                for (const [event, handler] of Object.entries(plugin.hooks)) {
                    this.eventEmitter.on(event, (eventData) => handler(eventData.data));
                }
            }
            // Initialize plugin
            if (plugin.initialize) {
                plugin.initialize(this.configManager.getAll());
            }
            this.plugins.set(plugin.name, plugin);
            logger_1.logger.info(`Plugin loaded: ${plugin.name} v${plugin.version}`);
        }
        catch (error) {
            throw errors_1.ErrorFactory.plugin(`Failed to load plugin: ${error instanceof Error ? error.message : String(error)}`, plugin.name);
        }
    }
    unloadPlugin(pluginName) {
        const plugin = this.plugins.get(pluginName);
        if (!plugin) {
            return false;
        }
        try {
            // Unregister commands
            if (plugin.commands) {
                for (const commandName of Object.keys(plugin.commands)) {
                    registry_1.commandRegistry.unregister(commandName);
                }
            }
            // Clean up plugin
            if (plugin.destroy) {
                plugin.destroy();
            }
            this.plugins.delete(pluginName);
            logger_1.logger.info(`Plugin unloaded: ${pluginName}`);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Error unloading plugin '${pluginName}':`, error);
            return false;
        }
    }
    loadPlugins() {
        //const pluginNames = this.configManager.get("plugins")
        // Plugin loading would be implemented based on the environment
        // For now, this is a placeholder for the plugin loading mechanism
        // logger.debug(`Configured plugins: ${pluginNames.join(", ")}`)
    }
    /**
     * Configuration management
     */
    configure(updates) {
        this.configManager.update(updates);
        // Update logger level if debug setting changed
        if ("debug" in updates) {
            logger_1.logger.setLevel(updates.debug ? logger_1.LogLevel.DEBUG : logger_1.LogLevel.INFO);
        }
        // Update cache TTL if changed
        if ("cacheTTL" in updates && updates.cacheTTL) {
            this.cache = new cache_1.Cache(updates.cacheTTL);
        }
        // logger.debug("Configuration updated", updates)
    }
    getConfig() {
        return this.configManager.getAll();
    }
    /**
     * Utility methods
     */
    clearCache() {
        this.cache.clear();
    }
    getCacheStats() {
        return this.cache.getStats();
    }
    getLoadedPlugins() {
        return Array.from(this.plugins.keys());
    }
    getAvailableCommands() {
        return registry_1.commandRegistry.list();
    }
    on(event, listener) {
        this.eventEmitter.on(event, listener);
    }
    off(event, listener) {
        this.eventEmitter.off(event, listener);
    }
    /**
     * Cleanup
     */
    destroy() {
        // Unload all plugins
        for (const pluginName of this.plugins.keys()) {
            this.unloadPlugin(pluginName);
        }
        // Clear cache
        this.cache.clear();
        // Remove all event listeners
        this.eventEmitter.removeAllListeners();
        // Clear command registry
        registry_1.commandRegistry.clear();
        this.initialized = false;
        SuperSelector.instance = null;
        //logger.info("SuperSelector destroyed")
    }
}
exports.SuperSelector = SuperSelector;
SuperSelector.instance = null;
//# sourceMappingURL=super-selector.js.map