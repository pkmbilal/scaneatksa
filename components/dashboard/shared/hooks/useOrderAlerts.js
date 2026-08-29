"use client";

// The presentation side of real-time order notifications: given classified
// order events (from lib/orderNotifications.classifyOrderEvent), it raises a
// sonner toast, plays a short chime, and keeps an in-memory list for the header
// bell dropdown. Subscription-agnostic -- callers feed it via `push`, wiring the
// event source themselves (useRestaurantOrdersRealtime for staff/owner, the
// per-user channel in useCustomerDashboardData for customers).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  notificationCopy,
  notificationKey,
  notificationToItem,
} from "@/lib/orderNotifications";

const SOUND_STORAGE_KEY = "scaneat:order-sound";
const CHIME_SRC = "/sounds/new-order.wav";
const MAX_NOTIFICATIONS = 30;

function readSoundPref() {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(SOUND_STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function useOrderAlerts() {
  const t = useTranslations("dashboard.common");

  const [notifications, setNotifications] = useState([]);
  // Lazy init from localStorage. On the server `readSoundPref` returns the
  // default (`true`); a muted client self-corrects on first render.
  const [soundEnabled, setSoundEnabled] = useState(readSoundPref);

  const seenRef = useRef(new Set());
  const audioRef = useRef(null);
  const hasInteractedRef = useRef(false);

  // Browsers block programmatic audio until the user has interacted with the
  // page. Track the first gesture so an early notification doesn't throw.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mark = () => {
      hasInteractedRef.current = true;
    };
    window.addEventListener("pointerdown", mark, { once: true });
    window.addEventListener("keydown", mark, { once: true });
    return () => {
      window.removeEventListener("pointerdown", mark);
      window.removeEventListener("keydown", mark);
    };
  }, []);

  const playChime = useCallback(() => {
    if (!soundEnabled || !hasInteractedRef.current) return;
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(CHIME_SRC);
        audioRef.current.preload = "auto";
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } catch {
      /* audio unavailable -- ignore */
    }
  }, [soundEnabled]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const nextVal = !prev;
      try {
        window.localStorage.setItem(SOUND_STORAGE_KEY, nextVal ? "on" : "off");
      } catch {
        /* storage unavailable -- ignore */
      }
      return nextVal;
    });
  }, []);

  const push = useCallback(
    (item) => {
      if (!item) return;

      const key = notificationKey(item);
      if (seenRef.current.has(key)) return;
      seenRef.current.add(key);

      setNotifications((prev) =>
        [
          {
            id: `${key}:${Date.now()}`,
            orderId: item.orderId,
            kind: item.kind,
            status: item.status,
            createdAt: item.createdAt,
            read: false,
          },
          ...prev,
        ].slice(0, MAX_NOTIFICATIONS)
      );

      const { title, body } = notificationCopy(item, t);
      toast(title, { description: body });
      playChime();
    },
    [t, playChime]
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) =>
      prev.some((n) => !n.read) ? prev.map((n) => ({ ...n, read: true })) : prev
    );
  }, []);

  const items = useMemo(
    () => notifications.map((n) => notificationToItem(n, t)),
    [notifications, t]
  );

  const unreadCount = useMemo(
    () => notifications.reduce((acc, n) => (n.read ? acc : acc + 1), 0),
    [notifications]
  );

  return {
    notifications,
    items,
    unreadCount,
    push,
    markAllRead,
    soundEnabled,
    toggleSound,
  };
}
