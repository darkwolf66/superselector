"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.Logger = exports.LogLevel = void 0;
/**
 * Logging system for SuperSelector
 */
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor() {
        this.level = LogLevel.INFO;
        this.entries = [];
        this.maxEntries = 1000;
    }
    setLevel(level) {
        this.level = level;
    }
    error(message, data, source) {
        this.log(LogLevel.ERROR, message, data, source);
    }
    warn(message, data, source) {
        this.log(LogLevel.WARN, message, data, source);
    }
    info(message, data, source) {
        this.log(LogLevel.INFO, message, data, source);
    }
    debug(message, data, source) {
        this.log(LogLevel.DEBUG, message, data, source);
    }
    log(level, message, data, source) {
        if (level <= this.level) {
            const entry = {
                level,
                message,
                data,
                timestamp: Date.now(),
                source: source ?? "",
            };
            this.entries.push(entry);
            // Keep only the last maxEntries
            if (this.entries.length > this.maxEntries) {
                this.entries = this.entries.slice(-this.maxEntries);
            }
            // Console output in development
            if (typeof console !== "undefined") {
                const logMethod = level === LogLevel.ERROR
                    ? "error"
                    : level === LogLevel.WARN
                        ? "warn"
                        : level === LogLevel.DEBUG
                            ? "debug"
                            : "log";
                console[logMethod](`[SuperSelector${source ? `:${source}` : ""}] ${message}`, data || "");
            }
        }
    }
    getEntries(level) {
        return level !== undefined ? this.entries.filter((entry) => entry.level === level) : [...this.entries];
    }
    clear() {
        this.entries = [];
    }
}
exports.Logger = Logger;
// Global logger instance
exports.logger = new Logger();
//# sourceMappingURL=logger.js.map