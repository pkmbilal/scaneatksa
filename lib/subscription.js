// Subscription / trial helpers shared by the admin "Subscriptions" tab and the
// owner-facing SubscriptionBanner. Enforcement itself lives in Postgres
// (is_restaurant_published() + the two public-read policies on restaurants) --
// these helpers only derive display state from the same columns.

export const MS_PER_DAY = 864e5;

// Length of a free trial, and how many days out from expiry a restaurant
// counts as "due soon" (admin nav badge, owner banner warning). Single
// source of truth -- don't hardcode these elsewhere.
export const TRIAL_DAYS = 30;
export const DUE_SOON_DAYS = 7;

// How many days a restaurant stays publicly live after subscription_expires_at
// passes before it actually goes dark. Mirrored in Postgres -- see
// is_restaurant_published() and the two restaurants public-read policies,
// which enforce this same window server-side.
export const GRACE_DAYS = 7;

// Whole days from now until `expiresAt` (negative once past). null when there is
// no expiry (unlimited / comped access).
export function daysUntil(expiresAt) {
  if (!expiresAt) return null;
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / MS_PER_DAY);
}

// Derives the effective state of a restaurant's subscription from its row.
// Returns one of:
// "unlimited" | "suspended" | "expired" | "grace" | "trial" | "active".
// "grace" covers the GRACE_DAYS window right after expiry, during which the
// restaurant is still live to the public (see GRACE_DAYS above) but the owner
// should already be warned.
export function getSubscriptionState(restaurant) {
  if (!restaurant) return "active";
  const status = restaurant.subscription_status || "trial";
  const expiresAt = restaurant.subscription_expires_at || null;

  if (status === "suspended") return "suspended";
  if (!expiresAt) return "unlimited";

  const expiryTime = new Date(expiresAt).getTime();
  const now = Date.now();
  if (now <= expiryTime) return status === "trial" ? "trial" : "active";
  if (now <= expiryTime + GRACE_DAYS * MS_PER_DAY) return "grace";
  return "expired";
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

// A fresh trial window (TRIAL_DAYS) starting now.
export function freshTrialExpiry() {
  return new Date(Date.now() + TRIAL_DAYS * MS_PER_DAY).toISOString();
}

// The most recent subscription_events action logged for a restaurant, or null
// if there is none. `events` doesn't need to be pre-sorted. Used to notice a
// pending renewal request (action === "renewalRequested") -- it clears itself
// once any other action becomes the newest event.
export function latestSubscriptionAction(events, restaurantId) {
  let latest = null;
  for (const event of events || []) {
    if (event.restaurant_id !== restaurantId) continue;
    if (!latest || new Date(event.created_at) > new Date(latest.created_at)) latest = event;
  }
  return latest?.action || null;
}
