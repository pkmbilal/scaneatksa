// Client-side date-range presets for the owner Orders tab. Day boundaries are
// computed in the browser's local timezone (same approach as
// hooks/useOwnerAnalytics.js resolveRange), then used to filter the
// already-loaded orders array -- no extra server round-trip.

export const ORDERS_RANGE_OPTIONS = ["all", "today", "yesterday", "last7", "last30"];

export const DEFAULT_ORDERS_RANGE = "today";

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

// Resolves a preset to a half-open [start, end) pair of Dates. `null` on either
// side means unbounded ("all" -> both null).
export function resolveOrdersRange(range) {
  const todayStart = startOfDay(new Date());
  const tomorrowStart = addDays(todayStart, 1);

  switch (range) {
    case "today":
      return { start: todayStart, end: tomorrowStart };
    case "yesterday":
      return { start: addDays(todayStart, -1), end: todayStart };
    case "last7":
      return { start: addDays(todayStart, -6), end: tomorrowStart };
    case "last30":
      return { start: addDays(todayStart, -29), end: tomorrowStart };
    default:
      return { start: null, end: null }; // "all"
  }
}

export function filterOrdersByRange(orders, range) {
  const { start, end } = resolveOrdersRange(range);
  if (!start && !end) return orders || [];
  return (orders || []).filter((o) => {
    const ts = new Date(o.created_at);
    return (!start || ts >= start) && (!end || ts < end);
  });
}
