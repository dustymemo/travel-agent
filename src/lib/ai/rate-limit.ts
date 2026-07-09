/**
 * AI provider rate-limiting + concurrency guard (TA-50).
 *
 * The Phase-1 `claude` CLI runs on the user's Gmail subscription, which has
 * rate limits, and each call is a real process on the host. This guard caps
 * both the request rate (sliding window) and simultaneous in-flight calls, so
 * an AI route (E3) can't exhaust the subscription or fork a pile of processes.
 *
 * Framework-free (AGENTS.md §2). The clock is injectable for deterministic tests.
 */
import { config } from "@/lib/config";

export interface RateLimitOptions {
  /** Max requests allowed within `windowMs`. */
  maxRequests: number;
  /** Sliding window length, in ms. */
  windowMs: number;
  /** Max simultaneously in-flight operations. */
  maxConcurrent: number;
  /** Clock, injectable for tests. Defaults to `Date.now`. */
  now?: () => number;
}

export type AcquireResult =
  | { ok: true; release: () => void }
  | { ok: false; reason: "rate" | "concurrency"; retryAfterMs: number };

/** Thrown by {@link RateLimiter.run} when a call is blocked. */
export class RateLimitError extends Error {
  constructor(
    readonly reason: "rate" | "concurrency",
    readonly retryAfterMs: number,
  ) {
    super(`AI request blocked (${reason}); retry after ${retryAfterMs}ms`);
    this.name = "RateLimitError";
  }
}

export class RateLimiter {
  private readonly now: () => number;
  private hits: number[] = [];
  private inFlight = 0;

  constructor(private readonly opts: RateLimitOptions) {
    this.now = opts.now ?? (() => Date.now());
  }

  /**
   * Try to reserve a slot. On success returns a `release()` to call when the
   * operation finishes; on failure returns why and how long to back off.
   */
  tryAcquire(): AcquireResult {
    const t = this.now();
    this.hits = this.hits.filter((ts) => t - ts < this.opts.windowMs);

    if (this.inFlight >= this.opts.maxConcurrent) {
      return { ok: false, reason: "concurrency", retryAfterMs: 1000 };
    }
    if (this.hits.length >= this.opts.maxRequests) {
      const oldest = this.hits[0];
      return {
        ok: false,
        reason: "rate",
        retryAfterMs: this.opts.windowMs - (t - oldest),
      };
    }

    this.hits.push(t);
    this.inFlight++;
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      this.inFlight = Math.max(0, this.inFlight - 1);
    };
    return { ok: true, release };
  }

  /**
   * Acquire, run `fn`, and always release. Throws {@link RateLimitError} if the
   * call is blocked — the caller (an E3 route) maps that to HTTP 429.
   */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    const res = this.tryAcquire();
    if (!res.ok) throw new RateLimitError(res.reason, res.retryAfterMs);
    try {
      return await fn();
    } finally {
      res.release();
    }
  }
}

/**
 * A {@link RateLimiter} configured from `config.ai.rateLimit`. The E3 AI route
 * should share one instance so limits apply across requests.
 */
export function createAiRateLimiter(now?: () => number): RateLimiter {
  return new RateLimiter({ ...config.ai.rateLimit, now });
}
