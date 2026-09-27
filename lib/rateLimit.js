import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Fixed-window rate limiter backed by Postgres (public.rate_limits +
// rate_limit_hit(), see supabase/migrations/*_rate_limits.sql). Counters are
// shared by every serverless instance -- an in-memory Map (as this used to
// be) is per instance on Vercel and resets on every cold start. Server-only.
//
// Resolves { allowed: true } if `key` is under `limit` calls within the
// current `windowMs` window, otherwise { allowed: false, retryAfterMs }.
// Fails open: if the database call errors, the request is allowed and the
// error logged -- a limiter hiccup must never block real customers.
export async function rateLimit(key, { limit, windowMs }) {
  const { data, error } = await supabaseAdmin
    .rpc("rate_limit_hit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: Math.max(1, Math.ceil(windowMs / 1000)),
    })
    .single();

  if (error || !data) {
    console.error("rateLimit failed open:", error);
    return { allowed: true };
  }

  return data.allowed ? { allowed: true } : { allowed: false, retryAfterMs: data.retry_after_ms };
}

// Best-effort client IP for anonymous rate-limit keys. Vercel sets both
// headers; x-forwarded-for can be a "client, proxy1, proxy2" list.
export function clientIp(req) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
