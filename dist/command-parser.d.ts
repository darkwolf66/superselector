import type { ParsedCommand } from "./types";
/**
 * Parses command strings into a structured format for SuperSelector. (Legacy Parser)
 */
export declare class CommandParser {
    /**
     * Parses a string of chained function calls (e.g., "func1().func2('arg')").
     * @param commandArrayString - The string of chained commands.
     * @returns An array of parsed function commands.
     */
    private static parseCommandArray;
    /**
     * Parses arguments from a function call string (e.g., "func('arg1', 123)").
     * @param commandString - The function call string.
     * @returns An array of string arguments, or null if no arguments.
     */
    static parseCommandArgs(commandString: string): string[] | null;
    /**
     * Parses a full command string, which can include CSS selectors, function calls,
     * and array access, piped together.
     * @param commandString - The full command string (e.g., "div.class | someFunc('arg') | [0]").
     * @returns An array of parsed commands.
     */
    static parseCommand(commandString: string): ParsedCommand[];
}
//# sourceMappingURL=command-parser.d.ts.map