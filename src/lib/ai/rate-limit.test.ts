import { describe, it, expect } from "vitest";
import {
  RateLimiter,
  RateLimitError,
  createAiRateLimiter,
} from "@/lib/ai/rate-limit";
import { config } from "@/lib/config";

/** Build a limiter with a controllable clock. */
function make(
  opts: Partial<ConstructorParameters<typeof RateLimiter>[0]> = {},
) {
  let t = 0;
  const limiter = new RateLimiter({
    maxRequests: 3,
    windowMs: 1000,
    maxConcurrent: 2,
    now: () => t,
    ...opts,
  });
  return { limiter, advance: (ms: number) => (t += ms) };
}

describe("RateLimiter.tryAcquire", () => {
  it("allows up to maxRequests within the window", () => {
    const { limiter } = make({ maxConcurrent: 10 });
    const a = limiter.tryAcquire();
    const b = limiter.tryAcquire();
    const c = limiter.tryAcquire();
    expect([a.ok, b.ok, c.ok]).toEqual([true, true, true]);
    // release concurrency so only the rate limit can block the 4th
    if (a.ok) a.release();
    if (b.ok) b.release();
    if (c.ok) c.release();
    const d = limiter.tryAcquire();
    expect(d.ok).toBe(false);
    if (!d.ok) {
      expect(d.reason).toBe("rate");
      expect(d.retryAfterMs).toBeGreaterThan(0);
    }
  });

  it("blocks on concurrency when too many are in flight", () => {
    const { limiter } = make({ maxConcurrent: 2, maxRequests: 100 });
    limiter.tryAcquire();
    limiter.tryAcquire();
    const third = limiter.tryAcquire();
    expect(third.ok).toBe(false);
    if (!third.ok) expect(third.reason).toBe("concurrency");
  });

  it("frees a concurrency slot on release", () => {
    const { limiter } = make({ maxConcurrent: 1, maxRequests: 100 });
    const a = limiter.tryAcquire();
    expect(limiter.tryAcquire().ok).toBe(false);
    if (a.ok) a.release();
    expect(limiter.tryAcquire().ok).toBe(true);
  });

  it("double-release is a no-op (doesn't over-free slots)", () => {
    const { limiter } = make({ maxConcurrent: 1, maxRequests: 100 });
    const a = limiter.tryAcquire();
    if (a.ok) {
      a.release();
      a.release();
    }
    // only one slot should have been freed
    expect(limiter.tryAcquire().ok).toBe(true);
    expect(limiter.tryAcquire().ok).toBe(false);
  });

  it("slides the window: allows again after windowMs passes", () => {
    const { limiter, advance } = make({ maxRequests: 1, maxConcurrent: 10 });
    const a = limiter.tryAcquire();
    if (a.ok) a.release();
    expect(limiter.tryAcquire().ok).toBe(false);
    advance(1001);
    expect(limiter.tryAcquire().ok).toBe(true);
  });
});

describe("RateLimiter.run", () => {
  it("runs fn and releases the slot afterwards", async () => {
    const { limiter } = make({ maxConcurrent: 1, maxRequests: 100 });
    const out = await limiter.run(async () => "done");
    expect(out).toBe("done");
    // slot was released → can run again
    expect(limiter.tryAcquire().ok).toBe(true);
  });

  it("releases even when fn throws", async () => {
    const { limiter } = make({ maxConcurrent: 1, maxRequests: 100 });
    await expect(
      limiter.run(async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    expect(limiter.tryAcquire().ok).toBe(true);
  });

  it("throws RateLimitError when blocked, carrying reason + retryAfterMs", async () => {
    const { limiter } = make({ maxConcurrent: 1, maxRequests: 100 });
    limiter.tryAcquire(); // occupy the only slot
    const err = await limiter.run(async () => "x").catch((e) => e);
    expect(err).toBeInstanceOf(RateLimitError);
    expect(err.reason).toBe("concurrency");
    expect(err.retryAfterMs).toBeGreaterThanOrEqual(0);
  });
});

describe("createAiRateLimiter", () => {
  it("builds a limiter from config.ai.rateLimit", () => {
    const limiter = createAiRateLimiter(() => 0);
    // Occupy up to the configured concurrency, then the next is blocked.
    for (let i = 0; i < config.ai.rateLimit.maxConcurrent; i++) {
      expect(limiter.tryAcquire().ok).toBe(true);
    }
    expect(limiter.tryAcquire().ok).toBe(false);
  });
});
