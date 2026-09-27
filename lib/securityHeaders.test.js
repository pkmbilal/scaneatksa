import { describe, it, expect } from "vitest";
import { buildCsp, securityHeaders } from "./securityHeaders.mjs";

const supabaseUrl = "https://abcd1234.supabase.co";

describe("buildCsp", () => {
  const csp = buildCsp({ supabaseUrl });
  const directive = (name) => csp.split("; ").find((d) => d.startsWith(`${name} `));

  it("allows Supabase over https and wss (realtime)", () => {
    expect(directive("connect-src")).toContain("https://abcd1234.supabase.co");
    expect(directive("connect-src")).toContain("wss://abcd1234.supabase.co");
  });

  it("allows presigned R2 uploads and Google Analytics", () => {
    expect(directive("connect-src")).toContain("https://*.r2.cloudflarestorage.com");
    expect(directive("connect-src")).toContain("https://*.google-analytics.com");
    expect(directive("script-src")).toContain("https://www.googletagmanager.com");
  });

  it("forbids framing, plugins and foreign base/form targets", () => {
    expect(directive("frame-ancestors")).toBe("frame-ancestors 'none'");
    expect(directive("object-src")).toBe("object-src 'none'");
    expect(directive("base-uri")).toBe("base-uri 'self'");
    expect(directive("form-action")).toBe("form-action 'self'");
  });

  it("only allows 'unsafe-eval' in development", () => {
    expect(directive("script-src")).not.toContain("'unsafe-eval'");
    expect(buildCsp({ supabaseUrl, dev: true })).toContain("'unsafe-eval'");
  });
});

describe("securityHeaders", () => {
  it("sets the enforced headers plus a report-only CSP", () => {
    const keys = securityHeaders({ supabaseUrl }).map((h) => h.key);
    expect(keys).toEqual([
      "X-Frame-Options",
      "X-Content-Type-Options",
      "Referrer-Policy",
      "Permissions-Policy",
      "Strict-Transport-Security",
      "Content-Security-Policy-Report-Only",
    ]);
  });
});
