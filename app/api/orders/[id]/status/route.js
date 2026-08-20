import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { canTransition } from "@/lib/orderStatus";

export const runtime = "nodejs";

// Single point where an order's status is allowed to change. Reads run
// through client-side RLS (orders_owner_read / orders_staff_read / orders_read_own),
// but every mutation comes through here so the per-role transition rules
// (lib/orderStatus.js) are enforced in one place instead of split between
// RLS policies and UI button visibility.
export async function PATCH(req, context) {
  try {
    const p = context?.params;
    const { id: orderId } = p && typeof p.then === "function" ? await p : p;

    const body = await req.json();
    const nextStatus = body?.status;
    if (!nextStatus) {
      return NextResponse.json({ error: "Missing status" }, { status: 400 });
    }

    // ✅ Verify caller using access token
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

    const { data: profile, error: pErr } = await supabaseAdmin
      .from("user_profiles")
      .select("role, restaurant_id")
      .eq("id", userId)
      .single();

    if (pErr || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .select(
        "id, restaurant_id, status, channel, total, customer_name, customer_phone, delivery_address, notes"
      )
      .eq("id", orderId)
      .single();

    if (oErr || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // ✅ Scope: owner must own the order's restaurant; kitchen/waiter must be
    // assigned to it. Any other role (customer, admin) has no action here.
    let allowedRestaurant = false;
    if (profile.role === "owner") {
      const { data: restaurant } = await supabaseAdmin
        .from("restaurants")
        .select("id")
        .eq("id", order.restaurant_id)
        .eq("owner_id", userId)
        .maybeSingle();
      allowedRestaurant = !!restaurant;
    } else if (profile.role === "kitchen" || profile.role === "waiter") {
      allowedRestaurant = profile.restaurant_id === order.restaurant_id;
    }

    if (!allowedRestaurant) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    if (!canTransition(profile.role, order.status, nextStatus)) {
      return NextResponse.json(
        { error: `${profile.role} cannot move an order from "${order.status}" to "${nextStatus}"` },
        { status: 400 }
      );
    }

    const { data: updated, error: updErr } = await supabaseAdmin
      .from("orders")
      .update({ status: nextStatus })
      .eq("id", orderId)
      .select(
        "id, restaurant_id, status, channel, total, customer_name, customer_phone, delivery_address, notes"
      )
      .single();

    if (updErr || !updated) {
      return NextResponse.json({ error: updErr?.message || "Update failed" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, order: updated });
  } catch (err) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
