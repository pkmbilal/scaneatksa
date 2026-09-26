// Page-number pagination helpers for server-rendered lists (e.g. /restaurants).
// Pages are 1-based; anything invalid in the URL falls back to page 1.

export function parsePage(value) {
  const page = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(page) && page >= 1 ? page : 1;
}

// Inclusive [from, to] row range for Supabase's .range().
export function pageRange(page, size) {
  const from = (page - 1) * size;
  return [from, from + size - 1];
}

export function totalPages(count, size) {
  return Math.max(1, Math.ceil((count || 0) / size));
}

// Query string for `page` that keeps every other current param (filters).
// Page 1 omits the param so the canonical, unpaginated URL is used.
export function pageQuery(params, page) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params || {})) {
    if (key !== "page" && value != null && value !== "") qs.set(key, String(value));
  }
  if (page > 1) qs.set("page", String(page));
  const str = qs.toString();
  return str ? `?${str}` : "";
}
