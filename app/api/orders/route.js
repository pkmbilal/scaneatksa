import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizeSaudiWhatsAppNumber } from "@/lib/whatsapp";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const body = await req.json();
    const { restaurantSlug, channel, tableCode, items, customer, notes } = body;

    // 1) Restaurant lookup
    const { data: restaurant, error: rErr } = await supabaseAdmin
      .from("restaurants")
      .select("id, pickup_available, delivery_available")
      .eq("slug", restaurantSlug)
      .single();

    if (rErr || !restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // 2) Channel validation
    if (channel === "pickup" && !restaurant.pickup_available) {
      return NextResponse.json({ error: "Pickup not available" }, { status: 400 });
    }
    if (channel === "delivery" && !restaurant.delivery_available) {
      return NextResponse.json({ error: "Delivery not available" }, { status: 400 });
    }

    // 3) Resolve table for dine-in
    let table_id = null;
    let table_number = null;

    if (channel === "dine_in") {
      if (!tableCode) {
        return NextResponse.json({ error: "Missing table code" }, { status: 400 });
      }

      const phoneDigits = normalizeSaudiWhatsAppNumber(customer?.phone);
      if (phoneDigits.length < 9 || phoneDigits.length > 15) {
        return NextResponse.json(
          { error: "Valid WhatsApp number is required" },
          { status: 400 }
        );
      }

      const { data: table } = await supabaseAdmin
        .from("restaurant_tables")
        .select("id, table_number")
        .eq("restaurant_id", restaurant.id)
        .eq("code", tableCode)
        .eq("is_active", true)
        .single();

      if (!table) {
        return NextResponse.json({ error: "Invalid table code" }, { status: 400 });
      }

      table_id = table.id;
      table_number = table.table_number;
    }

    // 4) Validate items + compute total (don’t trust client price)
    const ids = (items || []).map((x) => x.id);
    if (!ids.length) {
      return NextResponse.json({ error: "Empty cart" }, { status: 400 });
    }

    const { data: menuItems } = await supabaseAdmin
      .from("menu_items")
      .select("id, restaurant_id, name, price, is_available, is_sold_out")
      .in("id", ids);

    const map = new Map((menuItems || []).map((m) => [m.id, m]));

    let total = 0;
    const orderItems = [];

    for (const it of items) {
      const m = map.get(it.id);
      if (!m || m.restaurant_id !== restaurant.id) {
        return NextResponse.json({ error: "Invalid item in cart" }, { status: 400 });
      }
      if (!m.is_available || m.is_sold_out) {
        return NextResponse.json({ error: `${m.name} not available` }, { status: 400 });
      }

      const qty = Number(it.quantity || 1);
      total += Number(m.price) * qty;

      orderItems.push({
        menu_item_id: m.id,
        name: m.name,
        price: m.price,
        quantity: qty,
      });
    }

    // 5) Optional user_id (if logged in)
    let user_id = null;
    const authHeader = req.headers.get("authorization") || "";
    if (authHeader) {
      const supabaseUser = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data } = await supabaseUser.auth.getUser();
      user_id = data?.user?.id || null;
    }

    // 6) Insert order
    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .insert({
        restaurant_id: restaurant.id,
        channel,
        table_id,
        total,
        customer_name: customer?.name || null,
        customer_phone: customer?.phone || null,
        delivery_address: channel === "delivery" ? (customer?.address || null) : null,
        notes: notes || null,
        user_id,
      })
      .select("id")
      .single();

    if (oErr || !order) {
      return NextResponse.json({ error: oErr?.message || "Order insert failed" }, { status: 400 });
    }

    // 7) Insert order_items
    const rows = orderItems.map((x) => ({ ...x, order_id: order.id }));
    const { error: oiErr } = await supabaseAdmin.from("order_items").insert(rows);

    if (oiErr) {
      return NextResponse.json({ error: oiErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, orderId: order.id, tableNumber: table_number });
  } catch (err) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
