import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthedUserId } from "@/lib/r2/auth";
import { rateLimit } from "@/lib/rateLimit";

// Server-only helpers for account administration. Never import from a
// "use client" file -- supabaseAdmin uses the service-role key.

// ~100 years: Supabase Auth has no "ban forever", only a duration.
const BAN_FOREVER = "876000h";

const RATE_LIMIT = { limit: 60, windowMs: 60 * 1000 }; // 60 admin calls/min/admin

// The "aal" claim of the request's Bearer token. Only call after
// getAuthedUserId() has verified the token -- this just decodes the payload.
function tokenAal(req) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    return payload?.aal || null;
  } catch {
    return null;
  }
}

// Resolves the caller from the request's Bearer token and requires an active
// admin profile on a session that passed TOTP (aal2) -- the same rule
// is_admin() enforces in the database. Returns { userId } or
// { error: NextResponse }.
export async function requireAdmin(req) {
  const { userId, error: authError } = await getAuthedUserId(req);
  if (authError || !userId) {
    return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }

  if (tokenAal(req) !== "aal2") {
    return { error: NextResponse.json({ error: "MFA required" }, { status: 403 }) };
  }

  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("role, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role !== "admin" || profile.is_active === false) {
    return { error: NextResponse.json({ error: "Not allowed" }, { status: 403 }) };
  }

  const limited = await rateLimit(`admin:${userId}`, RATE_LIMIT);
  if (!limited.allowed) {
    return {
      error: NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(limited.retryAfterMs / 1000)) } }
      ),
    };
  }

  return { userId };
}

// Records a service-role admin action in admin_audit_log. Browser-side admin
// writes are logged by the log_admin_change() triggers; service-role writes
// can't be attributed there, so routes call this. Never throws -- a logging
// failure must not undo an action that already happened.
export async function logAdminAction(actorId, action, targetType, targetId, details = {}) {
  const { error } = await supabaseAdmin.from("admin_audit_log").insert([
    { actor_id: actorId, action, target_type: targetType, target_id: targetId, details },
  ]);
  if (error) console.error("logAdminAction failed:", error);
}

// Disables/enables an account for real: the profile flag drives the app's own
// checks (RLS, API routes, dashboard UI), and the Auth ban stops the user
// signing in or refreshing an existing session. If the ban call fails the
// profile flag is reverted so the two never disagree.
export async function setUserDisabled(userId, disabled) {
  const { error: profileError } = await supabaseAdmin
    .from("user_profiles")
    .update({ is_active: !disabled })
    .eq("id", userId);

  if (profileError) return { error: profileError };

  const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    ban_duration: disabled ? BAN_FOREVER : "none",
  });

  if (banError) {
    await supabaseAdmin.from("user_profiles").update({ is_active: disabled }).eq("id", userId);
    return { error: banError };
  }

  return { error: null };
}
