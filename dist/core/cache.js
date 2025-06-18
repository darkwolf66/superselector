"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cache = void 0;
/**
 * Cache system for SuperSelector results
 */
class Cache {
    constructor(defaultTTL) {
        this.store = new Map();
        this.defaultTTL = 60000; // 1 minute
        if (defaultTTL) {
            this.defaultTTL = defaultTTL;
        }
    }
    set(key, value, ttl) {
        const entry = {
            value,
            timestamp: Date.now(),
            ttl: ttl || this.defaultTTL,
            hits: 0,
        };
        this.store.set(key, entry);
        // logger.debug(`Cache set: ${key}`, { ttl: entry.ttl })
    }
    get(key) {
        const entry = this.store.get(key);
        if (!entry) {
            return null;
        }
        // Check if expired
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.store.delete(key);
            // logger.debug(`Cache expired: ${key}`)
            return null;
        }
        // Increment hit counter
        entry.hits++;
        // logger.debug(`Cache hit: ${key}`, { hits: entry.hits })
        return entry.value;
    }
    has(key) {
        const entry = this.store.get(key);
        if (!entry)
            return false;
        // Check if expired
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.store.delete(key);
            return false;
        }
        return true;
    }
    delete(key) {
        const deleted = this.store.delete(key);
        if (deleted) {
            // logger.debug(`Cache deleted: ${key}`)
        }
        return deleted;
    }
    clear() {
        //const size = this.store.size
        this.store.clear();
        // logger.debug(`Cache cleared: ${size} entries removed`)
    }
    size() {
        return this.store.size;
    }
    keys() {
        return Array.from(this.store.keys());
    }
    cleanup() {
        const now = Date.now();
        let cleaned = 0;
        for (const [key, entry] of this.store.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.store.delete(key);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            // logger.debug(`Cache cleanup: ${cleaned} expired entries removed`)
        }
    }
    getStats() {
        const now = Date.now();
        let totalHits = 0;
        let totalAge = 0;
        for (const entry of this.store.values()) {
            totalHits += entry.hits;
            totalAge += now - entry.timestamp;
        }
        return {
            size: this.store.size,
            totalHits,
            averageAge: this.store.size > 0 ? totalAge / this.store.size : 0,
        };
    }
}
exports.Cache = Cache;
//# sourceMappingURL=cache.js.map