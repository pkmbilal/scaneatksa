"use client";

// Data-fetch + client-side aggregation for the owner Analytics tab. Fetches
// lazily -- only while `enabled` is true (i.e. the Analytics tab is the
// active tab) -- and re-fetches whenever the restaurant or selected date
// range changes. Aggregation happens in plain JS over the fetched rows
// rather than a Postgres view/RPC, matching this codebase's existing style
// of fetching raw rows and reducing them in the component (see
// menuItems/categories/orders loaders in app/dashboard/owner/page.js).
//
// Revenue-counted statuses are `delivered` and `completed` only -- orders
// still in flight (new/accepted/preparing/ready) haven't been realized yet
// and could still change or be cancelled, and `cancelled` orders never
// count. Order-volume figures (counts, channel breakdown) include every
// non-cancelled status instead, so the owner still sees live activity.
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { CHANNEL_META, REVENUE_STATUSES } from "@/lib/orderStatus";

const CHANNEL_ORDER = Object.keys(CHANNEL_META); // fixed categorical order: dine_in, delivery, pickup

export const RANGE_OPTIONS = ["today", "last7", "last30", "thisMonth"];
const DEFAULT_RANGE = "last7";

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Resolves a range preset to [startDate, endDate) local-day boundaries, plus
// the ordered list of day buckets to render (even days with zero orders show
// up as a zero bar rather than a gap).
function resolveRange(range) {
  const todayStart = startOfDay(new Date());
  const tomorrowStart = addDays(todayStart, 1);

  let start;
  if (range === "today") start = todayStart;
  else if (range === "last30") start = addDays(todayStart, -29);
  else if (range === "thisMonth") start = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
  else start = addDays(todayStart, -6); // last7 (default)

  const days = [];
  for (let d = new Date(start); d < tomorrowStart; d = addDays(d, 1)) {
    days.push(new Date(d));
  }

  return { start, end: tomorrowStart, days };
}

function dayKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildRevenueByDay(orders, days) {
  const buckets = new Map(days.map((d) => [dayKey(d), { date: d, revenue: 0, orderCount: 0 }]));

  for (const o of orders || []) {
    if (o.status === "cancelled") continue;
    const key = dayKey(new Date(o.created_at));
    const bucket = buckets.get(key);
    if (!bucket) continue; // outside the requested range (shouldn't happen given the query filter)
    bucket.orderCount += 1;
    if (REVENUE_STATUSES.includes(o.status)) bucket.revenue += Number(o.total || 0);
  }

  return Array.from(buckets.values());
}

function buildChannelBreakdown(orders) {
  const byChannel = new Map(CHANNEL_ORDER.map((c) => [c, { channel: c, orderCount: 0, revenue: 0 }]));

  for (const o of orders || []) {
    if (o.status === "cancelled") continue;
    const entry = byChannel.get(o.channel);
    if (!entry) continue; // unknown channel value, skip defensively
    entry.orderCount += 1;
    if (REVENUE_STATUSES.includes(o.status)) entry.revenue += Number(o.total || 0);
  }

  return Array.from(byChannel.values());
}

function buildTopItems(orderItems, n = 5) {
  const byName = new Map();

  for (const row of orderItems || []) {
    const status = row.orders?.status;
    if (!REVENUE_STATUSES.includes(status)) continue;
    const name = row.name || "";
    const qty = Number(row.quantity || 0);
    const revenue = Number(row.price || 0) * qty;
    const existing = byName.get(name);
    if (existing) {
      existing.quantity += qty;
      existing.revenue += revenue;
    } else {
      byName.set(name, { name, quantity: qty, revenue });
    }
  }

  return Array.from(byName.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, n);
}

function buildKpis(orders) {
  let totalRevenue = 0;
  let revenueOrderCount = 0;
  let totalOrders = 0;
  const channelCounts = new Map();

  for (const o of orders || []) {
    if (o.status === "cancelled") continue;
    totalOrders += 1;
    channelCounts.set(o.channel, (channelCounts.get(o.channel) || 0) + 1);
    if (REVENUE_STATUSES.includes(o.status)) {
      totalRevenue += Number(o.total || 0);
      revenueOrderCount += 1;
    }
  }

  let topChannel = null;
  let topChannelCount = 0;
  for (const [channel, count] of channelCounts) {
    if (count > topChannelCount) {
      topChannel = channel;
      topChannelCount = count;
    }
  }

  return {
    totalRevenue,
    totalOrders,
    avgOrderValue: revenueOrderCount > 0 ? totalRevenue / revenueOrderCount : 0,
    topChannel,
  };
}

export function useOwnerAnalytics(restaurantId, { enabled = false } = {}) {
  const [range, setRange] = useState(DEFAULT_RANGE);
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { start, end, days } = useMemo(() => resolveRange(range), [range]);

  useEffect(() => {
    if (!enabled || !restaurantId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const supabase = supabaseBrowser();
      const startISO = start.toISOString();
      const endISO = end.toISOString();

      const [ordersRes, orderItemsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id, created_at, channel, status, total")
          .eq("restaurant_id", restaurantId)
          .gte("created_at", startISO)
          .lt("created_at", endISO)
          .order("created_at", { ascending: true }),
        supabase
          .from("order_items")
          .select("name, price, quantity, orders!inner(restaurant_id, created_at, status)")
          .eq("orders.restaurant_id", restaurantId)
          .gte("orders.created_at", startISO)
          .lt("orders.created_at", endISO),
      ]);

      if (cancelled) return;

      if (ordersRes.error || orderItemsRes.error) {
        setError(ordersRes.error || orderItemsRes.error);
        setOrders([]);
        setOrderItems([]);
      } else {
        setOrders(ordersRes.data || []);
        setOrderItems(orderItemsRes.data || []);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, restaurantId, range, refreshKey]);

  const revenueByDay = useMemo(() => buildRevenueByDay(orders, days), [orders, days]);
  const channelBreakdown = useMemo(() => buildChannelBreakdown(orders), [orders]);
  const topItems = useMemo(() => buildTopItems(orderItems), [orderItems]);
  const kpis = useMemo(() => buildKpis(orders), [orders]);

  return {
    range,
    setRange,
    loading,
    error,
    revenueByDay,
    channelBreakdown,
    topItems,
    kpis,
    refresh: () => setRefreshKey((k) => k + 1),
  };
}
