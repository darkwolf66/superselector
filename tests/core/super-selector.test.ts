/**
 * @jest-environment jsdom
 */
import { SuperSelector } from "../../src/core/super-selector"

describe("SuperSelector (Refactored)", () => {
    let superSelector: SuperSelector

    beforeEach(() => {
        document.body.innerHTML = `
      <div id="container">
        <p class="text-class">Hello <span>World</span></p>
        <ul id="list">
          <li data-id="1">Item 1</li>
          <li data-id="2" class="active">Item 2</li>
          <li data-id="3">Item 3</li>
        </ul>
        <a href="/path/to/page.html" title="Test Link">Link</a>
        <input type="text" value="Initial Value" />
      </div>
    `

        superSelector = new SuperSelector({ debug: true })
    })

    afterEach(() => {
        superSelector.destroy()
    })

    describe("Basic functionality", () => {
        it("should execute CSS selectors", async () => {
            const result = await superSelector.execute("#container")
            expect(result.success).toBe(true)
            expect(result.value).toBeInstanceOf(Element)
            expect((result.value as Element).id).toBe("container")
        })

        it("should execute property access", async () => {
            const result = await superSelector.execute("#container | id")
            expect(result.success).toBe(true)
            expect(result.value).toBe("container")
        })

        it("should execute function calls", async () => {
            const result = await superSelector.execute('a | getAttribute("href")')
            expect(result.success).toBe(true)
            expect(result.value).toBe("/path/to/page.html")
        })

        it("should execute array access", async () => {
            const result = await superSelector.execute("#list li | [1]")
            expect(result.success).toBe(true)
            expect((result.value as Element).textContent).toBe("Item 2")
        })

        it("should execute complex chains", async () => {
            const result = await superSelector.execute("#list li | [1] | textContent")
            expect(result.success).toBe(true)
            expect(result.value).toBe("Item 2")
        })
    })

    describe("Built-in commands", () => {
        it("should execute getProp command", async () => {
            const result = await superSelector.execute('#list li | getProp("textContent")')
            expect(result.success).toBe(true)
            expect(result.value).toEqual(["Item 1", "Item 2", "Item 3"])
        })

        it("should execute p command (alias)", async () => {
            const result = await superSelector.execute('#list li | p("dataset") | p("id")')
            expect(result.success).toBe(true)
            expect(result.value).toEqual(["1", "2", "3"])
        })

        it("should execute propIncludes command", async () => {
            const result = await superSelector.execute('#list li | propIncludes("textContent", "Item 2")')
            expect(result.success).toBe(true)
            expect(Array.isArray(result.value)).toBe(true)
            expect((result.value as Element[])[0].textContent).toBe("Item 2")
        })
    })

    describe("Error handling", () => {
        it("should handle parse errors", async () => {
            const result = await superSelector.execute("invalid | | syntax")
            expect(result.success).toBe(false)
            expect(result.error).toBeDefined()
        })

        it("should handle execution errors gracefully", async () => {
            const result = await superSelector.execute(".non-existent | nonExistentMethod()")
            expect(result.success).toBe(false)
            expect(result.value).toBeNull()
        })
    })

    describe("Configuration", () => {
        it("should respect error handling configuration", async () => {
            superSelector.configure({
                errorHandling: "return-default",
                defaultValue: "DEFAULT",
            })

            const result = await superSelector.execute(".non-existent | textContent")
            expect(result.success).toBe(false)
            expect(result.value).toBe("DEFAULT")
        })

        it("should enable/disable caching", async () => {
            superSelector.configure({ cacheEnabled: true })

            // First execution
            const result1 = await superSelector.execute("#container | id")
            expect(result1.metadata.cacheHit).toBe(false)

            // Second execution should hit cache
            const result2 = await superSelector.execute("#container | id")
            expect(result2.metadata.cacheHit).toBe(true)
        })
    })

    describe("Static methods (backward compatibility)", () => {
        it("should work with static superSelector method", async () => {
            const result = await SuperSelector.superSelector("#container | id")
            expect(result).toBe("container")
        })

        it("should work with static findElement method", async () => {
            const element = await SuperSelector.findElement("#container")
            expect(element).toBeInstanceOf(Element)
            expect(element?.id).toBe("container")
        })
    })
})
