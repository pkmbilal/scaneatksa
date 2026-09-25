import { supabaseServer } from "@/lib/supabase/server";
import { SAUDI_CITIES } from "@/lib/saudiCities";
import { absoluteUrl, localeHref, NOINDEX_RESTAURANT_SLUGS } from "@/lib/seo";

// Regenerate hourly so newly approved restaurants show up without a redeploy.
export const revalidate = 3600;

const STATIC_ROUTES = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/restaurants", changeFrequency: "daily", priority: 0.9 },
  { path: "/how-it-works", changeFrequency: "monthly", priority: 0.8 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.5 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.2 },
];

// Every public page exists in English (/path) and Arabic (/ar/path). Emit both
// URLs, each carrying hreflang alternates to the pair.
function localizedEntries(path, fields) {
  const languages = {
    en: absoluteUrl(path),
    ar: absoluteUrl(localeHref(path, "ar")),
    "x-default": absoluteUrl(path),
  };
  return [languages.en, languages.ar].map((url) => ({
    url,
    ...fields,
    alternates: { languages },
  }));
}

export default async function sitemap() {
  const entries = STATIC_ROUTES.flatMap(({ path, ...rest }) =>
    localizedEntries(path, { lastModified: new Date(), ...rest })
  );

  // Anon client: the restaurants public-read RLS policies already hide
  // unpublished / expired restaurants, so this only lists live menus.
  try {
    const { data: restaurants, error } = await supabaseServer()
      .from("restaurants")
      .select("slug, city, approved_at, created_at")
      .eq("is_active", true);

    if (error) throw error;

    // Single-city listings (/restaurants?city=<slug>) are indexable, so list
    // the ones that actually have a live restaurant in them.
    const knownCities = new Set(SAUDI_CITIES.map((c) => c.slug));
    const liveCities = new Map();

    for (const r of restaurants || []) {
      if (!r.slug || NOINDEX_RESTAURANT_SLUGS.has(r.slug)) continue;
      const lastModified = new Date(r.approved_at || r.created_at);
      if (knownCities.has(r.city) && !(liveCities.get(r.city) > lastModified)) {
        liveCities.set(r.city, lastModified);
      }
      entries.push(
        ...localizedEntries(`/menu/${encodeURIComponent(r.slug)}`, {
          lastModified,
          changeFrequency: "weekly",
          priority: 0.7,
        })
      );
    }

    for (const [city, lastModified] of liveCities) {
      entries.push(
        ...localizedEntries(`/restaurants?city=${encodeURIComponent(city)}`, {
          lastModified,
          changeFrequency: "daily",
          priority: 0.8,
        })
      );
    }
  } catch (err) {
    console.error("sitemap restaurants error:", err);
  }

  return entries;
}
