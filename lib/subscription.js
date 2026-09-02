// Subscription / trial helpers shared by the admin "Subscriptions" tab and the
// owner-facing SubscriptionBanner. Enforcement itself lives in Postgres
// (is_restaurant_published() + the two public-read policies on restaurants) --
// these helpers only derive display state from the same columns.

export const MS_PER_DAY = 864e5;

// Whole days from now until `expiresAt` (negative once past). null when there is
// no expiry (unlimited / comped access).
export function daysUntil(expiresAt) {
  if (!expiresAt) return null;
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / MS_PER_DAY);
}

// Derives the effective state of a restaurant's subscription from its row.
// Returns one of: "unlimited" | "suspended" | "expired" | "trial" | "active".
export function getSubscriptionState(restaurant) {
  if (!restaurant) return "active";
  const status = restaurant.subscription_status || "trial";
  const expiresAt = restaurant.subscription_expires_at || null;

  if (status === "suspended") return "suspended";
  if (!expiresAt) return "unlimited";
  if (new Date(expiresAt).getTime() <= Date.now()) return "expired";
  return status === "trial" ? "trial" : "active";
}

// Whether the public side (menu, ordering, listings) is currently live for this
// restaurant, ignoring approved_at / is_active which are handled elsewhere.
export function isSubscriptionLive(restaurant) {
  const state = getSubscriptionState(restaurant);
  return state !== "suspended" && state !== "expired";
}

// Adds a span to the later of "now" and the current expiry, so extending an
// already-lapsed subscription starts counting from today rather than the past.
// `unit` is "day" | "month" | "year".
export function extendExpiry(currentExpiresAt, amount, unit) {
  const base = currentExpiresAt
    ? Math.max(Date.now(), new Date(currentExpiresAt).getTime())
    : Date.now();
  const d = new Date(base);
  if (unit === "day") d.setDate(d.getDate() + amount);
  else if (unit === "month") d.setMonth(d.getMonth() + amount);
  else if (unit === "year") d.setFullYear(d.getFullYear() + amount);
  return d.toISOString();
}

// A fresh 30-day trial window starting now.
export function freshTrialExpiry() {
  return new Date(Date.now() + 30 * MS_PER_DAY).toISOString();
}
