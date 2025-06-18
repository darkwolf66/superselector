import { Parser } from "../../src/parser/parser"

describe("Parser (Refactored)", () => {
    let parser: Parser

    beforeEach(() => {
        parser = new Parser()
    })

    describe("CSS Selector parsing", () => {
        it("should parse simple CSS selectors", () => {
            const result = parser.parse("div.my-class")
            expect(result.isValid).toBe(true)
            expect(result.commands).toHaveLength(1)
            expect(result.commands[0]).toEqual({
                type: "css-selector",
                name: "css-selector",
                selector: "div.my-class",
            })
        })

        it("should parse complex CSS selectors", () => {
            const result = parser.parse("div#container > ul li:nth-child(2)")
            expect(result.isValid).toBe(true)
            expect(result.commands[0].type).toBe("css-selector")
        })
    })

    describe("Function parsing", () => {
        it("should parse function calls with no arguments", () => {
            const result = parser.parse("textContent()")
            expect(result.isValid).toBe(true)
            expect(result.commands[0]).toEqual({
                type: "function",
                name: "textContent",
                args: [],
            })
        })

        it("should parse function calls with string arguments", () => {
            const result = parser.parse('getAttribute("href")')
            expect(result.isValid).toBe(true)
            expect(result.commands[0]).toEqual({
                type: "function",
                name: "getAttribute",
                args: ["href"],
            })
        })

        it("should parse function calls with multiple arguments", () => {
            const result = parser.parse('replace("old", "new")')
            expect(result.isValid).toBe(true)
            expect(result.commands[0]).toEqual({
                type: "function",
                name: "replace",
                args: ["old", "new"],
            })
        })
    })

    describe("Property parsing", () => {
        it("should parse property access after a selector", () => {
            const result = parser.parse("div.class | textContent")
            expect(result.isValid).toBe(true)
            expect(result.commands).toHaveLength(2)
            expect(result.commands[1]).toEqual({
                type: "property",
                name: "textContent",
            })
        })
    })

    describe("Array access parsing", () => {
        it("should parse array access", () => {
            const result = parser.parse("[0]")
            expect(result.isValid).toBe(true)
            expect(result.commands[0]).toEqual({
                type: "array-access",
                name: "array-access",
                index: 0,
            })
        })

        it("should parse negative array access", () => {
            const result = parser.parse("[-1]")
            expect(result.isValid).toBe(true)
            expect(result.commands[0]).toEqual({
                type: "array-access",
                name: "array-access",
                index: -1,
            })
        })
    })

    describe("Piped commands", () => {
        it("should parse piped commands", () => {
            const result = parser.parse("div.class | textContent | trim()")
            expect(result.isValid).toBe(true)
            expect(result.commands).toHaveLength(3)
            expect(result.commands[0].type).toBe("css-selector")
            expect(result.commands[1].type).toBe("property")
            expect(result.commands[2].type).toBe("function")
        })

        it("should parse complex piped commands", () => {
            const result = parser.parse('ul li | [0] | getAttribute("data-id") | parseInt()')
            expect(result.isValid).toBe(true)
            expect(result.commands).toHaveLength(4)
        })
    })

    describe("Error handling", () => {
        it("should handle invalid syntax", () => {
            const result = parser.parse("invalid | | syntax")
            expect(result.isValid).toBe(false)
            expect(result.errors).toHaveLength(1)
        })

        it("should handle unclosed function calls", () => {
            const result = parser.parse('getAttribute("href"')
            expect(result.isValid).toBe(false)
            expect(result.errors.length).toBeGreaterThan(0)
        })

        it("should handle invalid array access", () => {
            const result = parser.parse("[invalid]")
            expect(result.isValid).toBe(false)
            expect(result.errors.length).toBeGreaterThan(0)
        })
    })
})
