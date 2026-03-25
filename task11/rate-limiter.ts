// ============================================================
// Task 11 - TypeScript Functions
// Topic: Rate Limiting API with TypeScript
// ============================================================

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

/**
 * Any zero-argument function that returns a Promise.
 */
type Task<T> = () => Promise<T>;

/**
 * An entry sitting in the internal queue waiting to be executed.
 */
interface QueueEntry<T> {
    task: Task<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: unknown) => void;
}

// ─────────────────────────────────────────────
// Core Class: RateLimiter
// ─────────────────────────────────────────────

/**
 * Throttles asynchronous tasks so that at most `limitCount` tasks start
 * within every `windowMs` milliseconds.
 *
 * Tasks are queued and executed one-by-one with a fixed inter-task delay
 * (`windowMs / limitCount`) to spread them evenly across the window.
 *
 * @example
 * ```ts
 * const limiter = new RateLimiter(2, 1000); // 2 req / sec
 * await Promise.all(phones.map(p => limiter.add(() => sendSMS(p))));
 * ```
 */
export class RateLimiter {
    /** Internal FIFO work queue. */
    private queue: QueueEntry<any>[] = [];

    /** Whether the queue worker loop is currently running. */
    private isProcessing = false;

    /** Minimum gap (ms) between consecutive task starts. */
    private readonly interval: number;

    /**
     * @param limitCount - Max number of tasks allowed per window.
     * @param windowMs   - Duration of the window in milliseconds.
     */
    constructor(
        private readonly limitCount: number,
        private readonly windowMs: number
    ) {
        this.interval = windowMs / limitCount;
    }

    // ─────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────

    /**
     * Enqueues `task` and returns a Promise that resolves/rejects with the
     * task's result when it is eventually executed.
     */
    add<T>(task: Task<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.queue.push({ task, resolve, reject } as QueueEntry<T>);
            this.processQueue();
        });
    }

    /**
     * Current number of tasks waiting in the queue.
     */
    get pending(): number {
        return this.queue.length;
    }

    /**
     * Discards all queued (not yet started) tasks, rejecting their promises.
     */
    clear(): void {
        const dropped = this.queue.splice(0);
        dropped.forEach(({ reject }) => reject(new Error("RateLimiter: queue cleared")));
        console.log(`[RateLimiter] Cleared ${dropped.length} pending tasks.`);
    }

    // ─────────────────────────────────────────────
    // Private: queue worker
    // ─────────────────────────────────────────────

    /**
     * Starts the worker loop if it is not already running.
     * Processes one task at a time, waiting `interval` ms between each.
     */
    private async processQueue(): Promise<void> {
        // Guard: only one worker loop at a time.
        if (this.isProcessing || this.queue.length === 0) return;

        this.isProcessing = true;

        while (this.queue.length > 0) {
            const { task, resolve, reject } = this.queue.shift()!;

            // Fire the task — do NOT await so the interval throttle is the only delay.
            task().then(resolve).catch(reject);

            // Throttle: wait before starting the next task.
            if (this.queue.length > 0) {
                await this.sleep(this.interval);
            }
        }

        this.isProcessing = false;
    }

    /** Resolves after `ms` milliseconds. */
    private sleep(ms: number): Promise<void> {
        return new Promise((res) => setTimeout(res, ms));
    }
}

// ─────────────────────────────────────────────
// Demo / Usage Examples
// ─────────────────────────────────────────────

// ── Example 1: SMS sending with 2 req / sec ──────────────────

async function exampleSMSLimiter(): Promise<void> {
    console.log("\n=== Example 1: SMS Rate Limiter (2 req / sec) ===");

    const smsLimiter = new RateLimiter(2, 1_000);

    async function sendSMS(phone: string): Promise<{ success: boolean }> {
        console.log(`  → Sending SMS to ${phone}  [${new Date().toISOString()}]`);
        return { success: true };
    }

    const phones = ["010-0000001", "011-0000002", "012-0000003", "015-0000004", "016-0000005"];

    const results = await Promise.all(
        phones.map((phone) =>
            smsLimiter
                .add(() => sendSMS(phone))
                .then((res) => {
                    console.log(`  ✅ Sent to ${phone}:`, res);
                    return res;
                })
        )
    );

    console.log(`  Total sent: ${results.length}`);
}

// ── Example 2: API call throttle with error handling ─────────

async function exampleApiThrottle(): Promise<void> {
    console.log("\n=== Example 2: API Call Throttle (3 req / 2 sec) ===");

    const apiLimiter = new RateLimiter(3, 2_000);

    let callCount = 0;
    async function callApi(id: number): Promise<string> {
        callCount++;
        if (id === 3) throw new Error(`API error for id=${id}`);
        return `response-${id}`;
    }

    const ids = [1, 2, 3, 4, 5];

    await Promise.allSettled(
        ids.map((id) =>
            apiLimiter
                .add(() => callApi(id))
                .then((r) => console.log(`  ✅ id=${id}:`, r))
                .catch((e) => console.log(`  ❌ id=${id}: ${(e as Error).message}`))
        )
    );
}

// ── Example 3: Queue clear / drain ───────────────────────────

async function exampleQueueClear(): Promise<void> {
    console.log("\n=== Example 3: Queue Clear ===");

    const limiter = new RateLimiter(1, 2_000); // very slow: 1 req / 2 sec

    // Add 5 tasks immediately — the first fires right away, rest queue up.
    const promises = Array.from({ length: 5 }, (_, i) =>
        limiter
            .add(() => Promise.resolve(`task-${i}`))
            .then((r) => console.log("  Done:", r))
            .catch((e) => console.log("  Cancelled:", (e as Error).message))
    );

    // After 100 ms, nuke the remaining queue.
    setTimeout(() => {
        console.log(`  Pending before clear: ${limiter.pending}`);
        limiter.clear();
    }, 100);

    await Promise.allSettled(promises);
}

// ── Run all examples ─────────────────────────────────────────

(async () => {
    await exampleSMSLimiter();
    await exampleApiThrottle();
    await exampleQueueClear();
})();
