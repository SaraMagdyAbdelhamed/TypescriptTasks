/**
 * Any zero-argument function that returns a Promise.
 */
type Task<T> = () => Promise<T>;
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
export declare class RateLimiter {
    private readonly limitCount;
    private readonly windowMs;
    /** Internal FIFO work queue. */
    private queue;
    /** Whether the queue worker loop is currently running. */
    private isProcessing;
    /** Minimum gap (ms) between consecutive task starts. */
    private readonly interval;
    /**
     * @param limitCount - Max number of tasks allowed per window.
     * @param windowMs   - Duration of the window in milliseconds.
     */
    constructor(limitCount: number, windowMs: number);
    /**
     * Enqueues `task` and returns a Promise that resolves/rejects with the
     * task's result when it is eventually executed.
     */
    add<T>(task: Task<T>): Promise<T>;
    /**
     * Current number of tasks waiting in the queue.
     */
    get pending(): number;
    /**
     * Discards all queued (not yet started) tasks, rejecting their promises.
     */
    clear(): void;
    /**
     * Starts the worker loop if it is not already running.
     * Processes one task at a time, waiting `interval` ms between each.
     */
    private processQueue;
    /** Resolves after `ms` milliseconds. */
    private sleep;
}
export {};
//# sourceMappingURL=rate-limiter.d.ts.map