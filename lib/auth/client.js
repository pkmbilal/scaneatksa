"use client";

import { supabaseBrowser } from "@/lib/supabase/client";

const supabase = supabaseBrowser();

// Sign up
export async function signUp(email, password, fullName = "") {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  // OPTIONAL: if you have signup trigger that creates user_profiles, you can remove this
  if (data.user && fullName) {
    await supabase.from("user_profiles").update({ full_name: fullName }).eq("id", data.user.id);
  }

  return { data, error };
}

// Sign in
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { data, error };

  // Check active
  if (data.user) {
    const { data: profile, error: pErr } = await supabase
      .from("user_profiles")
      .select("is_active")
      .eq("id", data.user.id)
      .maybeSingle();

    if (pErr) return { data, error: pErr };

    if (profile && profile.is_active === false) {
      await supabase.auth.signOut();
      return { data: null, error: { message: "Your account has been disabled. Please contact support." } };
    }
  }

  return { data, error: null };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user ?? null, error };
}

export async function getUserProfile(userId) {
  const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId).maybeSingle();
  return { data, error };
}

export async function getUserRestaurant(userId) {
  const { data, error } = await supabase.from("restaurants").select("*").eq("owner_id", userId).maybeSingle();
  return { data, error };
}

export async function submitRestaurantRequest(userId, restaurantData) {
  const { data, error } = await supabase
    .from("restaurant_requests")
    .insert([
      {
        user_id: userId,
        restaurant_name: restaurantData.name,
        phone: restaurantData.phone,
        address: restaurantData.address,
        description: restaurantData.description,
      },
    ])
    .select()
    .maybeSingle();

  return { data, error };
}

export async function getUserOrders(userId) {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id, created_at, channel, status, total, customer_name, customer_phone,
      delivery_address, notes, restaurant_id,
      restaurants ( name, slug ),
      restaurant_tables ( table_number ),
      order_items ( id, name, price, quantity )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  return { data: data || [], error };
}

export async function getUserRequests(userId) {
  const { data, error } = await supabase
    .from("restaurant_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return { data: data || [], error };
}

// Favorites (IMPORTANT: do NOT accept userId from UI, use session)
export async function addToFavorites(restaurantId) {
  const { data: au } = await supabase.auth.getUser();
  const user = au?.user;
  if (!user) return { data: null, error: { message: "Not logged in" } };

  const { data, error } = await supabase
    .from("favorite_restaurants")
    .insert([{ user_id: user.id, restaurant_id: restaurantId }])
    .select("id, user_id, restaurant_id, created_at")
    .maybeSingle();

  return { data, error };
}

export async function removeFromFavorites(restaurantId) {
  const { data: au } = await supabase.auth.getUser();
  const user = au?.user;
  if (!user) return { data: null, error: { message: "Not logged in" } };

  const { data, error } = await supabase
    .from("favorite_restaurants")
    .delete()
    .eq("user_id", user.id)
    .eq("restaurant_id", restaurantId)
    .select("id");

  return { data, error };
}

export async function getUserFavorites() {
  const { data: au } = await supabase.auth.getUser();
  const user = au?.user;
  if (!user) return { data: [], error: null };

  const { data, error } = await supabase
    .from("favorite_restaurants")
    .select(`
      id,
      user_id,
      restaurant_id,
      created_at,
      restaurant:restaurants!favorite_restaurants_restaurant_id_fkey (
        id, name, slug, address, image_url, phone
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return { data: data || [], error };
}

export async function isFavorited(restaurantId) {
  const { data: au } = await supabase.auth.getUser();
  const user = au?.user;
  if (!user) return { isFavorited: false, error: null };

  const { data, error } = await supabase
    .from("favorite_restaurants")
    .select("id")
    .eq("user_id", user.id)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  return { isFavorited: !!data, error };
}