/**
 * Logging system for SuperSelector
 */
export declare enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}
export interface LogEntry {
    level: LogLevel;
    message: string;
    data?: any;
    timestamp: number;
    source?: string;
}
export declare class Logger {
    private level;
    private entries;
    private maxEntries;
    setLevel(level: LogLevel): void;
    error(message: string, data?: any, source?: string): void;
    warn(message: string, data?: any, source?: string): void;
    info(message: string, data?: any, source?: string): void;
    debug(message: string, data?: any, source?: string): void;
    private log;
    getEntries(level?: LogLevel): LogEntry[];
    clear(): void;
}
export declare const logger: Logger;
//# sourceMappingURL=logger.d.ts.map