/**
 * @jest-environment jsdom
 */
import { SuperSelector } from "../../src/core/super-selector"
import type { Plugin, CommandHandler, ExecutionContext } from "../../src/types"
import { jest } from "@jest/globals"

describe("Plugin System", () => {
    let superSelector: SuperSelector

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="test">
                <p class="content">Test Content</p>
                <span data-value="42">Span</span>
            </div>
        `
        superSelector = new SuperSelector({ debug: true })
    })

    afterEach(() => {
        superSelector.destroy()
    })

    describe("Plugin Loading", () => {
        it("should load a plugin with commands", () => {
            const testCommand: CommandHandler = {
                execute: (_context: ExecutionContext, text: string) => {
                    return `Modified: ${text}`
                },
                validate: (args: any[]) => args.length === 1 && typeof args[0] === "string",
                description: "Test command that modifies text",
            }

            const testPlugin: Plugin = {
                name: "test-plugin",
                version: "1.0.0",
                commands: {
                    modifyText: testCommand,
                },
            }

            // Load the plugin
            superSelector.loadPlugin(testPlugin)

            // Check if plugin is loaded
            const loadedPlugins = superSelector.getLoadedPlugins()
            expect(loadedPlugins).toContain("test-plugin")

            // Check if command is available
            const availableCommands = superSelector.getAvailableCommands()
            expect(availableCommands).toContain("modifyText")
        })

        it("should execute plugin commands", async () => {
            const testCommand: CommandHandler = {
                execute: (context: ExecutionContext, multiplier: string) => {
                    const current = context.currentValue
                    if (typeof current === "string" && !isNaN(Number(multiplier))) {
                        return current.repeat(Number(multiplier))
                    }
                    return current
                },
                validate: (args: any[]) => args.length === 1,
                description: "Repeats text content",
            }

            const testPlugin: Plugin = {
                name: "text-plugin",
                version: "1.0.0",
                commands: {
                    repeatText: testCommand,
                },
            }

            superSelector.loadPlugin(testPlugin)

            // Test the plugin command
            const result = await superSelector.execute('#test .content | textContent | repeatText("3")')

            console.log("Plugin command test result:", {
                success: result.success,
                value: result.value,
                error: result.error?.message,
            })

            expect(result.success).toBe(true)
            expect(result.value).toBe("Test ContentTest ContentTest Content")
        })

        it("should handle plugin with hooks", (done) => {
            let hookCalled = false
            let hookData: any = null

            const testPlugin: Plugin = {
                name: "hook-plugin",
                version: "1.0.0",
                hooks: {
                    "execution:start": (data: any) => {
                        hookCalled = true
                        hookData = data
                    },
                },
            }

            superSelector.loadPlugin(testPlugin)

            // Execute something to trigger the hook
            superSelector.execute("#test").then(() => {
                setTimeout(() => {
                    expect(hookCalled).toBe(true)
                    expect(hookData).toBeDefined()
                    done()
                }, 100)
            })
        })

        it("should initialize plugin on load", () => {
            let initializeCalled = false
            let initConfig: any = null

            const testPlugin: Plugin = {
                name: "init-plugin",
                version: "1.0.0",
                initialize: (config) => {
                    initializeCalled = true
                    initConfig = config
                },
            }

            superSelector.loadPlugin(testPlugin)

            expect(initializeCalled).toBe(true)
            expect(initConfig).toBeDefined()
            expect(initConfig.debug).toBe(true) // We set debug: true in beforeEach
        })
    })

    describe("Plugin Unloading", () => {
        it("should unload plugin and remove commands", () => {
            const testCommand: CommandHandler = {
                execute: (_context: ExecutionContext) => "test result",
                description: "Test command",
            }

            const testPlugin: Plugin = {
                name: "removable-plugin",
                version: "1.0.0",
                commands: {
                    testCommand: testCommand,
                },
            }

            // Load plugin
            superSelector.loadPlugin(testPlugin)
            expect(superSelector.getLoadedPlugins()).toContain("removable-plugin")
            expect(superSelector.getAvailableCommands()).toContain("testCommand")

            // Unload plugin
            const unloaded = superSelector.unloadPlugin("removable-plugin")
            expect(unloaded).toBe(true)
            expect(superSelector.getLoadedPlugins()).not.toContain("removable-plugin")
            expect(superSelector.getAvailableCommands()).not.toContain("testCommand")
        })

        it("should call destroy method when unloading", () => {
            let destroyCalled = false

            const testPlugin: Plugin = {
                name: "destroyable-plugin",
                version: "1.0.0",
                destroy: () => {
                    destroyCalled = true
                },
            }

            superSelector.loadPlugin(testPlugin)
            superSelector.unloadPlugin("destroyable-plugin")

            expect(destroyCalled).toBe(true)
        })

        it("should return false when trying to unload non-existent plugin", () => {
            const result = superSelector.unloadPlugin("non-existent-plugin")
            expect(result).toBe(false)
        })
    })

    describe("Plugin Error Handling", () => {
        it("should handle plugin loading errors", () => {
            const badPlugin: Plugin = {
                name: "bad-plugin",
                version: "1.0.0",
                initialize: () => {
                    throw new Error("Plugin initialization failed")
                },
            }

            expect(() => {
                superSelector.loadPlugin(badPlugin)
            }).toThrow("Plugin 'bad-plugin': Failed to load plugin: Plugin initialization failed")
        })

        it("should warn when loading duplicate plugin", () => {
            const plugin: Plugin = {
                name: "duplicate-plugin",
                version: "1.0.0",
            }

            // Mock console.warn to capture warnings
            const originalWarn = console.warn
            const warnSpy = jest.fn()
            console.warn = warnSpy

            try {
                superSelector.loadPlugin(plugin)
                superSelector.loadPlugin(plugin) // Load again

                // The logger adds an empty string as second parameter when no data is provided
                expect(warnSpy).toHaveBeenCalledWith("[SuperSelector] Plugin 'duplicate-plugin' is already loaded", "")
            } finally {
                console.warn = originalWarn
            }
        })
    })

    describe("Complex Plugin Scenarios", () => {
        it("should handle plugin with multiple commands and hooks", async () => {
            let executionCount = 0

            const mathPlugin: Plugin = {
                name: "math-plugin",
                version: "1.0.0",
                commands: {
                    add: {
                        execute: (context: ExecutionContext, value: string) => {
                            const current = Number(context.currentValue) || 0
                            const addValue = Number(value) || 0
                            return current + addValue
                        },
                        validate: (args: any[]) => args.length === 1,
                        description: "Add a number to current value",
                    },
                    multiply: {
                        execute: (context: ExecutionContext, value: string) => {
                            const current = Number(context.currentValue) || 0
                            const multiplyValue = Number(value) || 1
                            return current * multiplyValue
                        },
                        validate: (args: any[]) => args.length === 1,
                        description: "Multiply current value by a number",
                    },
                },
                hooks: {
                    "command:executed": () => {
                        executionCount++
                    },
                },
            }

            superSelector.loadPlugin(mathPlugin)

            // Test chaining plugin commands
            const result = await superSelector.execute('#test span | getAttribute("data-value") | add("8") | multiply("2")')

            console.log("Complex plugin test result:", {
                success: result.success,
                value: result.value,
                error: result.error?.message,
                executionCount,
            })

            expect(result.success).toBe(true)
            expect(result.value).toBe(100) // (42 + 8) * 2 = 100
            expect(executionCount).toBeGreaterThan(0)
        })
    })
})
