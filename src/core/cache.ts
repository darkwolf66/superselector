import type { CacheEntry, SelectorValue } from "../types"

/**
 * Cache system for SuperSelector results
 */
export class Cache {
    private store = new Map<string, CacheEntry>()
    private defaultTTL = 60000 // 1 minute

    constructor(defaultTTL?: number) {
        if (defaultTTL) {
            this.defaultTTL = defaultTTL
        }
    }

    set<T extends SelectorValue>(key: string, value: T, ttl?: number): void {
        const entry: CacheEntry<T> = {
            value,
            timestamp: Date.now(),
            ttl: ttl || this.defaultTTL,
            hits: 0,
        }

        this.store.set(key, entry)
        // logger.debug(`Cache set: ${key}`, { ttl: entry.ttl })
    }

    get<T extends SelectorValue>(key: string): T | null {
        const entry = this.store.get(key) as CacheEntry<T> | undefined

        if (!entry) {
            return null
        }

        // Check if expired
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.store.delete(key)
            // logger.debug(`Cache expired: ${key}`)
            return null
        }

        // Increment hit counter
        entry.hits++
        // logger.debug(`Cache hit: ${key}`, { hits: entry.hits })

        return entry.value
    }

    has(key: string): boolean {
        const entry = this.store.get(key)
        if (!entry) return false

        // Check if expired
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.store.delete(key)
            return false
        }

        return true
    }

    delete(key: string): boolean {
        const deleted = this.store.delete(key)
        if (deleted) {
            // logger.debug(`Cache deleted: ${key}`)
        }
        return deleted
    }

    clear(): void {
        //const size = this.store.size
        this.store.clear()
        // logger.debug(`Cache cleared: ${size} entries removed`)
    }

    size(): number {
        return this.store.size
    }

    keys(): string[] {
        return Array.from(this.store.keys())
    }

    cleanup(): void {
        const now = Date.now()
        let cleaned = 0

        for (const [key, entry] of this.store.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.store.delete(key)
                cleaned++
            }
        }

        if (cleaned > 0) {
            // logger.debug(`Cache cleanup: ${cleaned} expired entries removed`)
        }
    }

    getStats(): { size: number; totalHits: number; averageAge: number } {
        const now = Date.now()
        let totalHits = 0
        let totalAge = 0

        for (const entry of this.store.values()) {
            totalHits += entry.hits
            totalAge += now - entry.timestamp
        }

        return {
            size: this.store.size,
            totalHits,
            averageAge: this.store.size > 0 ? totalAge / this.store.size : 0,
        }
    }
}
