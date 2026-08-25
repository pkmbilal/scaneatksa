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

function buildKpis(reviews) {
  const count = reviews.length;
  const sum = reviews.reduce((s, r) => s + Number(r.rating || 0), 0);
  const histogram = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  // review_replies comes back as a single object (or null), not an array --
  // review_id is unique in review_replies, so PostgREST treats it as a
  // to-one embed.
  const unrepliedCount = reviews.filter((r) => !r.review_replies).length;

  return { count, avgRating: count > 0 ? sum / count : 0, histogram, unrepliedCount };
}

export function useOwnerReviews(restaurantId, { enabled = false } = {}) {
  const [reviews, setReviews] = useState([]);
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

      if (cancelled) return;

      if (error) {
        setError(error);
        setReviews([]);
      } else {
        setReviews(data || []);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [enabled, restaurantId, refreshKey]);

  const kpis = useMemo(() => buildKpis(reviews), [reviews]);

  return { reviews, kpis, loading, error, refresh: () => setRefreshKey((k) => k + 1) };
}
