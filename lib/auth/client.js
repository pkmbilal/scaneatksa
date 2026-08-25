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

// Fast, local session read (no network round trip) - for display-only UI
// like the navbar, where revalidating the JWT against the server isn't needed.
export async function getSessionUser() {
  const { data, error } = await supabase.auth.getSession();
  return { user: data?.session?.user ?? null, error };
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

// Reviews (public read via RLS; write is gated to the review's own author,
// verified against a completed order at insert time -- see the
// reviews_insert_own policy). v1 is restaurant-level only, so every query
// here filters menu_item_id to null.

export async function getRestaurantReviews(restaurantId) {
  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
      id, rating, comment, created_at, updated_at, user_id, order_id, reviewer_name,
      review_replies ( id, reply, created_at, updated_at )
    `
    )
    .eq("restaurant_id", restaurantId)
    .is("menu_item_id", null)
    .order("created_at", { ascending: false });

  return { data: data || [], error };
}

export async function getUserReviews() {
  const { data: au } = await supabase.auth.getUser();
  const user = au?.user;
  if (!user) return { data: [], error: null };

  const { data, error } = await supabase
    .from("reviews")
    .select("id, restaurant_id, order_id, rating, comment, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return { data: data || [], error };
}

// Submit or edit a review -- the reviews_one_per_order unique constraint
// (user_id, restaurant_id, order_id) means an upsert doubles as "edit my
// existing review for this order" with no separate update path needed.
//
// reviewer_name is snapshotted here rather than joined from user_profiles at
// display time: reviews are publicly readable, but user_profiles RLS only
// lets a user read their own row (user_profiles_read_own), so a live join
// would silently show a blank name for every reviewer except the viewer
// themself. This mirrors how order_items already snapshots name/price off
// menu_items instead of joining live.
export async function submitReview({ restaurantId, orderId, rating, comment }) {
  const { data: au } = await supabase.auth.getUser();
  const user = au?.user;
  if (!user) return { data: null, error: { message: "Not logged in" } };

  const { data: profile } = await supabase.from("user_profiles").select("full_name").eq("id", user.id).maybeSingle();
  const reviewerName = profile?.full_name || user.user_metadata?.full_name || null;

  const { data, error } = await supabase
    .from("reviews")
    .upsert(
      [
        {
          user_id: user.id,
          restaurant_id: restaurantId,
          order_id: orderId,
          rating,
          comment: comment || null,
          reviewer_name: reviewerName,
        },
      ],
      { onConflict: "user_id,restaurant_id,order_id" }
    )
    .select("id, restaurant_id, order_id, rating, comment, created_at, updated_at")
    .maybeSingle();

  return { data, error };
}

export async function deleteReview(reviewId) {
  const { data: au } = await supabase.auth.getUser();
  const user = au?.user;
  if (!user) return { error: { message: "Not logged in" } };

  const { error } = await supabase.from("reviews").delete().eq("id", reviewId).eq("user_id", user.id);
  return { error };
}

// Owner-side: reviews for the owner's own restaurant + reply CRUD. RLS
// (owns_restaurant) enforces ownership independently -- these are just the
// query shapes.
export async function getOwnerReviews(restaurantId) {
  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
      id, rating, comment, created_at, user_id, order_id, reviewer_name,
      review_replies ( id, reply, created_at, updated_at )
    `
    )
    .eq("restaurant_id", restaurantId)
    .is("menu_item_id", null)
    .order("created_at", { ascending: false });

  return { data: data || [], error };
}

export async function submitReviewReply(reviewId, reply) {
  const { data: au } = await supabase.auth.getUser();
  const user = au?.user;
  if (!user) return { data: null, error: { message: "Not logged in" } };

  const { data, error } = await supabase
    .from("review_replies")
    .upsert([{ review_id: reviewId, owner_id: user.id, reply }], { onConflict: "review_id" })
    .select("id, reply, created_at, updated_at")
    .maybeSingle();

  return { data, error };
}

export async function deleteReviewReply(reviewId) {
  const { error } = await supabase.from("review_replies").delete().eq("review_id", reviewId);
  return { error };
}

// Batched average-rating/review-count lookup for restaurant listing grids
// (RestaurantCard) -- one .in(restaurant_id, ids) query instead of one
// aggregate query per card. Client-component use only; server components
// (menu page, restaurants listing) query restaurant_rating_summary directly
// via supabaseServer() instead of importing this browser-only file.
export async function getRestaurantRatingSummaries(restaurantIds) {
  if (!restaurantIds?.length) return { data: [], error: null };

  const { data, error } = await supabase
    .from("restaurant_rating_summary")
    .select("restaurant_id, avg_rating, review_count")
    .in("restaurant_id", restaurantIds);

  return { data: data || [], error };
}