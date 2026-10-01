// Proof-of-business rules for restaurant owner requests. The DB enforces the
// same rules (check constraints + restaurant_requests_guard trigger in
// supabase/migrations/20260928120000_restaurant_request_verification.sql);
// these copies only exist to give applicants a fast, friendly error.

// Saudi Commercial Registration number: 10 digits.
export const CR_RE = /^[0-9]{10}$/;

// ZATCA VAT registration number: 15 digits, starts and ends with 3.
export const VAT_RE = /^3[0-9]{13}3$/;

export const MAPS_RE =
  /^https:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps)/i;

// CR certificate upload. Keep in sync with DOC_TYPES in
// app/api/uploads/presign/route.js.
export const DOC_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
export const MAX_DOC_BYTES = 5 * 1024 * 1024; // 5MB

// Ministry of Commerce site, linked from the admin's manual CR check. Point
// this at the exact public CR-lookup page if it moves.
export const CR_LOOKUP_URL = "https://mc.gov.sa";

// Strips spaces/dashes and converts Arabic-Indic digits so "١٠١٠ ١٢٣ ٤٥٦"
// validates the same as "1010123456".
export function normalizeDigits(value) {
  return (value || "")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[\s-]/g, "");
}

// A restaurant approved without a CR number + certificate has this many days
// (from approval) to submit them before it goes dark to the public. Mirrored
// in admin_approve_restaurant_request (supabase/migrations/
// 20261001101111_optional_cr_deadline.sql), which sets cr_deadline_at.
export const CR_DEADLINE_DAYS = 7;

// Derives the CR deadline state from a restaurants row. Returns:
//   { state: "none" }                       -- no deadline (verified at approval / legacy)
//   { state: "verified" }
//   { state: "underReview", daysLeft, overdue }  -- submitted, awaiting admin
//   { state: "due", daysLeft }              -- not submitted, deadline ahead
//   { state: "overdue" }                    -- not submitted, deadline passed (offline)
// `overdue` on underReview means the restaurant is offline until verified.
export function getCrState(restaurant) {
  if (!restaurant) return { state: "none" };
  if (restaurant.cr_verified_at) return { state: "verified" };
  if (!restaurant.cr_deadline_at) return { state: "none" };

  const msLeft = new Date(restaurant.cr_deadline_at).getTime() - Date.now();
  const daysLeft = Math.max(0, Math.ceil(msLeft / 864e5));
  const overdue = msLeft <= 0;

  if (restaurant.cr_submitted_at && restaurant.cr_document_path) {
    return { state: "underReview", daysLeft, overdue };
  }
  return overdue ? { state: "overdue" } : { state: "due", daysLeft };
}
