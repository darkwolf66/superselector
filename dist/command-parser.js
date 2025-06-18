"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandParser = void 0;
/**
 * Parses command strings into a structured format for SuperSelector. (Legacy Parser)
 */
class CommandParser {
    /**
     * Parses a string of chained function calls (e.g., "func1().func2('arg')").
     * @param commandArrayString - The string of chained commands.
     * @returns An array of parsed function commands.
     */
    static parseCommandArray(commandArrayString) {
        const result = [];
        // Split by ').' but handle cases like 'func().' at the end
        const commands = commandArrayString.split(/\)\s*\.\s*(?=[a-zA-Z_])/).map((cmd, index, arr) => {
            // Add back the ')' for all but the last element if it was split
            if (index < arr.length - 1 && !cmd.endsWith(")")) {
                return cmd + ")";
            }
            return cmd;
        });
        for (const commandStr of commands) {
            const commandName = commandStr.split("(")[0].trim();
            if (commandName) {
                result.push({
                    type: "function",
                    command: commandName,
                    params: CommandParser.parseCommandArgs(commandStr),
                });
            }
        }
        return result;
    }
    /**
     * Parses arguments from a function call string (e.g., "func('arg1', 123)").
     * @param commandString - The function call string.
     * @returns An array of string arguments, or null if no arguments.
     */
    static parseCommandArgs(commandString) {
        const openParenIndex = commandString.indexOf("(");
        const closeParenIndex = commandString.lastIndexOf(")");
        if (openParenIndex === -1 || closeParenIndex === -1 || openParenIndex >= closeParenIndex) {
            return null; // No valid parentheses for args
        }
        const argsContent = commandString.substring(openParenIndex + 1, closeParenIndex).trim();
        if (argsContent === "") {
            return null;
        }
        const args = [];
        let currentArg = "";
        let inDoubleQuote = false;
        let inSingleQuote = false;
        let parenLevel = 0;
        for (let i = 0; i < argsContent.length; i++) {
            const char = argsContent[i];
            if (char === "(" && !inDoubleQuote && !inSingleQuote) {
                parenLevel++;
            }
            else if (char === ")" && !inDoubleQuote && !inSingleQuote) {
                parenLevel--;
            }
            else if (char === '"' && !inSingleQuote) {
                inDoubleQuote = !inDoubleQuote;
            }
            else if (char === "'" && !inDoubleQuote) {
                inSingleQuote = !inSingleQuote;
            }
            else if (char === "," && !inDoubleQuote && !inSingleQuote && parenLevel === 0) {
                args.push(currentArg.trim());
                currentArg = "";
                continue;
            }
            currentArg += char;
        }
        args.push(currentArg.trim());
        return args.map((arg) => {
            if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"))) {
                return arg.substring(1, arg.length - 1);
            }
            return arg;
        });
    }
    /**
     * Parses a full command string, which can include CSS selectors, function calls,
     * and array access, piped together.
     * @param commandString - The full command string (e.g., "div.class | someFunc('arg') | [0]").
     * @returns An array of parsed commands.
     */
    static parseCommand(commandString) {
        const parsedOrderedCommand = [];
        const commandMethods = commandString.split("|").map((cmd) => cmd.trim());
        for (const command of commandMethods) {
            if (command.includes(").")) {
                parsedOrderedCommand.push(...CommandParser.parseCommandArray(command));
            }
            else if (command.match(/^([a-zA-Z_][\w_]*)\s*\(/)) {
                parsedOrderedCommand.push({
                    type: "function",
                    command: command.split("(")[0].trim(),
                    params: CommandParser.parseCommandArgs(command),
                });
            }
            else if (command.match(/^\s*\[\s*-?\d+\s*\]\s*$/)) {
                parsedOrderedCommand.push({
                    type: "arrayPosition",
                    command: Number.parseInt(command.replace(/\[|\]|\s/g, "")),
                });
            }
            else if (command.match(/^[a-zA-Z_][\w_]*$/) && !command.includes(" ") && !command.includes(".")) {
                // Simple property name (no spaces, no dots, does not start with # or .)
                parsedOrderedCommand.push({
                    type: "property",
                    name: command,
                });
            }
            else {
                // Assumed to be a CSS selector
                parsedOrderedCommand.push({
                    type: "css-selector",
                    selector: command,
                });
            }
        }
        return parsedOrderedCommand;
    }
}
exports.CommandParser = CommandParser;
//# sourceMappingURL=command-parser.js.map