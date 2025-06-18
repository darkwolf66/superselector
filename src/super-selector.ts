import { CommandParser } from "./command-parser"
import { SuperSelectorAssistant } from "./super-selector-assistant"
import type { ParsedCommand, QueryableElement, SelectorTarget, ParsedPropertyCommand } from "./types"

/**
 * Provides advanced DOM element selection and manipulation capabilities. (Legacy Implementation)
 */
export class SuperSelector {
    /**
     * The core method to apply a selector string to an element.
     * @param selector - The SuperSelector string.
     * @param currentElement - The root DOM element or document to start selection from.
     * @returns The result of the selection, which can be an element, array of elements, property value, etc.
     */
    static superSelector(
        selector: string | null,
        currentElement: QueryableElement | SelectorTarget | null,
    ): SelectorTarget | null {
        if (currentElement === null || selector === null) {
            return null
        }

        let target: SelectorTarget = currentElement

        try {
            const commands: ParsedCommand[] = CommandParser.parseCommand(selector)

            for (const command of commands) {
                if (target === null || typeof target === "undefined") break

                if (target instanceof NodeList) {
                    target = Array.from(target)
                }

                if (command.type === "css-selector") {
                    const elementsToQuery = Array.isArray(target) ? target : [target]
                    const newElements: Element[] = []
                    let foundSomething = false
                    for (const el of elementsToQuery) {
                        if (el && typeof (el as QueryableElement).querySelectorAll === "function") {
                            const foundNodes = (el as QueryableElement).querySelectorAll(command.selector)
                            if (foundNodes.length > 0) {
                                newElements.push(...Array.from(foundNodes))
                                foundSomething = true
                            }
                        }
                    }
                    target = foundSomething ? (newElements.length === 1 ? newElements[0] : newElements) : null
                } else if (command.type === "function") {
                    const results: any[] = []
                    const elementsToProcess = Array.isArray(target) ? target : [target]
                    let processedAtLeastOne = false

                    for (const el of elementsToProcess) {
                        if (el === null || typeof el === "undefined") continue
                        processedAtLeastOne = true

                        const assistantFunc = (SuperSelectorAssistant as any)[command.command]
                        if (typeof assistantFunc === "function") {
                            const res = assistantFunc(el, ...(command.params || []))
                            if (res !== null && typeof res !== "undefined") {
                                if (Array.isArray(res)) results.push(...res)
                                else results.push(res)
                            } else {
                                results.push(null) // Preserve structure if assistant returns null
                            }
                        } else if (typeof el[command.command] === "function") {
                            const res = el[command.command](...(command.params || []))
                            if (res !== null && typeof res !== "undefined") {
                                results.push(res)
                            } else {
                                results.push(null)
                            }
                        } else if (typeof el[command.command] !== "undefined") {
                            results.push(el[command.command])
                        } else {
                            results.push(null) // Property or method not found
                        }
                    }
                    if (!processedAtLeastOne) {
                        target = null
                    } else if (elementsToProcess.length === 1) {
                        target = results.length > 0 ? results[0] : null
                    } else {
                        target = results
                    }
                } else if (command.type === "arrayPosition") {
                    if (Array.isArray(target) && command.command >= 0 && command.command < target.length) {
                        target = target[command.command]
                    } else if (Array.isArray(target) && command.command < 0 && target.length + command.command >= 0) {
                        target = target[target.length + command.command] // Negative indexing
                    } else {
                        target = null
                    }
                } else if (command.type === "property") {
                    const propName = (command as ParsedPropertyCommand).name
                    const elementsToProcess = Array.isArray(target) ? target : [target]
                    const results: any[] = []
                    let processedAtLeastOne = false

                    for (const el of elementsToProcess) {
                        if (el !== null && typeof el !== "undefined") {
                            processedAtLeastOne = true
                            if (typeof el[propName] !== "undefined") {
                                results.push(el[propName])
                            } else {
                                results.push(null) // Property not found
                            }
                        } else {
                            results.push(null) // Element was null
                        }
                    }

                    if (!processedAtLeastOne) {
                        target = null
                    } else if (elementsToProcess.length === 1) {
                        target = results[0] // Will be null if property not found
                    } else {
                        // If all results are null, maybe return null instead of [null, null]?
                        // For now, return the array of results.
                        target = results
                    }
                }
            }

            if (target instanceof NodeList) {
                target = Array.from(target)
            }
            return target
        } catch (e) {
            console.error("SuperSelector error:", e)
            return null
        }
    }

    /**
     * Finds a single element using the SuperSelector syntax.
     * If multiple elements match, returns the first one.
     * @param selectorString - The SuperSelector string.
     * @param element - The root DOM element or document. Defaults to `document`.
     * @returns The first matched element, or null if not found.
     */
    static findElement(selectorString: string, element: QueryableElement = document): Element | null {
        const result = SuperSelector.superSelector(selectorString, element)
        if (Array.isArray(result)) {
            const firstElement = result.find((item) => item instanceof Element)
            return (firstElement as Element) || null
        }
        return result instanceof Element ? result : null
    }
}
