// Simple in-memory fixed-window rate limiter. Good enough for a single
// long-lived `next start` process (this app has no Redis/Upstash set up) --
// state resets on redeploy/restart, which is an acceptable tradeoff for
// throttling abuse from an authenticated user, not a hard security boundary.
const buckets = new Map(); // key -> { count, resetAt }

// Periodic sweep so users who stop calling don't leave stale entries around
// forever. Runs for the lifetime of the process; harmless to leave uncleared.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref();

// Returns { allowed: true } if `key` is under `limit` calls within the
// current `windowMs` window, otherwise { allowed: false, retryAfterMs }.
export function rateLimit(key, { limit, windowMs }) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true };
}
