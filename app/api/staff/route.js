import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const STAFF_ROLES = ["kitchen", "waiter"];

async function requireOwnerRestaurant(req) {
  const authHeader = req.headers.get("authorization") || "";
  const supabaseUser = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: userData, error: uErr } = await supabaseUser.auth.getUser();
  const userId = userData?.user?.id;
  if (uErr || !userId) return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };

  const { data: restaurant, error: rErr } = await supabaseAdmin
    .from("restaurants")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();

  if (rErr || !restaurant) {
    return { error: NextResponse.json({ error: "No restaurant found for this account" }, { status: 403 }) };
  }

  return { restaurantId: restaurant.id };
}

// List this owner's kitchen/waiter staff accounts.
export async function GET(req) {
  const { error, restaurantId } = await requireOwnerRestaurant(req);
  if (error) return error;

  const { data, error: sErr } = await supabaseAdmin
    .from("user_profiles")
    .select("id, full_name, role, is_active, created_at")
    .eq("restaurant_id", restaurantId)
    .in("role", STAFF_ROLES)
    .order("created_at", { ascending: false });

  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 400 });
  return NextResponse.json({ ok: true, staff: data || [] });
}

// Create a kitchen or waiter account for this owner's restaurant. Owner sets
// the credentials directly (no invite-email flow) -- staff logs in with
// what the owner gives them.
export async function POST(req) {
  const { error, restaurantId } = await requireOwnerRestaurant(req);
  if (error) return error;

  const body = await req.json();
  const { email, password, fullName, role } = body || {};

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }
  if (!STAFF_ROLES.includes(role)) {
    return NextResponse.json({ error: "Role must be kitchen or waiter" }, { status: 400 });
  }

  const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (cErr || !created?.user) {
    return NextResponse.json({ error: cErr?.message || "Could not create account" }, { status: 400 });
  }

  // handle_new_user() trigger already inserted a user_profiles row with
  // role='customer' -- update it to the staff role + this restaurant.
  const { data: profile, error: upErr } = await supabaseAdmin
    .from("user_profiles")
    .update({ role, restaurant_id: restaurantId, full_name: fullName || null })
    .eq("id", created.user.id)
    .select("id, full_name, role, is_active, created_at")
    .single();

  if (upErr || !profile) {
    return NextResponse.json({ error: upErr?.message || "Account created but profile update failed" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, staff: profile });
}
