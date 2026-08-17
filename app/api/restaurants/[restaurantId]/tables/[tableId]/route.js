import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function DELETE(req, context) {
  try {
    // ✅ Next.js: params can be a Promise
    const p = context?.params;
    const { restaurantId, tableId } = p && typeof p.then === "function" ? await p : p;

    // ✅ Verify user (owner) using access token
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

    // ✅ Check restaurant belongs to owner
    const { data: restaurant, error: rErr } = await supabaseAdmin
      .from("restaurants")
      .select("id, owner_id")
      .eq("id", restaurantId)
      .single();

    if (rErr || !restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    if (restaurant.owner_id !== userId) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    // ✅ Confirm the table belongs to this restaurant
    const { data: table, error: tErr } = await supabaseAdmin
      .from("restaurant_tables")
      .select("id, table_number")
      .eq("id", tableId)
      .eq("restaurant_id", restaurantId)
      .single();

    if (tErr || !table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    // ✅ Block deletion if any order references this table — deactivating is the safe path
    const { count, error: oErr } = await supabaseAdmin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("table_id", tableId);

    if (oErr) {
      return NextResponse.json({ error: oErr.message }, { status: 400 });
    }

    if (count && count > 0) {
      return NextResponse.json(
        {
          error: `This table has ${count} order${
            count === 1 ? "" : "s"
          } linked to it and can't be deleted. Deactivate it instead.`,
        },
        { status: 409 }
      );
    }

    const { error: delErr } = await supabaseAdmin.from("restaurant_tables").delete().eq("id", tableId);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
