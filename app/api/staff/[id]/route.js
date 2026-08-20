import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// Enable/disable a staff account this owner created. Scoped to the caller's
// own restaurant so an owner can't touch another restaurant's staff.
export async function PATCH(req, context) {
  try {
    const p = context?.params;
    const { id: staffId } = p && typeof p.then === "function" ? await p : p;

    const body = await req.json();
    const { is_active } = body || {};
    if (typeof is_active !== "boolean") {
      return NextResponse.json({ error: "is_active must be a boolean" }, { status: 400 });
    }

    const authHeader = req.headers.get("authorization") || "";
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: uErr } = await supabaseUser.auth.getUser();
    const userId = userData?.user?.id;
    if (uErr || !userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: restaurant, error: rErr } = await supabaseAdmin
      .from("restaurants")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();

    if (rErr || !restaurant) {
      return NextResponse.json({ error: "No restaurant found for this account" }, { status: 403 });
    }

    const { data: target, error: tErr } = await supabaseAdmin
      .from("user_profiles")
      .select("id, restaurant_id, role")
      .eq("id", staffId)
      .maybeSingle();

    if (tErr || !target || target.restaurant_id !== restaurant.id || !["kitchen", "waiter"].includes(target.role)) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    const { data: updated, error: updErr } = await supabaseAdmin
      .from("user_profiles")
      .update({ is_active })
      .eq("id", staffId)
      .select("id, full_name, role, is_active, created_at")
      .single();

    if (updErr || !updated) {
      return NextResponse.json({ error: updErr?.message || "Update failed" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, staff: updated });
  } catch (err) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
