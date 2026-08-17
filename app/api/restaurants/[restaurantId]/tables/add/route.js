import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs"; // important because we use crypto

const makeCode = () => crypto.randomBytes(6).toString("base64url"); // URL-safe

export async function POST(req, context) {
  try {
    // ✅ Next.js: params can be a Promise
    const p = context?.params;
    const { restaurantId } = p && typeof p.then === "function" ? await p : p;

    const { count } = await req.json(); // e.g. { count: 10 }

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

    const nCount = Number(count || 0);
    if (!nCount || nCount < 1 || nCount > 200) {
      return NextResponse.json({ error: "Invalid count" }, { status: 400 });
    }

    // ✅ Load existing tables to find the current highest table number
    const { data: existing, error: eErr } = await supabaseAdmin
      .from("restaurant_tables")
      .select("table_number")
      .eq("restaurant_id", restaurantId);

    if (eErr) {
      return NextResponse.json({ error: eErr.message }, { status: 400 });
    }

    const maxNum = (existing || []).reduce((max, t) => Math.max(max, t.table_number), 0);

    // ✅ Always append new tables after the current series — never fill old gaps
    const rows = Array.from({ length: nCount }, (_, i) => ({
      restaurant_id: restaurantId,
      table_number: maxNum + i + 1,
      code: makeCode(),
    }));

    const { error: insErr } = await supabaseAdmin.from("restaurant_tables").insert(rows);
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 });

    return NextResponse.json({ ok: true, created: rows.length });
  } catch (err) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
