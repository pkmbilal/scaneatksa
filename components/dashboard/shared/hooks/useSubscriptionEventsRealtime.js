"use client";

import { useEffect, useRef } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

// Subscribes to Postgres inserts on `subscription_events` for
// action = 'renewalRequested', across all restaurants -- so the admin
// dashboard can surface an owner's renewal request the moment it's logged,
// instead of only showing up on the next manual refresh. Modeled on
// useRestaurantOrdersRealtime.js. RLS (subscription_events_admin_all) scopes
// delivery to admins; no restaurant filter is needed here since admins need
// every restaurant's requests, not just one.
export function useSubscriptionEventsRealtime(onInsert) {
  const onInsertRef = useRef(onInsert);
  useEffect(() => {
    onInsertRef.current = onInsert;
  });

  useEffect(() => {
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel("subscription-events-renewal-requests")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "subscription_events",
          filter: "action=eq.renewalRequested",
        },
        (payload) => {
          onInsertRef.current?.(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
