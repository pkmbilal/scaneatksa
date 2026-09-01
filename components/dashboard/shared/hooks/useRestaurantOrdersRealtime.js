"use client";

import { useEffect, useRef } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

// Subscribes to Postgres changes on `orders` for one restaurant so a
// dashboard's order list updates live -- a new order placed, or its status
// changed by another role -- without a manual refresh. `onChange` is called
// with no args on every insert/update/delete; callers pass a silent
// refetch. `onEvent` (optional) is called with the raw Supabase payload
// (`{ eventType, new, old, ... }`) so a caller can also raise a notification
// off the same single subscription. Both callbacks are kept in refs so callers
// don't need to memoize them.
export function useRestaurantOrdersRealtime(restaurantId, onChange, onEvent) {
  const onChangeRef = useRef(onChange);
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onChangeRef.current = onChange;
    onEventRef.current = onEvent;
  });

  useEffect(() => {
    if (!restaurantId) return;
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel(`orders-restaurant-${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          onChangeRef.current?.();
          onEventRef.current?.(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);
}
