import type { Command, ParseResult } from "../types"
import { Tokenizer, TokenType, type Token } from "./tokenizer"
import { ErrorFactory } from "../core/errors"

/**
 * Parser for SuperSelector syntax
 */
export class Parser {
    private tokens: Token[] = []
    private position = 0

    parse(input: string): ParseResult {
        try {
            const tokenizer = new Tokenizer(input)
            this.tokens = tokenizer.tokenize()
            this.position = 0

            const commands = this.parseCommands()

            return {
                commands,
                isValid: true,
                errors: [],
            }
        } catch (error) {
            return {
                commands: [],
                isValid: false,
                errors: [error instanceof Error ? error.message : String(error)],
            }
        }
    }

    private parseCommands(): Command[] {
        const commands: Command[] = []

        while (!this.isAtEnd()) {
            const command = this.parseCommand()
            if (command) {
                commands.push(command)
            }

            // Skip pipe if present
            if (this.match(TokenType.PIPE)) {
                this.advance()
            }
        }

        return commands
    }

    private parseCommand(): Command | null {
        const token = this.peek()

        switch (token.type) {
            case TokenType.CSS_SELECTOR:
                return this.parseCssSelector()
            case TokenType.FUNCTION_NAME:
                return this.parseFunction()
            case TokenType.PROPERTY:
                return this.parseProperty()
            case TokenType.OPEN_BRACKET:
                return this.parseArrayAccess()
            default:
                throw ErrorFactory.parse(`Unexpected token: ${token.type} at position ${token.position}`)
        }
    }

    private parseCssSelector(): Command {
        const token = this.advance()
        return {
            type: "css-selector",
            name: "css-selector",
            selector: token.value,
        }
    }

    private parseFunction(): Command {
        const nameToken = this.advance()

        if (!this.match(TokenType.OPEN_PAREN)) {
            throw ErrorFactory.parse(`Expected '(' after function name '${nameToken.value}'`)
        }

        this.advance() // consume '('

        const args: string[] = []

        while (!this.match(TokenType.CLOSE_PAREN) && !this.isAtEnd()) {
            const arg = this.parseArgument()
            args.push(arg)

            if (this.match(TokenType.COMMA)) {
                this.advance()
            } else if (!this.match(TokenType.CLOSE_PAREN)) {
                throw ErrorFactory.parse(`Expected ',' or ')' in function arguments`)
            }
        }

        if (!this.match(TokenType.CLOSE_PAREN)) {
            throw ErrorFactory.parse(`Expected ')' to close function call`)
        }

        this.advance() // consume ')'

        return {
            type: "function",
            name: nameToken.value,
            args,
        }
    }

    private parseProperty(): Command {
        const token = this.advance()
        return {
            type: "property",
            name: token.value,
        }
    }

    private parseArrayAccess(): Command {
        this.advance() // consume '['

        if (!this.match(TokenType.NUMBER)) {
            throw ErrorFactory.parse(`Expected number in array access`)
        }

        const indexToken = this.advance()
        const index = Number.parseInt(indexToken.value, 10)

        if (isNaN(index)) {
            throw ErrorFactory.parse(`Invalid number in array access: ${indexToken.value}`)
        }

        if (!this.match(TokenType.CLOSE_BRACKET)) {
            throw ErrorFactory.parse(`Expected ']' to close array access`)
        }

        this.advance() // consume ']'

        return {
            type: "array-access",
            name: "array-access",
            index,
        }
    }

    private parseArgument(): string {
        const token = this.peek()

        if (token.type === TokenType.STRING || token.type === TokenType.NUMBER) {
            return this.advance().value
        } else if (token.type === TokenType.PROPERTY) {
            return this.advance().value
        } else {
            throw ErrorFactory.parse(`Expected string, number, or identifier as argument, got ${token.type}`)
        }
    }

    private match(type: TokenType): boolean {
        return this.peek().type === type
    }

    private advance(): Token {
        if (!this.isAtEnd()) {
            this.position++
        }
        return this.previous()
    }

    private peek(): Token {
        return this.tokens[this.position]
    }

    private previous(): Token {
        return this.tokens[this.position - 1]
    }

    private isAtEnd(): boolean {
        return this.position >= this.tokens.length || this.peek().type === TokenType.EOF
    }
}
