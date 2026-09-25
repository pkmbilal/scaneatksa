// Canonical origin for every absolute URL the site emits (metadataBase,
// canonicals, sitemap, JSON-LD). The apex domain redirects to www, so www is
// the canonical host -- pointing canonicals at the apex tells Google the
// canonical URL is a redirect.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.scaneatksa.com"
).replace(/\/+$/, "");

export const SITE_NAME = "ScanEat";

export const DEFAULT_TITLE = "ScanEat | Restaurant Operations Platform with QR Ordering";
export const DEFAULT_DESCRIPTION =
  "Digital QR menus, WhatsApp ordering, live kitchen and waiter dashboards, and owner analytics for restaurants and cafes across Saudi Arabia.";

// Social share image (1200x630). Served from /public.
export const DEFAULT_OG_IMAGE = "/og-home.jpg";

export function absoluteUrl(path = "/") {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

// JSON-LD must be in the server-rendered HTML, so render a plain <script>
// rather than next/script (which may defer injection to the client).
export function jsonLdProps(data) {
  return {
    type: "application/ld+json",
    dangerouslySetInnerHTML: {
      __html: JSON.stringify(data).replace(/</g, "\u003c"),
    },
  };
}

// ---------------------------------------------------------------------------
// Locale-prefixed public URLs.
//
// Public, indexable pages are served in English at /<path> and in Arabic at
// /ar/<path>. proxy.js rewrites /ar/<path> to /<path> and passes the locale in
// LOCALE_HEADER (read by i18n/request.js), so the route tree stays unprefixed.
// Dashboards, auth, cart and QR routes are not localized by URL -- they keep
// using the NEXT_LOCALE cookie.
// ---------------------------------------------------------------------------

export const LOCALE_HEADER = "x-scaneat-locale";
export const AR_PREFIX = "/ar";

const LOCALIZED_PATHS = [
  /^\/$/,
  /^\/(about|how-it-works|contact|privacy-policy|restaurants)\/?$/,
  /^\/menu\/[^/]+\/?$/,
];

// Splits "/path?query#hash" into its pathname and the "?query#hash" suffix.
function splitPath(href) {
  const i = href.search(/[?#]/);
  return i === -1 ? [href, ""] : [href.slice(0, i), href.slice(i)];
}

export function isLocalizedPath(pathname) {
  return LOCALIZED_PATHS.some((re) => re.test(pathname));
}

// "/ar/about" -> "/about", "/ar" -> "/". Leaves unprefixed paths alone.
export function stripLocalePrefix(pathname) {
  return pathname.replace(/^\/ar(?=\/|$)/, "") || "/";
}

// Locale-specific href for an internal link. Only public pages get the /ar
// prefix; anything else (dashboard, auth, cart, external) is returned as-is.
export function localeHref(href, locale) {
  if (locale !== "ar" || typeof href !== "string" || !href.startsWith("/")) return href;
  const [pathname, suffix] = splitPath(href);
  if (!isLocalizedPath(pathname)) return href;
  return (pathname === "/" ? AR_PREFIX : `${AR_PREFIX}${pathname}`) + suffix;
}

// `alternates` for a public page: self-referencing canonical for the active
// locale plus hreflang links to both language versions.
export function localizedAlternates(path, locale) {
  return {
    canonical: localeHref(path, locale),
    languages: {
      en: path,
      ar: localeHref(path, "ar"),
      "x-default": path,
    },
  };
}

export function ogLocale(locale) {
  return locale === "ar" ? "ar_SA" : "en_US";
}

// Public restaurant slugs kept live for sales demos but hidden from search
// (noindex + left out of the sitemap) so they don't pass as real restaurants.
export const NOINDEX_RESTAURANT_SLUGS = new Set(["scaneat-demo-kitchen"]);

// Only images we host (R2 uploads or /public) go into structured data --
// legacy rows may still point at third-party sites we have no rights to.
export function isOwnMediaUrl(url) {
  if (typeof url !== "string" || !url) return false;
  if (url.startsWith("/")) return true;
  const r2 = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  return url.startsWith(`${SITE_URL}/`) || (!!r2 && url.startsWith(`${r2}/`));
}

// Stored phones look like "9665xxxxxxxx" or "+9665xxxxxxxx"; schema.org wants
// the international "+" form.
export function e164Phone(phone) {
  const digits = String(phone ?? "").replace(/[^\d]/g, "");
  return digits ? `+${digits}` : null;
}
