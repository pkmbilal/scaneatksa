"use client";

import { useEffect, useRef } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

// Subscribes to Postgres changes on `orders` for one restaurant so a
// dashboard's order list updates live -- a new order placed, or its status
// changed by another role -- without a manual refresh.
//
// `onChange(payload)` is called on every insert/update/delete with the raw
// Supabase payload (`{ eventType, new, old, ... }`); callers patch their list
// in place with lib/orderRealtime.applyOrderEvent rather than refetching it.
// `onEvent(payload)` (optional) receives the same payload so a caller can also
// raise a notification off the same single subscription. `onResync()`
// (optional) runs when the channel re-subscribes after a drop -- events missed
// while disconnected aren't replayed, so callers reload the list then. All
// callbacks are kept in refs so callers don't need to memoize them.
export function useRestaurantOrdersRealtime(restaurantId, onChange, onEvent, onResync) {
  const onChangeRef = useRef(onChange);
  const onEventRef = useRef(onEvent);
  const onResyncRef = useRef(onResync);
  useEffect(() => {
    onChangeRef.current = onChange;
    onEventRef.current = onEvent;
    onResyncRef.current = onResync;
  });

  useEffect(() => {
    if (!restaurantId) return;
    const supabase = supabaseBrowser();
    let subscribedOnce = false;

    const channel = supabase
      .channel(`orders-restaurant-${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          onChangeRef.current?.(payload);
          onEventRef.current?.(payload);
        }
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") return;
        // The first SUBSCRIBED follows the page's own initial load; later ones
        // are reconnects after a network drop.
        if (subscribedOnce) onResyncRef.current?.();
        subscribedOnce = true;
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);
}
