import { commandRegistry } from "../../src/commands/registry"
import { registerBuiltInCommands } from "../../src/commands/built-in"
import type { ExecutionContext } from "../../src/types"

describe("Built-in Commands", () => {
    beforeEach(() => {
        registerBuiltInCommands()
    })

    afterEach(() => {
        commandRegistry.clear()
    })

    const createMockContext = (currentValue: any): ExecutionContext => ({
        element: document.createElement("div"),
        currentValue,
        config: {
            debug: false,
            timeout: 5000,
            maxDepth: 50,
            cacheEnabled: false,
            cacheTTL: 60000,
            errorHandling: "return-null",
            defaultValue: null,
            plugins: [],
            customCommands: {},
        },
        metadata: {},
    })

    describe("getProp command", () => {
        it("should get property from single object", () => {
            const obj = { name: "test", value: 42 }
            const context = createMockContext(obj)
            const result = commandRegistry.execute("getProp", context, "name")
            expect(result).toBe("test")
        })

        it("should get property from array of objects", () => {
            const arr = [{ id: 1 }, { id: 2 }, { id: 3 }]
            const context = createMockContext(arr)
            const result = commandRegistry.execute("getProp", context, "id")
            expect(result).toEqual([1, 2, 3])
        })

        it("should return null for non-existent property", () => {
            const obj = { name: "test" }
            const context = createMockContext(obj)
            const result = commandRegistry.execute("getProp", context, "nonExistent")
            expect(result).toBeNull()
        })
    })

    describe("recursiveProp command", () => {
        it("should access nested properties", () => {
            const obj = { a: { a: { a: "found" } } }
            const context = createMockContext(obj)
            const result = commandRegistry.execute("recursiveProp", context, "a", 3)
            expect(result).toBe("found")
        })

        it("should handle string times parameter", () => {
            const obj = { prop: { prop: "value" } }
            const context = createMockContext(obj)
            const result = commandRegistry.execute("recursiveProp", context, "prop", "2")
            expect(result).toBe("value")
        })
    })

    describe("propIncludes command", () => {
        it("should filter objects by property inclusion", () => {
            const obj = { text: "Hello World" }
            const context = createMockContext(obj)
            const result = commandRegistry.execute("propIncludes", context, "text", "World")
            expect(result).toBe(obj)
        })

        it("should return null if property does not include string", () => {
            const obj = { text: "Hello World" }
            const context = createMockContext(obj)
            const result = commandRegistry.execute("propIncludes", context, "text", "NotFound")
            expect(result).toBeNull()
        })
    })

    describe("matchProp command", () => {
        it("should match property against regex", () => {
            const obj = { email: "test@example.com" }
            const context = createMockContext(obj)
            const result = commandRegistry.execute("matchProp", context, "email", "\\w+@\\w+\\.\\w+")
            expect(result).toBe(obj)
        })

        it("should return null for non-matching regex", () => {
            const obj = { text: "not an email" }
            const context = createMockContext(obj)
            const result = commandRegistry.execute("matchProp", context, "text", "\\w+@\\w+\\.\\w+")
            expect(result).toBeNull()
        })
    })

    describe("array-access command", () => {
        it("should access array element by positive index", () => {
            const arr = ["a", "b", "c"]
            const context = createMockContext(arr)
            const result = commandRegistry.execute("array-access", context, 1)
            expect(result).toBe("b")
        })

        it("should access array element by negative index", () => {
            const arr = ["a", "b", "c"]
            const context = createMockContext(arr)
            const result = commandRegistry.execute("array-access", context, -1)
            expect(result).toBe("c")
        })

        it("should return null for out of bounds index", () => {
            const arr = ["a", "b", "c"]
            const context = createMockContext(arr)
            const result = commandRegistry.execute("array-access", context, 10)
            expect(result).toBeNull()
        })
    })
})
