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
