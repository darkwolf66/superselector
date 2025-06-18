/**
 * Tokenizer for SuperSelector syntax
 */
export enum TokenType {
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
    WHITESPACE = "WHITESPACE",
}

export interface Token {
    type: TokenType
    value: string
    position: number
    length: number
}

export class Tokenizer {
    private input: string
    private position = 0
    private tokens: Token[] = []

    constructor(input: string) {
        this.input = input.trim()
    }

    tokenize(): Token[] {
        this.tokens = []
        this.position = 0

        while (this.position < this.input.length) {
            this.skipWhitespace()

            if (this.position >= this.input.length) break

            const char = this.input[this.position]

            switch (char) {
                case "|":
                    this.addToken(TokenType.PIPE, char)
                    this.position++
                    break
                case "(":
                    this.addToken(TokenType.OPEN_PAREN, char)
                    this.position++
                    break
                case ")":
                    this.addToken(TokenType.CLOSE_PAREN, char)
                    this.position++
                    break
                case "[":
                    this.addToken(TokenType.OPEN_BRACKET, char)
                    this.position++
                    break
                case "]":
                    this.addToken(TokenType.CLOSE_BRACKET, char)
                    this.position++
                    break
                case ",":
                    this.addToken(TokenType.COMMA, char)
                    this.position++
                    break
                case '"':
                case "'":
                    this.tokenizeString(char)
                    break
                default:
                    if (
                        this.isDigit(char) ||
                        (char === "-" && this.position + 1 < this.input.length && this.isDigit(this.input[this.position + 1]))
                    ) {
                        this.tokenizeNumber()
                    } else if (this.isAlpha(char) || char === "_" || char === "-" || char === "." || char === "#") {
                        this.tokenizeIdentifier()
                    } else {
                        throw new Error(`Unexpected character '${char}' at position ${this.position}`)
                    }
            }
        }

        this.addToken(TokenType.EOF, "")
        return this.tokens
    }

    private skipWhitespace(): void {
        while (this.position < this.input.length && this.isWhitespace(this.input[this.position])) {
            this.position++
        }
    }

    private tokenizeString(quote: string): void {
        const start = this.position
        this.position++ // Skip opening quote

        let value = ""
        while (this.position < this.input.length && this.input[this.position] !== quote) {
            if (this.input[this.position] === "\\" && this.position + 1 < this.input.length) {
                // Handle escape sequences
                this.position++
                const escaped = this.input[this.position]
                switch (escaped) {
                    case "n":
                        value += "\n"
                        break
                    case "t":
                        value += "\t"
                        break
                    case "r":
                        value += "\r"
                        break
                    case "\\":
                        value += "\\"
                        break
                    case '"':
                        value += '"'
                        break
                    case "'":
                        value += "'"
                        break
                    default:
                        value += escaped
                        break
                }
            } else {
                value += this.input[this.position]
            }
            this.position++
        }

        if (this.position >= this.input.length) {
            throw new Error(`Unterminated string starting at position ${start}`)
        }

        this.position++ // Skip closing quote
        this.addToken(TokenType.STRING, value, start)
    }

    private tokenizeNumber(): void {
        const start = this.position
        let value = ""

        // Handle negative sign
        if (this.input[this.position] === "-") {
            value += this.input[this.position]
            this.position++
        }

        while (
            this.position < this.input.length &&
            (this.isDigit(this.input[this.position]) || this.input[this.position] === ".")
            ) {
            value += this.input[this.position]
            this.position++
        }

        this.addToken(TokenType.NUMBER, value, start)
    }

    private tokenizeIdentifier(): void {
        const start = this.position
        let value = "" // This will store the first "word" of the identifier

        // Consume the first word (potential function name, property, or start of CSS selector)
        while (
            this.position < this.input.length &&
            (this.isAlphaNumeric(this.input[this.position]) ||
                this.input[this.position] === "_" ||
                this.input[this.position] === "-" ||
                // Allow . and # at the start of an identifier if it's part of a CSS selector
                ((this.input[this.position] === "." || this.input[this.position] === "#") && this.position === start))
            ) {
            value += this.input[this.position]
            this.position++
        }

        // Peek ahead for an opening parenthesis to determine if it's a function call
        let peekPos = this.position
        while (peekPos < this.input.length && this.isWhitespace(this.input[peekPos])) {
            peekPos++
        }

        if (peekPos < this.input.length && this.input[peekPos] === "(") {
            this.addToken(TokenType.FUNCTION_NAME, value, start)
            // The main loop will then tokenize '(', args, ')'
        } else {
            // Not a function name. It's either a CSS selector or a property.
            // Call looksLikeCssSelector with the original start position of this identifier.
            if (this.looksLikeCssSelector(start)) {
                // It's a CSS selector. Consume the entire segment from 'start' to the pipe or EOL.
                let cssSegmentValue = ""
                let currentPos = start
                while (currentPos < this.input.length && this.input[currentPos] !== "|") {
                    cssSegmentValue += this.input[currentPos]
                    currentPos++
                }
                cssSegmentValue = cssSegmentValue.trim()
                this.addToken(TokenType.CSS_SELECTOR, cssSegmentValue, start)
                this.position = currentPos // Update position to after the consumed CSS segment
            } else {
                // It's a property. The 'value' we read is the property name.
                // 'this.position' is already advanced past 'value'.
                this.addToken(TokenType.PROPERTY, value, start)
            }
        }
    }

    private looksLikeCssSelector(scanStartPos: number): boolean {
        let pos = scanStartPos
        let segment = ""
        // Read the segment from scanStartPos until a pipe or end of input
        while (pos < this.input.length && this.input[pos] !== "|") {
            segment += this.input[pos]
            pos++
        }
        segment = segment.trim()

        if (!segment) {
            return false
        }

        // Rule 1: Contains CSS-specific characters. Definitely a CSS selector.
        if (/[.#\s>+~[\]:]/.test(segment)) {
            return true
        }

        // Rule 2: It's a simple word (e.g., "div", "textContent").
        if (/^[a-zA-Z_][\w-]*$/.test(segment)) {
            // If it's the first token in the string, treat it as a CSS tag selector.
            if (this.tokens.length === 0) {
                return true
            }
            // Otherwise, it's a property.
            return false
        }

        // Default case for anything else.
        return false
    }

    private addToken(type: TokenType, value: string, start?: number): void {
        this.tokens.push({
            type,
            value,
            position: start ?? this.position - value.length,
            length: value.length,
        })
    }

    private isWhitespace(char: string): boolean {
        return /\s/.test(char)
    }

    private isDigit(char: string): boolean {
        return /\d/.test(char)
    }

    private isAlpha(char: string): boolean {
        return /[a-zA-Z]/.test(char)
    }

    private isAlphaNumeric(char: string): boolean {
        return /[a-zA-Z0-9]/.test(char)
    }
}
