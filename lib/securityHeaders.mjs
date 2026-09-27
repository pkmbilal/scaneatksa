// Security headers applied to every route (see next.config.mjs). Plain .mjs
// with no "@/" imports because next.config.mjs loads it directly in Node.

// Builds the Content-Security-Policy value from the origins the app actually
// talks to:
// - Supabase REST/Auth (https) and Realtime (wss)
// - presigned R2 upload PUTs (lib/r2/upload.js)
// - Google Analytics 4 via @next/third-parties
// Images allow any https host: owners' legacy image_url values point at many
// third-party sites. 'unsafe-inline' scripts are needed for Next.js's inline
// bootstrap and the JSON-LD <script> tags (a nonce-based CSP would need
// per-request proxy work on every route).
export function buildCsp({ supabaseUrl, dev = false } = {}) {
  const supabase = supabaseUrl ? new URL(supabaseUrl).origin : "";
  const supabaseWs = supabase ? supabase.replace(/^http/, "ws") : "";

  const directives = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com", ...(dev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "font-src": ["'self'", "data:"],
    "connect-src": [
      "'self'",
      supabase,
      supabaseWs,
      "https://*.r2.cloudflarestorage.com",
      "https://*.google-analytics.com",
      "https://*.analytics.google.com",
      "https://www.googletagmanager.com",
    ].filter(Boolean),
    "worker-src": ["'self'", "blob:"],
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "object-src": ["'none'"],
  };

  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");
}

// CSP ships report-only first: violations show in the browser console but
// nothing is blocked. Switch the header name to "Content-Security-Policy"
// once a full pass through the app (uploads, realtime, GA, QR) is clean.
export const CSP_HEADER = "Content-Security-Policy-Report-Only";

export function securityHeaders({ supabaseUrl, dev = false } = {}) {
  return [
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
    // No includeSubDomains/preload: those are hard to undo and would also
    // bind every other subdomain of the site to HTTPS.
    { key: "Strict-Transport-Security", value: "max-age=31536000" },
    { key: CSP_HEADER, value: buildCsp({ supabaseUrl, dev }) },
  ];
}
