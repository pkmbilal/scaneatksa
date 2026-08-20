"use client";

import { useEffect, useRef } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

// Subscribes to Postgres changes on `orders` for one restaurant so a
// dashboard's order list updates live -- a new order placed, or its status
// changed by another role -- without a manual refresh. `onChange` is called
// with no args on every insert/update/delete; callers pass a silent
// refetch. Kept in a ref so callers don't need to memoize it themselves.
export function useRestaurantOrdersRealtime(restaurantId, onChange) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (!restaurantId) return;
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel(`orders-restaurant-${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        () => onChangeRef.current?.()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);
}
