import type { SuperSelectorConfig, ExecutionResult, SelectorValue, Plugin } from "../types"
import { ConfigManager } from "./config"
import { Parser } from "../parser/parser"
import { ExecutionEngine } from "./execution-engine"
import { Cache } from "./cache"
import { EventEmitter } from "./event-emitter"
import { logger, LogLevel } from "./logger"
import { commandRegistry } from "../commands/registry"
import { registerBuiltInCommands } from "../commands/built-in"
import { ErrorFactory } from "./errors"

/**
 * Main SuperSelector class - refactored for extensibility
 */
export class SuperSelector {
    private static instance: SuperSelector | null = null

    private configManager: ConfigManager
    private parser: Parser
    private executionEngine: ExecutionEngine
    private cache: Cache
    private eventEmitter: EventEmitter
    private plugins: Map<string, Plugin> = new Map()
    private initialized = false

    constructor(config: Partial<SuperSelectorConfig> = {}) {
        this.configManager = new ConfigManager(config)
        this.parser = new Parser()
        this.cache = new Cache(this.configManager.get("cacheTTL"))
        this.eventEmitter = new EventEmitter()
        this.executionEngine = new ExecutionEngine(this.cache, this.eventEmitter)

        this.initialize()
    }

    /**
     * Get singleton instance
     */
    static getInstance(config?: Partial<SuperSelectorConfig>): SuperSelector {
        if (!SuperSelector.instance) {
            SuperSelector.instance = new SuperSelector(config)
        }
        return SuperSelector.instance
    }

    /**
     * Static method for backward compatibility
     */
    static async superSelector(selector: string, element: Element | Document = document): Promise<SelectorValue> {
        const instance = SuperSelector.getInstance()
        const result = await instance.execute(selector, element)
        return result.value
    }

    /**
     * Static method for finding single element
     */
    static async findElement(selector: string, element: Element | Document = document): Promise<Element | null> {
        const result = await SuperSelector.superSelector(selector, element)

        if (Array.isArray(result)) {
            return (result[0] as Element) || null
        }

        return (result as Element) || null
    }

    /**
     * Initialize the SuperSelector instance
     */
    private initialize(): void {
        if (this.initialized) return

        // Set up logging
        if (this.configManager.get("debug")) {
            logger.setLevel(LogLevel.DEBUG)
        }

        // Register built-in commands
        registerBuiltInCommands()

        // Register custom commands from config
        const customCommands = this.configManager.get("customCommands")
        for (const [name, handler] of Object.entries(customCommands)) {
            commandRegistry.register(name, handler)
        }

        // Load plugins
        this.loadPlugins()

        // Set up cache cleanup interval
        if (this.configManager.get("cacheEnabled")) {
            setInterval(() => {
                this.cache.cleanup()
            }, 60000) // Cleanup every minute
        }

        this.initialized = true
        //logger.info("SuperSelector initialized")
    }

    /**
     * Execute a selector string
     */
    async execute(selector: string, element: Element | Document = document): Promise<ExecutionResult> {
        if (!selector || !element) {
            return {
                success: false,
                value: null,
                error: ErrorFactory.validation("Selector and element are required"),
                metadata: {
                    executionTime: 0,
                    commandsExecuted: 0,
                    cacheHit: false,
                },
            }
        }

        // Parse selector
        const parseResult = this.parser.parse(selector)
        if (!parseResult.isValid) {
            return {
                success: false,
                value: null,
                error: ErrorFactory.parse(`Parse errors: ${parseResult.errors.join(", ")}`),
                metadata: {
                    executionTime: 0,
                    commandsExecuted: 0,
                    cacheHit: false,
                },
            }
        }

        // Execute commands
        return await this.executionEngine.execute(parseResult.commands, element, this.configManager.getAll())
    }

    /**
     * Plugin management
     */
    loadPlugin(plugin: Plugin): void {
        if (this.plugins.has(plugin.name)) {
            logger.warn(`Plugin '${plugin.name}' is already loaded`)
            return
        }

        try {
            // Register plugin commands
            if (plugin.commands) {
                for (const [name, handler] of Object.entries(plugin.commands)) {
                    commandRegistry.register(name, handler)
                }
            }

            // Register plugin hooks
            if (plugin.hooks) {
                for (const [event, handler] of Object.entries(plugin.hooks)) {
                    this.eventEmitter.on(event, (eventData) => handler(eventData.data))
                }
            }

            // Initialize plugin
            if (plugin.initialize) {
                plugin.initialize(this.configManager.getAll())
            }

            this.plugins.set(plugin.name, plugin)
            logger.info(`Plugin loaded: ${plugin.name} v${plugin.version}`)
        } catch (error) {
            throw ErrorFactory.plugin(
                `Failed to load plugin: ${error instanceof Error ? error.message : String(error)}`,
                plugin.name,
            )
        }
    }

    unloadPlugin(pluginName: string): boolean {
        const plugin = this.plugins.get(pluginName)
        if (!plugin) {
            return false
        }

        try {
            // Unregister commands
            if (plugin.commands) {
                for (const commandName of Object.keys(plugin.commands)) {
                    commandRegistry.unregister(commandName)
                }
            }

            // Clean up plugin
            if (plugin.destroy) {
                plugin.destroy()
            }

            this.plugins.delete(pluginName)
            logger.info(`Plugin unloaded: ${pluginName}`)
            return true
        } catch (error) {
            logger.error(`Error unloading plugin '${pluginName}':`, error)
            return false
        }
    }

    private loadPlugins(): void {
        //const pluginNames = this.configManager.get("plugins")
        // Plugin loading would be implemented based on the environment
        // For now, this is a placeholder for the plugin loading mechanism
        // logger.debug(`Configured plugins: ${pluginNames.join(", ")}`)
    }

    /**
     * Configuration management
     */
    configure(updates: Partial<SuperSelectorConfig>): void {
        this.configManager.update(updates)

        // Update logger level if debug setting changed
        if ("debug" in updates) {
            logger.setLevel(updates.debug ? LogLevel.DEBUG : LogLevel.INFO)
        }

        // Update cache TTL if changed
        if ("cacheTTL" in updates && updates.cacheTTL) {
            this.cache = new Cache(updates.cacheTTL)
        }

        // logger.debug("Configuration updated", updates)
    }

    getConfig(): SuperSelectorConfig {
        return this.configManager.getAll()
    }

    /**
     * Utility methods
     */
    clearCache(): void {
        this.cache.clear()
    }

    getCacheStats(): { size: number; totalHits: number; averageAge: number } {
        return this.cache.getStats()
    }

    getLoadedPlugins(): string[] {
        return Array.from(this.plugins.keys())
    }

    getAvailableCommands(): string[] {
        return commandRegistry.list()
    }

    on(event: string, listener: (data: any) => void): void {
        this.eventEmitter.on(event, listener)
    }

    off(event: string, listener: (data: any) => void): void {
        this.eventEmitter.off(event, listener)
    }

    /**
     * Cleanup
     */
    destroy(): void {
        // Unload all plugins
        for (const pluginName of this.plugins.keys()) {
            this.unloadPlugin(pluginName)
        }

        // Clear cache
        this.cache.clear()

        // Remove all event listeners
        this.eventEmitter.removeAllListeners()

        // Clear command registry
        commandRegistry.clear()

        this.initialized = false
        SuperSelector.instance = null

        //logger.info("SuperSelector destroyed")
    }
}
