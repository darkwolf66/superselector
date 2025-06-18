/**
 * @jest-environment jsdom
 */
import { SuperSelector } from "../src/core/super-selector"
import { commandRegistry } from "../src/commands/registry"

describe("Debug Test", () => {
    beforeEach(() => {
        document.body.innerHTML = `
      <div id="container">
        <a href="/path/to/page.html" title="Test Link">Link</a>
      </div>
    `
    })

    it("should debug the function call issue", async () => {
        const superSelector = new SuperSelector({ debug: true })

        console.log("Available commands:", commandRegistry.list())

        // Test 1: CSS selector only
        console.log("\n=== Testing CSS selector only ===")
        const aResult = await superSelector.execute("a")
        console.log("CSS selector result:", {
            success: aResult.success,
            value: aResult.value,
            valueType: typeof aResult.value,
            isElement: aResult.value instanceof Element,
            error: aResult.error?.message,
        })

        if (aResult.value instanceof Element) {
            console.log("Element details:", {
                tagName: aResult.value.tagName,
                href: aResult.value.getAttribute("href"),
                hasGetAttribute: typeof aResult.value.getAttribute === "function",
            })
        }

        // Test 2: Function call
        console.log("\n=== Testing function call ===")
        const result = await superSelector.execute('a | getAttribute("href")')
        console.log("Function call result:", {
            success: result.success,
            value: result.value,
            error: result.error?.message,
            errorCode: result.error?.code,
        })

        if (result.error) {
            console.log("Full error object:", result.error)
        }

        // Test 3: Check if getAttribute is detected as native method
        console.log("\n=== Testing native method detection ===")
        const element = document.querySelector("a")
        if (element) {
            console.log("Element getAttribute type:", typeof element.getAttribute)
            console.log("Element getAttribute function:", element.getAttribute.toString().substring(0, 100))
            console.log("Direct call result:", element.getAttribute("href"))
        }

        superSelector.destroy()
    })

    it("should test parser output", async () => {
        const superSelector = new SuperSelector({ debug: true })

        // Let's check what the parser produces
        const parser = (superSelector as any).parser
        const parseResult = parser.parse('a | getAttribute("href")')

        console.log("Parse result:", {
            isValid: parseResult.isValid,
            errors: parseResult.errors,
            commands: parseResult.commands,
        })

        // Check each command in detail
        parseResult.commands.forEach((cmd: any, index: number) => {
            console.log(`Command ${index}:`, cmd)
        })

        superSelector.destroy()
    })
})
