"use strict";
// ============================================================
// Task 11 - TypeScript Functions
// Topic: Promise-Based Cache with Expiration (AsyncCache)
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncCache = void 0;
const retry_mechanism_1 = require("./retry-mechanism");
// ─────────────────────────────────────────────
// Core Class: AsyncCache
// ─────────────────────────────────────────────
/**
 * A promise-based, in-memory cache with per-entry TTL expiration and
 * automatic cleanup of stale entries.
 *
 * @example
 * ```ts
 * const cache = new AsyncCache();
 * const user  = await cache.get("user_1", () => fetchUser(1), 30_000);
 * ```
 */
class AsyncCache {
    constructor() {
        this.cache = new Map();
    }
    /**
     * Returns the cached value for `key` if it is still valid,
     * otherwise calls `fetcher`, stores the result, and returns it.
     *
     * @param key     - Unique cache key.
     * @param fetcher - Async function that produces the value when the cache misses.
     * @param ttl     - Time-to-live in milliseconds. Default: 60 000 ms (1 minute).
     */
    async get(key, fetcher, ttl = 60000) {
        const now = Date.now();
        const cached = this.cache.get(key);
        // ── Cache HIT: entry exists and has not expired ────────────────
        if (cached && cached.expiresAt > now) {
            console.log(`[Cache HIT]  key="${key}"`);
            return cached.promise;
        }
        // ── Cache MISS: fetch fresh data ───────────────────────────────
        console.log(`[Cache MISS] key="${key}" — fetching…`);
        const promise = fetcher().catch((error) => {
            // On error, evict the entry so the next call retries the fetcher.
            this.cache.delete(key);
            throw error;
        });
        this.cache.set(key, { promise, expiresAt: now + ttl });
        // ── Auto-cleanup: remove the entry once its TTL elapses ────────
        setTimeout(() => {
            const current = this.cache.get(key);
            // Only delete if it is still the same generation (same expiresAt).
            if (current && current.expiresAt <= Date.now()) {
                this.cache.delete(key);
                console.log(`[Auto Clean] Expired entry removed: "${key}"`);
            }
        }, ttl);
        return promise;
    }
    /**
     * Manually invalidate a cache entry.
     */
    invalidate(key) {
        const deleted = this.cache.delete(key);
        console.log(deleted ? `[Invalidate] "${key}" removed.` : `[Invalidate] "${key}" not found.`);
    }
    /**
     * Remove ALL entries from the cache.
     */
    clear() {
        this.cache.clear();
        console.log("[Clear] Cache cleared.");
    }
    /**
     * Returns the number of entries currently in the cache (some may be expired).
     */
    get size() {
        return this.cache.size;
    }
}
exports.AsyncCache = AsyncCache;
// ─────────────────────────────────────────────
// Combined Usage: AsyncCache + RetryHandler
// ─────────────────────────────────────────────
/**
 * Wraps a fetcher with both retry logic and caching.
 * The RetryHandler is applied inside the fetcher so that:
 *   - Only a single in-flight request exists per key.
 *   - The cache stores the eventual result, not each retry attempt.
 */
async function getReliableData(cache, retryer) {
    return cache.get("profile_data", () => retryer.execute(() => 
    // Simulated fetch (browser fetch is not available in Node; using a mock)
    mockFetch("/api/profile")), 300000 // cache for 5 minutes
    );
}
// ─────────────────────────────────────────────
// Demo / Usage Examples
// ─────────────────────────────────────────────
// Simulate a network fetch that may fail on first calls.
let fetchCount = 0;
function mockFetch(url) {
    fetchCount++;
    console.log(`  → HTTP GET ${url}  (call #${fetchCount})`);
    if (fetchCount < 3) {
        return Promise.reject(new Error(`Network error on call #${fetchCount}`));
    }
    return Promise.resolve({ id: 1, name: "Ahmed", role: "admin" });
}
// ── Example 1: Basic cache hit / miss ────────────────────────
async function exampleBasicCache() {
    console.log("\n=== Example 1: Basic Cache Hit / Miss ===");
    const cache = new AsyncCache();
    fetchCount = 0;
    // First call  → MISS, fetches data
    const first = await cache.get("user_1", () => mockFetch("/api/users/1"), 5000);
    console.log(" First result:", first);
    // Second call → HIT, returns cached promise
    const second = await cache.get("user_1", () => mockFetch("/api/users/1"), 5000);
    console.log(" Second result:", second);
    console.log(" Cache size:", cache.size); // 1
}
// ── Example 2: Cache + Retry (combined) ──────────────────────
async function exampleCacheWithRetry() {
    console.log("\n=== Example 2: AsyncCache + RetryHandler ===");
    fetchCount = 0;
    const cache = new AsyncCache();
    const retryer = new retry_mechanism_1.RetryHandler({
        maxAttempts: 5,
        delayMs: 100,
        onRetry: (err, attempt) => console.log(`  ⚠ Retry ${attempt}: ${err.message}`),
    });
    const result = await getReliableData(cache, retryer);
    console.log(" Result:", result);
    // Second call uses the cache, no retries needed.
    const cached = await getReliableData(cache, retryer);
    console.log(" Cached:", cached);
}
// ── Example 3: Manual invalidation ───────────────────────────
async function exampleInvalidation() {
    console.log("\n=== Example 3: Manual Invalidation ===");
    fetchCount = 0;
    const cache = new AsyncCache();
    // Seed the cache
    await cache.get("settings", () => Promise.resolve({ theme: "dark" }), 10000);
    console.log(" Cache size before invalidate:", cache.size); // 1
    cache.invalidate("settings");
    console.log(" Cache size after  invalidate:", cache.size); // 0
}
// ── Run all examples ─────────────────────────────────────────
(async () => {
    await exampleBasicCache();
    await exampleCacheWithRetry();
    await exampleInvalidation();
})();
//# sourceMappingURL=async-cache.js.map