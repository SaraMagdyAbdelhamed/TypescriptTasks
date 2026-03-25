/**
 * Options to configure the retry behaviour.
 */
export interface RetryOptions {
    /** Maximum number of attempts (initial call + retries). Default: 3 */
    maxAttempts?: number;
    /** Delay in milliseconds between retries. Default: 1000 */
    delayMs?: number;
    /** Whether to use exponential back-off. Default: false */
    exponentialBackoff?: boolean;
    /** Optional predicate to decide if an error is retryable. */
    shouldRetry?: (error: unknown, attempt: number) => boolean;
    /** Optional callback invoked on each failed attempt. */
    onRetry?: (error: unknown, attempt: number) => void;
}
/**
 * Wraps any async function with a configurable retry mechanism.
 *
 * @example
 * ```ts
 * const handler = new RetryHandler({ maxAttempts: 5, delayMs: 500, exponentialBackoff: true });
 * const result  = await handler.execute(() => fetchData(url));
 * ```
 */
export declare class RetryHandler {
    private readonly maxAttempts;
    private readonly delayMs;
    private readonly exponentialBackoff;
    private readonly shouldRetry;
    private readonly onRetry;
    constructor(options?: RetryOptions);
    /**
     * Executes `fn` and retries on failure according to the configured options.
     *
     * @param fn - The async function to execute.
     * @returns A Promise that resolves with `fn`'s return value.
     * @throws The last error if all attempts fail.
     */
    execute<T>(fn: () => Promise<T>): Promise<T>;
}
/**
 * Functional wrapper — executes `fn` with retry logic without instantiating
 * a `RetryHandler` directly.
 *
 * @example
 * ```ts
 * const data = await withRetry(() => fetchData(url), { maxAttempts: 4 });
 * ```
 */
export declare function withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;
//# sourceMappingURL=retry-mechanism.d.ts.map