"use strict";
// ============================================================
// Task 11 - TypeScript Functions
// Topic: Handle Retry Mechanism for Asynchronous Functions
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryHandler = void 0;
exports.withRetry = withRetry;
// ─────────────────────────────────────────────
// Helper: sleep
// ─────────────────────────────────────────────
/**
 * Returns a Promise that resolves after `ms` milliseconds.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// ─────────────────────────────────────────────
// Core Class: RetryHandler
// ─────────────────────────────────────────────
/**
 * Wraps any async function with a configurable retry mechanism.
 *
 * @example
 * ```ts
 * const handler = new RetryHandler({ maxAttempts: 5, delayMs: 500, exponentialBackoff: true });
 * const result  = await handler.execute(() => fetchData(url));
 * ```
 */
class RetryHandler {
    constructor(options = {}) {
        this.maxAttempts = options.maxAttempts ?? 3;
        this.delayMs = options.delayMs ?? 1000;
        this.exponentialBackoff = options.exponentialBackoff ?? false;
        this.shouldRetry = options.shouldRetry ?? (() => true);
        this.onRetry = options.onRetry ?? (() => { });
    }
    /**
     * Executes `fn` and retries on failure according to the configured options.
     *
     * @param fn - The async function to execute.
     * @returns A Promise that resolves with `fn`'s return value.
     * @throws The last error if all attempts fail.
     */
    async execute(fn) {
        let lastError;
        for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
                lastError = error;
                const isLastAttempt = attempt === this.maxAttempts;
                if (isLastAttempt || !this.shouldRetry(error, attempt)) {
                    break;
                }
                this.onRetry(error, attempt);
                const delay = this.exponentialBackoff
                    ? this.delayMs * Math.pow(2, attempt - 1)
                    : this.delayMs;
                await sleep(delay);
            }
        }
        throw lastError;
    }
}
exports.RetryHandler = RetryHandler;
// ─────────────────────────────────────────────
// Standalone Utility: withRetry
// ─────────────────────────────────────────────
/**
 * Functional wrapper — executes `fn` with retry logic without instantiating
 * a `RetryHandler` directly.
 *
 * @example
 * ```ts
 * const data = await withRetry(() => fetchData(url), { maxAttempts: 4 });
 * ```
 */
async function withRetry(fn, options = {}) {
    const handler = new RetryHandler(options);
    return handler.execute(fn);
}
// ─────────────────────────────────────────────
// Demo / Usage Examples
// ─────────────────────────────────────────────
// Simulates a flaky API that fails the first two times.
let callCount = 0;
async function flakyApiCall() {
    callCount++;
    console.log(`  → API call attempt #${callCount}`);
    if (callCount < 3) {
        throw new Error(`Network error on attempt ${callCount}`);
    }
    return "✅ Data fetched successfully!";
}
// ── Example 1: Using RetryHandler class ──────────────────────
async function exampleWithClass() {
    console.log("\n=== Example 1: RetryHandler class ===");
    callCount = 0; // reset
    const handler = new RetryHandler({
        maxAttempts: 5,
        delayMs: 200,
        exponentialBackoff: true,
        onRetry: (err, attempt) => console.log(`  ⚠ Attempt ${attempt} failed: ${err.message}. Retrying…`),
    });
    try {
        const result = await handler.execute(flakyApiCall);
        console.log(" Result:", result);
    }
    catch (err) {
        console.error(" All attempts failed:", err.message);
    }
}
// ── Example 2: Using withRetry function ──────────────────────
async function exampleWithFunction() {
    console.log("\n=== Example 2: withRetry function ===");
    callCount = 0; // reset
    try {
        const result = await withRetry(flakyApiCall, {
            maxAttempts: 3,
            delayMs: 100,
            onRetry: (_, attempt) => console.log(`  ↻ Retrying after attempt ${attempt}…`),
        });
        console.log(" Result:", result);
    }
    catch (err) {
        console.error(" All attempts failed:", err.message);
    }
}
// ── Example 3: Custom shouldRetry predicate ──────────────────
async function exampleWithCustomPredicate() {
    console.log("\n=== Example 3: Custom shouldRetry predicate ===");
    // Only retry on network errors, not on 4xx HTTP errors.
    const isRetryable = (error) => {
        if (error instanceof Error) {
            return error.message.startsWith("Network");
        }
        return false;
    };
    callCount = 0; // reset
    try {
        const result = await withRetry(flakyApiCall, {
            maxAttempts: 5,
            delayMs: 50,
            shouldRetry: isRetryable,
            onRetry: (_, attempt) => console.log(`  ↻ Retrying after attempt ${attempt}…`),
        });
        console.log(" Result:", result);
    }
    catch (err) {
        console.error(" All attempts failed:", err.message);
    }
}
// ── Run all examples ─────────────────────────────────────────
(async () => {
    await exampleWithClass();
    await exampleWithFunction();
    await exampleWithCustomPredicate();
})();
//# sourceMappingURL=retry-mechanism.js.map