import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthedUserId } from "@/lib/r2/auth";

// Server-only helpers for account administration. Never import from a
// "use client" file -- supabaseAdmin uses the service-role key.

// ~100 years: Supabase Auth has no "ban forever", only a duration.
const BAN_FOREVER = "876000h";

// Resolves the caller from the request's Bearer token and requires an active
// admin profile. Returns { userId } or { error: NextResponse }.
export async function requireAdmin(req) {
  const { userId, error: authError } = await getAuthedUserId(req);
  if (authError || !userId) {
    return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }

  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("role, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role !== "admin" || profile.is_active === false) {
    return { error: NextResponse.json({ error: "Not allowed" }, { status: 403 }) };
  }

  return { userId };
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
