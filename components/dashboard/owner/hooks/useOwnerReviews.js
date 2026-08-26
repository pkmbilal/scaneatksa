"use client";

// Data-fetch + client-side aggregation for the owner Reviews tab. Mirrors
// useOwnerAnalytics.js's exact pattern: lazy-fetch only while `enabled` is
// true (i.e. the Reviews tab is active), a refreshKey counter for manual
// refetch, and KPIs computed as a plain JS reduction over the fetched rows
// rather than a Postgres view/RPC -- there's only one restaurant's worth of
// reviews in play here, so no need for the batched-view approach used by
// restaurant_rating_summary on the multi-restaurant listing pages.
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { getOwnerMenuItemRatings } from "@/lib/auth/client";

// KPIs are computed off restaurant-level rows only (menu_item_id null) --
// item-level ratings get their own "per-dish" breakdown (itemRatings below)
// instead of being folded into the overall restaurant average.
function buildKpis(reviews) {
  const restaurantReviews = reviews.filter((r) => !r.menu_item_id);
  const count = restaurantReviews.length;
  const sum = restaurantReviews.reduce((s, r) => s + Number(r.rating || 0), 0);
  const histogram = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: restaurantReviews.filter((r) => r.rating === star).length,
  }));
  // review_replies comes back as a single object (or null), not an array --
  // review_id is unique in review_replies, so PostgREST treats it as a
  // to-one embed.
  const unrepliedCount = restaurantReviews.filter((r) => !r.review_replies).length;

  return { count, avgRating: count > 0 ? sum / count : 0, histogram, unrepliedCount };
}

export function useOwnerReviews(restaurantId, { enabled = false } = {}) {
  const [reviews, setReviews] = useState([]);
  const [itemRatings, setItemRatings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!enabled || !restaurantId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const supabase = supabaseBrowser();

      const [{ data, error }, { data: itemRatingsData }] = await Promise.all([
        supabase
          .from("reviews")
          .select(
            `
            id, rating, comment, created_at, user_id, order_id, menu_item_id, reviewer_name,
            menu_items ( name ),
            review_replies ( id, reply, created_at, updated_at )
          `
          )
          .eq("restaurant_id", restaurantId)
          .order("created_at", { ascending: false }),
        getOwnerMenuItemRatings(restaurantId),
      ]);

      if (cancelled) return;

      if (error) {
        setError(error);
        setReviews([]);
      } else {
        setReviews(data || []);
      }
      setItemRatings(itemRatingsData || []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [enabled, restaurantId, refreshKey]);

  const kpis = useMemo(() => buildKpis(reviews), [reviews]);

  return { reviews, itemRatings, kpis, loading, error, refresh: () => setRefreshKey((k) => k + 1) };
}
