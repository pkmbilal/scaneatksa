import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthedUserId } from "@/lib/r2/auth";
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
    const { userId, error: uErr } = await getAuthedUserId(req);
    if (uErr || !userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile, error: pErr } = await supabaseAdmin
      .from("user_profiles")
      .select("role, restaurant_id, is_active")
      .eq("id", userId)
      .single();

    if (pErr || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    // A disabled account's access token stays valid until it expires (the
    // Auth ban only stops refreshes), so check the flag on every mutation.
    if (profile.is_active === false) {
      return NextResponse.json({ error: "Account disabled" }, { status: 403 });
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

    // Conditional on the status canTransition() was checked against: if
    // another staff member changed the order in the meantime (e.g. owner
    // cancelled while kitchen clicked "Start Preparing"), no row matches and
    // the stale transition is rejected instead of silently overwriting.
    const { data: updated, error: updErr } = await supabaseAdmin
      .from("orders")
      .update({ status: nextStatus })
      .eq("id", orderId)
      .eq("status", order.status)
      .select(
        "id, restaurant_id, status, channel, total, customer_name, customer_phone, delivery_address, notes"
      )
      .maybeSingle();

    if (updErr) {
      console.error("Order status update failed:", updErr);
      return NextResponse.json({ error: "Update failed" }, { status: 400 });
    }

    if (!updated) {
      return NextResponse.json(
        { error: "This order was just updated by someone else. Refreshing…" },
        { status: 409 }
      );
    }

    return NextResponse.json({ ok: true, order: updated });
  } catch (err) {
    console.error("PATCH /api/orders/[id]/status failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
