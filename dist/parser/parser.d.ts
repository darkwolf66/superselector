import type { ParseResult } from "../types";
/**
 * Parser for SuperSelector syntax
 */
export declare class Parser {
    private tokens;
    private position;
    parse(input: string): ParseResult;
    private parseCommands;
    private parseCommand;
    private parseCssSelector;
    private parseFunction;
    private parseProperty;
    private parseArrayAccess;
    private parseArgument;
    private match;
    private advance;
    private peek;
    private previous;
    private isAtEnd;
}
//# sourceMappingURL=parser.d.ts.map