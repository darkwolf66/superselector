/**
 * Tokenizer for SuperSelector syntax
 */
export declare enum TokenType {
    CSS_SELECTOR = "CSS_SELECTOR",
    PIPE = "PIPE",
    FUNCTION_NAME = "FUNCTION_NAME",
    OPEN_PAREN = "OPEN_PAREN",
    CLOSE_PAREN = "CLOSE_PAREN",
    OPEN_BRACKET = "OPEN_BRACKET",
    CLOSE_BRACKET = "CLOSE_BRACKET",
    STRING = "STRING",
    NUMBER = "NUMBER",
    COMMA = "COMMA",
    PROPERTY = "PROPERTY",
    EOF = "EOF",
    WHITESPACE = "WHITESPACE"
}
export interface Token {
    type: TokenType;
    value: string;
    position: number;
    length: number;
}
export declare class Tokenizer {
    private input;
    private position;
    private tokens;
    constructor(input: string);
    tokenize(): Token[];
    private skipWhitespace;
    private tokenizeString;
    private tokenizeNumber;
    private tokenizeIdentifier;
    private looksLikeCssSelector;
    private addToken;
    private isWhitespace;
    private isDigit;
    private isAlpha;
    private isAlphaNumeric;
}
//# sourceMappingURL=tokenizer.d.ts.map