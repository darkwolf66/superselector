import type { CommandHandler, ExecutionContext, SelectorValue } from "../types"
import { commandRegistry } from "./registry"
import { ErrorFactory } from "../core/errors"

/**
 * Built-in commands for SuperSelector
 */

// CSS Selector command
const cssSelectorCommand: CommandHandler = {
    execute(context: ExecutionContext, selector: string): SelectorValue {
        const { currentValue } = context

        if (currentValue instanceof Element || currentValue instanceof Document) {
            const elements = currentValue.querySelectorAll(selector)
            if (elements.length === 0) return null // Return null if no elements found
            return elements.length === 1 ? elements[0] : Array.from(elements)
        } else if (Array.isArray(currentValue)) {
            const results: Element[] = []
            for (const item of currentValue) {
                if (item instanceof Element) {
                    const elements = item.querySelectorAll(selector)
                    if (elements.length > 0) {
                        // Only add if elements are found
                        results.push(...Array.from(elements))
                    }
                }
            }
            return results.length > 0 ? results : null // Return null if results array is empty
        }

        return null
    },
    validate(args: any[]): boolean {
        return args.length === 1 && typeof args[0] === "string"
    },
    description: "Select elements using CSS selector syntax",
}

// Property access command
const propertyCommand: CommandHandler = {
    execute(context: ExecutionContext, propertyName: string): SelectorValue {
        const { currentValue } = context
        let err: import("../types").SuperSelectorError | undefined

        if (currentValue === null || currentValue === undefined) {
            if (!context.hadSoftError) {
                // Record only the first soft error
                context.hadSoftError = true
                err = ErrorFactory.execution(
                    `Cannot access property '${propertyName}' on null or undefined value`,
                    undefined, // Command is not directly known here, could be passed if needed
                    context,
                )
                context.softError = err
            }
            if (context.config.errorHandling === "throw") {
                throw err || context.softError // Throw the specific error encountered
            }
            return context.config.errorHandling === "return-default" ? context.config.defaultValue : null
        }

        if (Array.isArray(currentValue)) {
            const results: any[] = []
            let itemHadError = false
            for (const item of currentValue) {
                if (item && typeof item === "object" && propertyName in item) {
                    results.push(item[propertyName])
                } else {
                    results.push(null) // Maintain array structure even if prop not found
                    if (item !== null && item !== undefined) itemHadError = true // Mark if a valid item didn't have the prop
                }
            }
            if (itemHadError && !context.hadSoftError) {
                context.hadSoftError = true
                // Generic error as it's per item
                context.softError = ErrorFactory.execution(
                    `Property '${propertyName}' not found on one or more items in array`,
                    undefined,
                    context,
                )
            }
            if (results.every((r) => r === null) && currentValue.length > 0) return null
            return results.length > 0 ? results : null
        } else if (currentValue && typeof currentValue === "object" && propertyName in currentValue) {
            return (currentValue as any)[propertyName]
        } else if (currentValue && (typeof currentValue === "object" || typeof currentValue === "function")) {
            // Check if it's an object but prop not found
            if (!context.hadSoftError) {
                context.hadSoftError = true
                err = ErrorFactory.execution(`Property '${propertyName}' not found on target object.`, undefined, context)
                context.softError = err
            }
            if (context.config.errorHandling === "throw") throw err || context.softError
            return context.config.errorHandling === "return-default" ? context.config.defaultValue : null
        }

        // Default to null if property cannot be accessed and not handled above
        if (!context.hadSoftError) {
            context.hadSoftError = true
            context.softError = ErrorFactory.execution(
                `Property '${propertyName}' could not be accessed.`,
                undefined,
                context,
            )
        }
        return context.config.errorHandling === "return-default" ? context.config.defaultValue : null
    },
    validate(args: any[]): boolean {
        return args.length === 1 && typeof args[0] === "string"
    },
    description: "Access a property of the current value",
}

// Array access command
const arrayAccessCommand: CommandHandler = {
    execute(context: ExecutionContext, index: number): SelectorValue {
        const { currentValue } = context
        let err: import("../types").SuperSelectorError | undefined

        if (Array.isArray(currentValue)) {
            const actualIndex = index < 0 ? currentValue.length + index : index
            if (actualIndex >= 0 && actualIndex < currentValue.length) {
                return currentValue[actualIndex]
            } else {
                if (!context.hadSoftError) {
                    context.hadSoftError = true
                    err = ErrorFactory.execution(
                        `Index ${index} out of bounds for array of length ${currentValue.length}`,
                        undefined,
                        context,
                    )
                    context.softError = err
                }
                if (context.config.errorHandling === "throw") throw err || context.softError
                return context.config.errorHandling === "return-default" ? context.config.defaultValue : null
            }
        } else {
            // Not an array
            if (!context.hadSoftError) {
                context.hadSoftError = true
                err = ErrorFactory.execution(
                    `Cannot apply array access to non-array type: ${typeof currentValue}`,
                    undefined,
                    context,
                )
                context.softError = err
            }
            if (context.config.errorHandling === "throw") throw err || context.softError
            return context.config.errorHandling === "return-default" ? context.config.defaultValue : null
        }
    },
    validate(args: any[]): boolean {
        return args.length === 1 && typeof args[0] === "number"
    },
    description: "Access an element at a specific index in an array",
}

// Get property command (alias for property access)
const getPropCommand: CommandHandler = {
    execute(context: ExecutionContext, propertyName: string): SelectorValue {
        return propertyCommand.execute(context, propertyName)
    },
    validate(args: any[]): boolean {
        return args.length === 1 && typeof args[0] === "string"
    },
    description: "Get a property value (alias for property access)",
}

// Recursive property command
const recursivePropCommand: CommandHandler = {
    execute(context: ExecutionContext, propertyName: string, times: string | number = 1): SelectorValue {
        const numTimes = typeof times === "string" ? Number.parseInt(times, 10) : times
        let err: import("../types").SuperSelectorError | undefined

        if (isNaN(numTimes) || numTimes <= 0) {
            return context.currentValue
        }

        let current = context.currentValue
        for (let i = 0; i < numTimes; i++) {
            if (current && typeof current === "object" && propertyName in current) {
                current = (current as any)[propertyName]
            } else {
                if (!context.hadSoftError) {
                    context.hadSoftError = true
                    err = ErrorFactory.execution(
                        `Recursive property '${propertyName}' access failed at depth ${i + 1}`,
                        undefined,
                        context,
                    )
                    context.softError = err
                }
                if (context.config.errorHandling === "throw") throw err || context.softError
                return context.config.errorHandling === "return-default" ? context.config.defaultValue : null
            }
        }
        return current
    },
    validate(args: any[]): boolean {
        return (
            args.length >= 1 &&
            args.length <= 2 &&
            typeof args[0] === "string" &&
            (args.length === 1 || typeof args[1] === "string" || typeof args[1] === "number")
        )
    },
    description: "Recursively access the same property multiple times",
}

// Property includes command
const propIncludesCommand: CommandHandler = {
    execute(context: ExecutionContext, propertyName: string, searchString: string): SelectorValue {
        const { currentValue } = context
        let err: import("../types").SuperSelectorError | undefined

        const checkItem = (item: any) => {
            if (item && typeof item === "object" && propertyName in item) {
                const propValue = item[propertyName]
                if (typeof propValue === "string") {
                    return propValue.includes(searchString) ? item : null
                }
            }
            return null
        }

        if (Array.isArray(currentValue)) {
            const results: any[] = currentValue.map(checkItem).filter((r) => r !== null)
            if (
                results.length === 0 &&
                currentValue.length > 0 &&
                !currentValue.some(
                    (item) => item && typeof item === "object" && propertyName in item && typeof item[propertyName] === "string",
                )
            ) {
                if (!context.hadSoftError) {
                    context.hadSoftError = true
                    context.softError = ErrorFactory.execution(
                        `Property '${propertyName}' for 'propIncludes' was not a string or not found on items.`,
                        undefined,
                        context,
                    )
                }
            }
            return results.length > 0 ? results : null
        } else {
            const result = checkItem(currentValue)
            if (
                !result &&
                currentValue &&
                typeof currentValue === "object" &&
                (!(propertyName in currentValue) || typeof (currentValue as any)[propertyName] !== "string")
            ) {
                if (!context.hadSoftError) {
                    context.hadSoftError = true
                    err = ErrorFactory.execution(
                        `Property '${propertyName}' for 'propIncludes' was not a string or not found.`,
                        undefined,
                        context,
                    )
                    context.softError = err
                }
                if (context.config.errorHandling === "throw") throw err || context.softError
                return context.config.errorHandling === "return-default" ? context.config.defaultValue : null
            }
            return result
        }
    },
    validate(args: any[]): boolean {
        return args.length === 2 && typeof args[0] === "string" && typeof args[1] === "string"
    },
    description: "Filter elements where a property includes a specific string",
}

// Property includes lowercase command
const propIncludesLowercaseCommand: CommandHandler = {
    execute(context: ExecutionContext, propertyName: string, searchString: string): SelectorValue {
        const { currentValue } = context
        const lowerSearchString = searchString.toLowerCase()
        let err: import("../types").SuperSelectorError | undefined

        const checkItem = (item: any) => {
            if (item && typeof item === "object" && propertyName in item) {
                const propValue = item[propertyName]
                if (typeof propValue === "string") {
                    return propValue.toLowerCase().includes(lowerSearchString) ? item : null
                }
            }
            return null
        }

        if (Array.isArray(currentValue)) {
            const results: any[] = currentValue.map(checkItem).filter((r) => r !== null)
            if (
                results.length === 0 &&
                currentValue.length > 0 &&
                !currentValue.some(
                    (item) => item && typeof item === "object" && propertyName in item && typeof item[propertyName] === "string",
                )
            ) {
                if (!context.hadSoftError) {
                    context.hadSoftError = true
                    context.softError = ErrorFactory.execution(
                        `Property '${propertyName}' for 'propIncludesLowercase' was not a string or not found on items.`,
                        undefined,
                        context,
                    )
                }
            }
            return results.length > 0 ? results : null
        } else {
            const result = checkItem(currentValue)
            if (
                !result &&
                currentValue &&
                typeof currentValue === "object" &&
                (!(propertyName in currentValue) || typeof (currentValue as any)[propertyName] !== "string")
            ) {
                if (!context.hadSoftError) {
                    context.hadSoftError = true
                    err = ErrorFactory.execution(
                        `Property '${propertyName}' for 'propIncludesLowercase' was not a string or not found.`,
                        undefined,
                        context,
                    )
                    context.softError = err
                }
                if (context.config.errorHandling === "throw") throw err || context.softError
                return context.config.errorHandling === "return-default" ? context.config.defaultValue : null
            }
            return result
        }
    },
    validate(args: any[]): boolean {
        return args.length === 2 && typeof args[0] === "string" && typeof args[1] === "string"
    },
    description: "Filter elements where a property includes a specific string (case-insensitive)",
}

// Match property command
const matchPropCommand: CommandHandler = {
    execute(context: ExecutionContext, propertyName: string, regexPattern: string): SelectorValue {
        const { currentValue } = context
        let regex: RegExp
        let err: import("../types").SuperSelectorError | undefined

        try {
            regex = new RegExp(regexPattern)
        } catch (error) {
            const errRegex = ErrorFactory.validation(`Invalid regex pattern: ${regexPattern}`)
            if (context.config.errorHandling === "throw") throw errRegex
            if (!context.hadSoftError) {
                context.hadSoftError = true
                context.softError = errRegex
            }
            return context.config.errorHandling === "return-default" ? context.config.defaultValue : null
        }

        const checkItem = (item: any) => {
            if (item && typeof item === "object" && propertyName in item) {
                const propValue = item[propertyName]
                if (typeof propValue === "string") {
                    return regex.test(propValue) ? item : null
                }
            }
            return null
        }

        if (Array.isArray(currentValue)) {
            const results: any[] = currentValue.map(checkItem).filter((r) => r !== null)
            if (
                results.length === 0 &&
                currentValue.length > 0 &&
                !currentValue.some(
                    (item) => item && typeof item === "object" && propertyName in item && typeof item[propertyName] === "string",
                )
            ) {
                if (!context.hadSoftError) {
                    context.hadSoftError = true
                    context.softError = ErrorFactory.execution(
                        `Property '${propertyName}' for 'matchProp' was not a string or not found on items.`,
                        undefined,
                        context,
                    )
                }
            }
            return results.length > 0 ? results : null
        } else {
            const result = checkItem(currentValue)
            if (
                !result &&
                currentValue &&
                typeof currentValue === "object" &&
                (!(propertyName in currentValue) || typeof (currentValue as any)[propertyName] !== "string")
            ) {
                if (!context.hadSoftError) {
                    context.hadSoftError = true
                    err = ErrorFactory.execution(
                        `Property '${propertyName}' for 'matchProp' was not a string or not found.`,
                        undefined,
                        context,
                    )
                    context.softError = err
                }
                if (context.config.errorHandling === "throw") throw err || context.softError
                return context.config.errorHandling === "return-default" ? context.config.defaultValue : null
            }
            return result
        }
    },
    validate(args: any[]): boolean {
        return args.length === 2 && typeof args[0] === "string" && typeof args[1] === "string"
    },
    description: "Filter elements where a property matches a regular expression",
}

/**
 * Register all built-in commands
 */
export function registerBuiltInCommands(): void {
    // Clear any existing commands first
    commandRegistry.clear()

    commandRegistry.register("css-selector", cssSelectorCommand)
    commandRegistry.register("property", propertyCommand)
    commandRegistry.register("array-access", arrayAccessCommand)
    commandRegistry.register("getProp", getPropCommand)
    commandRegistry.register("p", getPropCommand) // Alias
    commandRegistry.register("recursiveProp", recursivePropCommand)
    commandRegistry.register("propIncludes", propIncludesCommand)
    commandRegistry.register("propIncludesLowercase", propIncludesLowercaseCommand)
    commandRegistry.register("matchProp", matchPropCommand)

    // console.log("Built-in commands registered:", commandRegistry.list()) // Keep for debugging if needed
}
