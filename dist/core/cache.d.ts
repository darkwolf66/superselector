import type { SelectorValue } from "../types";
/**
 * Cache system for SuperSelector results
 */
export declare class Cache {
    private store;
    private defaultTTL;
    constructor(defaultTTL?: number);
    set<T extends SelectorValue>(key: string, value: T, ttl?: number): void;
    get<T extends SelectorValue>(key: string): T | null;
    has(key: string): boolean;
    delete(key: string): boolean;
    clear(): void;
    size(): number;
    keys(): string[];
    cleanup(): void;
    getStats(): {
        size: number;
        totalHits: number;
        averageAge: number;
    };
}
//# sourceMappingURL=cache.d.ts.map