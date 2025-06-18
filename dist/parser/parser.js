"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const tokenizer_1 = require("./tokenizer");
const errors_1 = require("../core/errors");
/**
 * Parser for SuperSelector syntax
 */
class Parser {
    constructor() {
        this.tokens = [];
        this.position = 0;
    }
    parse(input) {
        try {
            const tokenizer = new tokenizer_1.Tokenizer(input);
            this.tokens = tokenizer.tokenize();
            this.position = 0;
            const commands = this.parseCommands();
            return {
                commands,
                isValid: true,
                errors: [],
            };
        }
        catch (error) {
            return {
                commands: [],
                isValid: false,
                errors: [error instanceof Error ? error.message : String(error)],
            };
        }
    }
    parseCommands() {
        const commands = [];
        while (!this.isAtEnd()) {
            const command = this.parseCommand();
            if (command) {
                commands.push(command);
            }
            // Skip pipe if present
            if (this.match(tokenizer_1.TokenType.PIPE)) {
                this.advance();
            }
        }
        return commands;
    }
    parseCommand() {
        const token = this.peek();
        switch (token.type) {
            case tokenizer_1.TokenType.CSS_SELECTOR:
                return this.parseCssSelector();
            case tokenizer_1.TokenType.FUNCTION_NAME:
                return this.parseFunction();
            case tokenizer_1.TokenType.PROPERTY:
                return this.parseProperty();
            case tokenizer_1.TokenType.OPEN_BRACKET:
                return this.parseArrayAccess();
            default:
                throw errors_1.ErrorFactory.parse(`Unexpected token: ${token.type} at position ${token.position}`);
        }
    }
    parseCssSelector() {
        const token = this.advance();
        return {
            type: "css-selector",
            name: "css-selector",
            selector: token.value,
        };
    }
    parseFunction() {
        const nameToken = this.advance();
        if (!this.match(tokenizer_1.TokenType.OPEN_PAREN)) {
            throw errors_1.ErrorFactory.parse(`Expected '(' after function name '${nameToken.value}'`);
        }
        this.advance(); // consume '('
        const args = [];
        while (!this.match(tokenizer_1.TokenType.CLOSE_PAREN) && !this.isAtEnd()) {
            const arg = this.parseArgument();
            args.push(arg);
            if (this.match(tokenizer_1.TokenType.COMMA)) {
                this.advance();
            }
            else if (!this.match(tokenizer_1.TokenType.CLOSE_PAREN)) {
                throw errors_1.ErrorFactory.parse(`Expected ',' or ')' in function arguments`);
            }
        }
        if (!this.match(tokenizer_1.TokenType.CLOSE_PAREN)) {
            throw errors_1.ErrorFactory.parse(`Expected ')' to close function call`);
        }
        this.advance(); // consume ')'
        return {
            type: "function",
            name: nameToken.value,
            args,
        };
    }
    parseProperty() {
        const token = this.advance();
        return {
            type: "property",
            name: token.value,
        };
    }
    parseArrayAccess() {
        this.advance(); // consume '['
        if (!this.match(tokenizer_1.TokenType.NUMBER)) {
            throw errors_1.ErrorFactory.parse(`Expected number in array access`);
        }
        const indexToken = this.advance();
        const index = Number.parseInt(indexToken.value, 10);
        if (isNaN(index)) {
            throw errors_1.ErrorFactory.parse(`Invalid number in array access: ${indexToken.value}`);
        }
        if (!this.match(tokenizer_1.TokenType.CLOSE_BRACKET)) {
            throw errors_1.ErrorFactory.parse(`Expected ']' to close array access`);
        }
        this.advance(); // consume ']'
        return {
            type: "array-access",
            name: "array-access",
            index,
        };
    }
    parseArgument() {
        const token = this.peek();
        if (token.type === tokenizer_1.TokenType.STRING || token.type === tokenizer_1.TokenType.NUMBER) {
            return this.advance().value;
        }
        else if (token.type === tokenizer_1.TokenType.PROPERTY) {
            return this.advance().value;
        }
        else {
            throw errors_1.ErrorFactory.parse(`Expected string, number, or identifier as argument, got ${token.type}`);
        }
    }
    match(type) {
        return this.peek().type === type;
    }
    advance() {
        if (!this.isAtEnd()) {
            this.position++;
        }
        return this.previous();
    }
    peek() {
        return this.tokens[this.position];
    }
    previous() {
        return this.tokens[this.position - 1];
    }
    isAtEnd() {
        return this.position >= this.tokens.length || this.peek().type === tokenizer_1.TokenType.EOF;
    }
}
exports.Parser = Parser;
//# sourceMappingURL=parser.js.map