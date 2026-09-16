import { describe, it, expect } from "vitest";
import { rateLimit } from "./rateLimit.js";

describe("rateLimit", () => {
  it("allows calls up to the limit, then rejects", () => {
    const key = `test-${Math.random()}`;
    const opts = { limit: 3, windowMs: 10_000 };

    expect(rateLimit(key, opts).allowed).toBe(true);
    expect(rateLimit(key, opts).allowed).toBe(true);
    expect(rateLimit(key, opts).allowed).toBe(true);

    const fourth = rateLimit(key, opts);
    expect(fourth.allowed).toBe(false);
    expect(fourth.retryAfterMs).toBeGreaterThan(0);
  });

  it("resets after the window elapses", async () => {
    const key = `test-${Math.random()}`;
    const opts = { limit: 1, windowMs: 50 };

    expect(rateLimit(key, opts).allowed).toBe(true);
    expect(rateLimit(key, opts).allowed).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(rateLimit(key, opts).allowed).toBe(true);
  });

  it("tracks separate keys independently", () => {
    const opts = { limit: 1, windowMs: 10_000 };
    const keyA = `a-${Math.random()}`;
    const keyB = `b-${Math.random()}`;

    expect(rateLimit(keyA, opts).allowed).toBe(true);
    expect(rateLimit(keyA, opts).allowed).toBe(false);
    // keyB has never been called -- its own limit is untouched by keyA's usage.
    expect(rateLimit(keyB, opts).allowed).toBe(true);
  });
});
