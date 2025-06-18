/**
 * Logging system for SuperSelector
 */
export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
}

export interface LogEntry {
    level: LogLevel
    message: string
    data?: any
    timestamp: number
    source?: string
}

export class Logger {
    private level: LogLevel = LogLevel.INFO
    private entries: LogEntry[] = []
    private maxEntries = 1000

    setLevel(level: LogLevel): void {
        this.level = level
    }

    error(message: string, data?: any, source?: string): void {
        this.log(LogLevel.ERROR, message, data, source)
    }

    warn(message: string, data?: any, source?: string): void {
        this.log(LogLevel.WARN, message, data, source)
    }

    info(message: string, data?: any, source?: string): void {
        this.log(LogLevel.INFO, message, data, source)
    }

    debug(message: string, data?: any, source?: string): void {
        this.log(LogLevel.DEBUG, message, data, source)
    }

    private log(level: LogLevel, message: string, data?: any, source?: string): void {
        if (level <= this.level) {
            const entry: LogEntry = {
                level,
                message,
                data,
                timestamp: Date.now(),
                source: source ?? "",
            }

            this.entries.push(entry)

            // Keep only the last maxEntries
            if (this.entries.length > this.maxEntries) {
                this.entries = this.entries.slice(-this.maxEntries)
            }

            // Console output in development
            if (typeof console !== "undefined") {
                const logMethod =
                    level === LogLevel.ERROR
                        ? "error"
                        : level === LogLevel.WARN
                            ? "warn"
                            : level === LogLevel.DEBUG
                                ? "debug"
                                : "log"

                console[logMethod](`[SuperSelector${source ? `:${source}` : ""}] ${message}`, data || "")
            }
        }
    }

    getEntries(level?: LogLevel): LogEntry[] {
        return level !== undefined ? this.entries.filter((entry) => entry.level === level) : [...this.entries]
    }

    clear(): void {
        this.entries = []
    }
}

// Global logger instance
export const logger = new Logger()
