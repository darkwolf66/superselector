"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBuiltInCommands = void 0;
const registry_1 = require("./registry");
const errors_1 = require("../core/errors");
/**
 * Built-in commands for SuperSelector
 */
// CSS Selector command
const cssSelectorCommand = {
    execute(context, selector) {
        const { currentValue } = context;
        if (currentValue instanceof Element || currentValue instanceof Document) {
            const elements = currentValue.querySelectorAll(selector);
            if (elements.length === 0)
                return null; // Return null if no elements found
            return elements.length === 1 ? elements[0] : Array.from(elements);
        }
        else if (Array.isArray(currentValue)) {
            const results = [];
            for (const item of currentValue) {
                if (item instanceof Element) {
                    const elements = item.querySelectorAll(selector);
                    if (elements.length > 0) {
                        // Only add if elements are found
                        results.push(...Array.from(elements));
                    }
                }
            }
            return results.length > 0 ? results : null; // Return null if results array is empty
        }
        return null;
    },
    validate(args) {
        return args.length === 1 && typeof args[0] === "string";
    },
    description: "Select elements using CSS selector syntax",
};
// Property access command
const propertyCommand = {
    execute(context, propertyName) {
        const { currentValue } = context;
        let err;
        if (currentValue === null || currentValue === undefined) {
            if (!context.hadSoftError) {
                // Record only the first soft error
                context.hadSoftError = true;
                err = errors_1.ErrorFactory.execution(`Cannot access property '${propertyName}' on null or undefined value`, undefined, // Command is not directly known here, could be passed if needed
                context);
                context.softError = err;
            }
            if (context.config.errorHandling === "throw") {
                throw err || context.softError; // Throw the specific error encountered
            }
            return context.config.errorHandling === "return-default" ? context.config.defaultValue : null;
        }
        if (Array.isArray(currentValue)) {
            const results = [];
            let itemHadError = false;
            for (const item of currentValue) {
                if (item && typeof item === "object" && propertyName in item) {
                    results.push(item[propertyName]);
                }
                else {
                    results.push(null); // Maintain array structure even if prop not found
                    if (item !== null && item !== undefined)
                        itemHadError = true; // Mark if a valid item didn't have the prop
                }
            }
            if (itemHadError && !context.hadSoftError) {
                context.hadSoftError = true;
                // Generic error as it's per item
                context.softError = errors_1.ErrorFactory.execution(`Property '${propertyName}' not found on one or more items in array`, undefined, context);
            }
            if (results.every((r) => r === null) && currentValue.length > 0)
                return null;
            return results.length > 0 ? results : null;
        }
        else if (currentValue && typeof currentValue === "object" && propertyName in currentValue) {
            return currentValue[propertyName];
        }
        else if (currentValue && (typeof currentValue === "object" || typeof currentValue === "function")) {
            // Check if it's an object but prop not found
            if (!context.hadSoftError) {
                context.hadSoftError = true;
                err = errors_1.ErrorFactory.execution(`Property '${propertyName}' not found on target object.`, undefined, context);
                context.softError = err;
            }
            if (context.config.errorHandling === "throw")
                throw err || context.softError;
            return context.config.errorHandling === "return-default" ? context.config.defaultValue : null;
        }
        // Default to null if property cannot be accessed and not handled above
        if (!context.hadSoftError) {
            context.hadSoftError = true;
            context.softError = errors_1.ErrorFactory.execution(`Property '${propertyName}' could not be accessed.`, undefined, context);
        }
        return context.config.errorHandling === "return-default" ? context.config.defaultValue : null;
    },
    validate(args) {
        return args.length === 1 && typeof args[0] === "string";
    },
    description: "Access a property of the current value",
};
// Array access command
const arrayAccessCommand = {
    execute(context, index) {
        const { currentValue } = context;
        let err;
        if (Array.isArray(currentValue)) {
            const actualIndex = index < 0 ? currentValue.length + index : index;
            if (actualIndex >= 0 && actualIndex < currentValue.length) {
                return currentValue[actualIndex];
            }
            else {
                if (!context.hadSoftError) {
                    context.hadSoftError = true;
                    err = errors_1.ErrorFactory.execution(`Index ${index} out of bounds for array of length ${currentValue.length}`, undefined, context);
                    context.softError = err;
                }
                if (context.config.errorHandling === "throw")
                    throw err || context.softError;
                return context.config.errorHandling === "return-default" ? context.config.defaultValue : null;
            }
        }
        else {
            // Not an array
            if (!context.hadSoftError) {
                context.hadSoftError = true;
                err = errors_1.ErrorFactory.execution(`Cannot apply array access to non-array type: ${typeof currentValue}`, undefined, context);
                context.softError = err;
            }
            if (context.config.errorHandling === "throw")
                throw err || context.softError;
            return context.config.errorHandling === "return-default" ? context.config.defaultValue : null;
        }
    },
    validate(args) {
        return args.length === 1 && typeof args[0] === "number";
    },
    description: "Access an element at a specific index in an array",
};
// Get property command (alias for property access)
const getPropCommand = {
    execute(context, propertyName) {
        return propertyCommand.execute(context, propertyName);
    },
    validate(args) {
        return args.length === 1 && typeof args[0] === "string";
    },
    description: "Get a property value (alias for property access)",
};
// Recursive property command
const recursivePropCommand = {
    execute(context, propertyName, times = 1) {
        const numTimes = typeof times === "string" ? Number.parseInt(times, 10) : times;
        let err;
        if (isNaN(numTimes) || numTimes <= 0) {
            return context.currentValue;
        }
        let current = context.currentValue;
        for (let i = 0; i < numTimes; i++) {
            if (current && typeof current === "object" && propertyName in current) {
                current = current[propertyName];
            }
            else {
                if (!context.hadSoftError) {
                    context.hadSoftError = true;
                    err = errors_1.ErrorFactory.execution(`Recursive property '${propertyName}' access failed at depth ${i + 1}`, undefined, context);
                    context.softError = err;
                }
                if (context.config.errorHandling === "throw")
                    throw err || context.softError;
                return context.config.errorHandling === "return-default" ? context.config.defaultValue : null;
            }
        }
        return current;
    },
    validate(args) {
        return (args.length >= 1 &&
            args.length <= 2 &&
            typeof args[0] === "string" &&
            (args.length === 1 || typeof args[1] === "string" || typeof args[1] === "number"));
    },
    description: "Recursively access the same property multiple times",
};
// Property includes command
const propIncludesCommand = {
    execute(context, propertyName, searchString) {
        const { currentValue } = context;
        let err;
        const checkItem = (item) => {
            if (item && typeof item === "object" && propertyName in item) {
                const propValue = item[propertyName];
                if (typeof propValue === "string") {
                    return propValue.includes(searchString) ? item : null;
                }
            }
            return null;
        };
        if (Array.isArray(currentValue)) {
            const results = currentValue.map(checkItem).filter((r) => r !== null);
            if (results.length === 0 &&
                currentValue.length > 0 &&
                !currentValue.some((item) => item && typeof item === "object" && propertyName in item && typeof item[propertyName] === "string")) {
                if (!context.hadSoftError) {
                    context.hadSoftError = true;
                    context.softError = errors_1.ErrorFactory.execution(`Property '${propertyName}' for 'propIncludes' was not a string or not found on items.`, undefined, context);
                }
            }
            return results.length > 0 ? results : null;
        }
        else {
            const result = checkItem(currentValue);
            if (!result &&
                currentValue &&
                typeof currentValue === "object" &&
                (!(propertyName in currentValue) || typeof currentValue[propertyName] !== "string")) {
                if (!context.hadSoftError) {
                    context.hadSoftError = true;
                    err = errors_1.ErrorFactory.execution(`Property '${propertyName}' for 'propIncludes' was not a string or not found.`, undefined, context);
                    context.softError = err;
                }
                if (context.config.errorHandling === "throw")
                    throw err || context.softError;
                return context.config.errorHandling === "return-default" ? context.config.defaultValue : null;
            }
            return result;
        }
    },
    validate(args) {
        return args.length === 2 && typeof args[0] === "string" && typeof args[1] === "string";
    },
    description: "Filter elements where a property includes a specific string",
};
// Property includes lowercase command
const propIncludesLowercaseCommand = {
    execute(context, propertyName, searchString) {
        const { currentValue } = context;
        const lowerSearchString = searchString.toLowerCase();
        let err;
        const checkItem = (item) => {
            if (item && typeof item === "object" && propertyName in item) {
                const propValue = item[propertyName];
                if (typeof propValue === "string") {
                    return propValue.toLowerCase().includes(lowerSearchString) ? item : null;
                }
            }
            return null;
        };
        if (Array.isArray(currentValue)) {
            const results = currentValue.map(checkItem).filter((r) => r !== null);
            if (results.length === 0 &&
                currentValue.length > 0 &&
                !currentValue.some((item) => item && typeof item === "object" && propertyName in item && typeof item[propertyName] === "string")) {
                if (!context.hadSoftError) {
                    context.hadSoftError = true;
                    context.softError = errors_1.ErrorFactory.execution(`Property '${propertyName}' for 'propIncludesLowercase' was not a string or not found on items.`, undefined, context);
                }
            }
            return results.length > 0 ? results : null;
        }
        else {
            const result = checkItem(currentValue);
            if (!result &&
                currentValue &&
                typeof currentValue === "object" &&
                (!(propertyName in currentValue) || typeof currentValue[propertyName] !== "string")) {
                if (!context.hadSoftError) {
                    context.hadSoftError = true;
                    err = errors_1.ErrorFactory.execution(`Property '${propertyName}' for 'propIncludesLowercase' was not a string or not found.`, undefined, context);
                    context.softError = err;
                }
                if (context.config.errorHandling === "throw")
                    throw err || context.softError;
                return context.config.errorHandling === "return-default" ? context.config.defaultValue : null;
            }
            return result;
        }
    },
    validate(args) {
        return args.length === 2 && typeof args[0] === "string" && typeof args[1] === "string";
    },
    description: "Filter elements where a property includes a specific string (case-insensitive)",
};
// Match property command
const matchPropCommand = {
    execute(context, propertyName, regexPattern) {
        const { currentValue } = context;
        let regex;
        let err;
        try {
            regex = new RegExp(regexPattern);
        }
        catch (error) {
            const errRegex = errors_1.ErrorFactory.validation(`Invalid regex pattern: ${regexPattern}`);
            if (context.config.errorHandling === "throw")
                throw errRegex;
            if (!context.hadSoftError) {
                context.hadSoftError = true;
                context.softError = errRegex;
            }
            return context.config.errorHandling === "return-default" ? context.config.defaultValue : null;
        }
        const checkItem = (item) => {
            if (item && typeof item === "object" && propertyName in item) {
                const propValue = item[propertyName];
                if (typeof propValue === "string") {
                    return regex.test(propValue) ? item : null;
                }
            }
            return null;
        };
        if (Array.isArray(currentValue)) {
            const results = currentValue.map(checkItem).filter((r) => r !== null);
            if (results.length === 0 &&
                currentValue.length > 0 &&
                !currentValue.some((item) => item && typeof item === "object" && propertyName in item && typeof item[propertyName] === "string")) {
                if (!context.hadSoftError) {
                    context.hadSoftError = true;
                    context.softError = errors_1.ErrorFactory.execution(`Property '${propertyName}' for 'matchProp' was not a string or not found on items.`, undefined, context);
                }
            }
            return results.length > 0 ? results : null;
        }
        else {
            const result = checkItem(currentValue);
            if (!result &&
                currentValue &&
                typeof currentValue === "object" &&
                (!(propertyName in currentValue) || typeof currentValue[propertyName] !== "string")) {
                if (!context.hadSoftError) {
                    context.hadSoftError = true;
                    err = errors_1.ErrorFactory.execution(`Property '${propertyName}' for 'matchProp' was not a string or not found.`, undefined, context);
                    context.softError = err;
                }
                if (context.config.errorHandling === "throw")
                    throw err || context.softError;
                return context.config.errorHandling === "return-default" ? context.config.defaultValue : null;
            }
            return result;
        }
    },
    validate(args) {
        return args.length === 2 && typeof args[0] === "string" && typeof args[1] === "string";
    },
    description: "Filter elements where a property matches a regular expression",
};
/**
 * Register all built-in commands
 */
function registerBuiltInCommands() {
    // Clear any existing commands first
    registry_1.commandRegistry.clear();
    registry_1.commandRegistry.register("css-selector", cssSelectorCommand);
    registry_1.commandRegistry.register("property", propertyCommand);
    registry_1.commandRegistry.register("array-access", arrayAccessCommand);
    registry_1.commandRegistry.register("getProp", getPropCommand);
    registry_1.commandRegistry.register("p", getPropCommand); // Alias
    registry_1.commandRegistry.register("recursiveProp", recursivePropCommand);
    registry_1.commandRegistry.register("propIncludes", propIncludesCommand);
    registry_1.commandRegistry.register("propIncludesLowercase", propIncludesLowercaseCommand);
    registry_1.commandRegistry.register("matchProp", matchPropCommand);
    // console.log("Built-in commands registered:", commandRegistry.list()) // Keep for debugging if needed
}
exports.registerBuiltInCommands = registerBuiltInCommands;
//# sourceMappingURL=built-in.js.map