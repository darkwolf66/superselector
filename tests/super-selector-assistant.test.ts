import { SuperSelectorAssistant } from "../src/super-selector-assistant"

describe("SuperSelectorAssistant", () => {
    const testObj = { name: "Test Object", type: "Data", count: 10, nested: { value: "Nested Value" } }
    const testArr = [
        { id: 1, category: "A", tag: "alpha" },
        { id: 2, category: "B", tag: "beta" },
        { id: 3, category: "A", tag: "gamma" },
    ]

    describe("matchProp", () => {
        it("should match property with regex on a single object", () => {
            expect(SuperSelectorAssistant.matchProp(testObj, "name", "Test.*")).toEqual([testObj])
            expect(SuperSelectorAssistant.matchProp(testObj, "name", "Fail")).toEqual([])
        })

        it("should match property with regex on an array of objects", () => {
            const result = SuperSelectorAssistant.matchProp(testArr, "tag", "a$") // ends with 'a'
            expect(result).toEqual([testArr[0], testArr[1], testArr[2]]) // all tags ending with 'a'
        })

        it("should return empty array if property is not a string or does not exist", () => {
            expect(SuperSelectorAssistant.matchProp(testObj, "count", "10")).toEqual([]) // count is number
            expect(SuperSelectorAssistant.matchProp(testObj, "nonExistent", "Test")).toEqual([])
        })
    })

    describe("recursiveProp", () => {
        const deepObj = { a: { b: { c: { d: "found" } } } }
        it("should get property recursively", () => {
            expect(SuperSelectorAssistant.recursiveProp(deepObj, "a", 1)).toEqual({ b: { c: { d: "found" } } })
            // Note: The original logic for recursiveProp was element.prop.prop for times=2.
            // My interpretation: times=1 means obj.a, times=2 means obj.a.a (if obj.a was an object with prop a)
            // The current implementation: times=1 means obj.a, times=2 means (obj.a).b if the next call is .p(obj.a, 'b')
            // The provided code uses the same attribute `attr` recursively.
            // So, for deepObj.a.b.c.d:
            // recursiveProp(deepObj, 'a', 1) -> deepObj.a
            // recursiveProp(deepObj.a, 'b', 1) -> deepObj.a.b
            // recursiveProp(deepObj.a.b, 'c', 1) -> deepObj.a.b.c
            // recursiveProp(deepObj.a.b.c, 'd', 1) -> 'found'
            // The current recursiveProp(element, attr, times) implies element[attr][attr]...
            // Let's test based on its actual implementation:
            const nestedSameKey = { key: { key: { key: "value" } } }
            expect(SuperSelectorAssistant.recursiveProp(nestedSameKey, "key", 1)).toEqual({ key: { key: "value" } })
            expect(SuperSelectorAssistant.recursiveProp(nestedSameKey, "key", 2)).toEqual({ key: "value" })
            expect(SuperSelectorAssistant.recursiveProp(nestedSameKey, "key", 3)).toEqual("value")
            expect(SuperSelectorAssistant.recursiveProp(nestedSameKey, "key", 4)).toBeNull() // times > 3 returns null
        })

        it("should return element if times is 0 or less", () => {
            expect(SuperSelectorAssistant.recursiveProp(testObj, "name", 0)).toBe(testObj)
            expect(SuperSelectorAssistant.recursiveProp(testObj, "name", -1)).toBe(testObj)
        })

        it("should handle string input for times", () => {
            expect(SuperSelectorAssistant.recursiveProp(testObj.nested, "value", "1")).toBe("Nested Value")
        })

        it("should return null if path breaks", () => {
            expect(SuperSelectorAssistant.recursiveProp(testObj, "nonExistent", 2)).toBeNull()
        })
    })

    describe("getProp (and p alias)", () => {
        it("should get property from a single object", () => {
            expect(SuperSelectorAssistant.getProp(testObj, "name")).toBe("Test Object")
            expect(SuperSelectorAssistant.p(testObj, "type")).toBe("Data")
        })

        it("should return null for non-existent property on single object", () => {
            expect(SuperSelectorAssistant.getProp(testObj, "nonExistent")).toBeNull()
        })

        it("should get properties from an array of objects", () => {
            expect(SuperSelectorAssistant.getProp(testArr, "category")).toEqual(["A", "B", "A"])
            expect(SuperSelectorAssistant.p(testArr, "id")).toEqual([1, 2, 3])
        })

        it("should filter out undefined properties when getting from array", () => {
            const mixedArr = [{ a: 1 }, { b: 2 }, { a: 3, b: 3 }]
            expect(SuperSelectorAssistant.getProp(mixedArr, "a")).toEqual([1, 3])
            expect(SuperSelectorAssistant.getProp(mixedArr, "b")).toEqual([2, 3])
        })
    })

    describe("propIncludes", () => {
        it("should return object if prop includes string", () => {
            expect(SuperSelectorAssistant.propIncludes(testObj, "name", "Object")).toBe(testObj)
        })

        it("should return null if prop does not include string or prop not string", () => {
            expect(SuperSelectorAssistant.propIncludes(testObj, "name", "Fail")).toBeNull()
            expect(SuperSelectorAssistant.propIncludes(testObj, "count", "10")).toBeNull() // count is number
        })
    })

    describe("propIncludesLowercase", () => {
        it("should return object if prop includes string (case-insensitive)", () => {
            expect(SuperSelectorAssistant.propIncludesLowercase(testObj, "name", "object")).toBe(testObj)
            expect(SuperSelectorAssistant.propIncludesLowercase(testObj, "type", "DATA")).toBe(testObj)
        })

        it("should return null if prop does not include string (case-insensitive)", () => {
            expect(SuperSelectorAssistant.propIncludesLowercase(testObj, "name", "Fail")).toBeNull()
        })
    })
})
