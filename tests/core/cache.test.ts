import { Cache } from "../../src/core/cache"

describe("Cache", () => {
    let cache: Cache

    beforeEach(() => {
        cache = new Cache(1000) // 1 second TTL
    })

    it("should store and retrieve values", () => {
        cache.set("key1", "value1")
        expect(cache.get("key1")).toBe("value1")
    })

    it("should return null for non-existent keys", () => {
        expect(cache.get("nonExistent")).toBeNull()
    })

    it("should expire entries after TTL", (done) => {
        cache.set("key1", "value1", 100) // 100ms TTL

        setTimeout(() => {
            expect(cache.get("key1")).toBeNull()
            done()
        }, 150)
    })

    it("should track hit counts", () => {
        cache.set("key1", "value1")
        cache.get("key1")
        cache.get("key1")

        const stats = cache.getStats()
        expect(stats.totalHits).toBe(2)
    })

    it("should clear all entries", () => {
        cache.set("key1", "value1")
        cache.set("key2", "value2")

        expect(cache.size()).toBe(2)
        cache.clear()
        expect(cache.size()).toBe(0)
    })

    it("should cleanup expired entries", (done) => {
        cache.set("key1", "value1", 50)
        cache.set("key2", "value2", 1000)

        setTimeout(() => {
            cache.cleanup()
            expect(cache.has("key1")).toBe(false)
            expect(cache.has("key2")).toBe(true)
            done()
        }, 100)
    })
})
