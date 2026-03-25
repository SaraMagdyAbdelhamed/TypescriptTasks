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
export declare class AsyncCache {
    private cache;
    /**
     * Returns the cached value for `key` if it is still valid,
     * otherwise calls `fetcher`, stores the result, and returns it.
     *
     * @param key     - Unique cache key.
     * @param fetcher - Async function that produces the value when the cache misses.
     * @param ttl     - Time-to-live in milliseconds. Default: 60 000 ms (1 minute).
     */
    get<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T>;
    /**
     * Manually invalidate a cache entry.
     */
    invalidate(key: string): void;
    /**
     * Remove ALL entries from the cache.
     */
    clear(): void;
    /**
     * Returns the number of entries currently in the cache (some may be expired).
     */
    get size(): number;
}
//# sourceMappingURL=async-cache.d.ts.map