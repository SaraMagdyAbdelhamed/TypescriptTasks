// ============================================================
// Task 11 - TypeScript Functions
// Topic: Handle Retry Mechanism for Asynchronous Functions
// ============================================================

// ─────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// Helper: sleep
// ─────────────────────────────────────────────

/**
 * Returns a Promise that resolves after `ms` milliseconds.
 */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

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
export class RetryHandler {
  private readonly maxAttempts: number;
  private readonly delayMs: number;
  private readonly exponentialBackoff: boolean;
  private readonly shouldRetry: (error: unknown, attempt: number) => boolean;
  private readonly onRetry: (error: unknown, attempt: number) => void;

  constructor(options: RetryOptions = {}) {
    this.maxAttempts       = options.maxAttempts       ?? 3;
    this.delayMs           = options.delayMs           ?? 1_000;
    this.exponentialBackoff = options.exponentialBackoff ?? false;
    this.shouldRetry       = options.shouldRetry       ?? (() => true);
    this.onRetry           = options.onRetry           ?? (() => {});
  }

  /**
   * Executes `fn` and retries on failure according to the configured options.
   *
   * @param fn - The async function to execute.
   * @returns A Promise that resolves with `fn`'s return value.
   * @throws The last error if all attempts fail.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
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
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const handler = new RetryHandler(options);
  return handler.execute(fn);
}

// ─────────────────────────────────────────────
// Demo / Usage Examples
// ─────────────────────────────────────────────

// Simulates a flaky API that fails the first two times.
let callCount = 0;
async function flakyApiCall(): Promise<string> {
  callCount++;
  console.log(`  → API call attempt #${callCount}`);
  if (callCount < 3) {
    throw new Error(`Network error on attempt ${callCount}`);
  }
  return "✅ Data fetched successfully!";
}

// ── Example 1: Using RetryHandler class ──────────────────────

async function exampleWithClass(): Promise<void> {
  console.log("\n=== Example 1: RetryHandler class ===");

  callCount = 0; // reset

  const handler = new RetryHandler({
    maxAttempts: 5,
    delayMs: 200,
    exponentialBackoff: true,
    onRetry: (err, attempt) =>
      console.log(`  ⚠ Attempt ${attempt} failed: ${(err as Error).message}. Retrying…`),
  });

  try {
    const result = await handler.execute(flakyApiCall);
    console.log(" Result:", result);
  } catch (err) {
    console.error(" All attempts failed:", (err as Error).message);
  }
}

// ── Example 2: Using withRetry function ──────────────────────

async function exampleWithFunction(): Promise<void> {
  console.log("\n=== Example 2: withRetry function ===");

  callCount = 0; // reset

  try {
    const result = await withRetry(flakyApiCall, {
      maxAttempts: 3,
      delayMs: 100,
      onRetry: (_, attempt) => console.log(`  ↻ Retrying after attempt ${attempt}…`),
    });
    console.log(" Result:", result);
  } catch (err) {
    console.error(" All attempts failed:", (err as Error).message);
  }
}

// ── Example 3: Custom shouldRetry predicate ──────────────────

async function exampleWithCustomPredicate(): Promise<void> {
  console.log("\n=== Example 3: Custom shouldRetry predicate ===");

  // Only retry on network errors, not on 4xx HTTP errors.
  const isRetryable = (error: unknown): boolean => {
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
  } catch (err) {
    console.error(" All attempts failed:", (err as Error).message);
  }
}

// ── Run all examples ─────────────────────────────────────────

(async () => {
  await exampleWithClass();
  await exampleWithFunction();
  await exampleWithCustomPredicate();
})();
