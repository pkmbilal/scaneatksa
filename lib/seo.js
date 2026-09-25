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
