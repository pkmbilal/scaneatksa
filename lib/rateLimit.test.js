import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: { rpc: vi.fn() },
}));

const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
const { rateLimit, clientIp } = await import("./rateLimit.js");

// supabaseAdmin.rpc(...).single() -> result
function mockRpc(result) {
  supabaseAdmin.rpc.mockReturnValue({ single: async () => result });
}

describe("rateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("counts the hit in rate_limit_hit with the window in seconds", async () => {
    mockRpc({ data: { allowed: true, retry_after_ms: 1000 }, error: null });

    const result = await rateLimit("orders:ip:1.2.3.4", { limit: 10, windowMs: 10 * 60 * 1000 });

    expect(result).toEqual({ allowed: true });
    expect(supabaseAdmin.rpc).toHaveBeenCalledWith("rate_limit_hit", {
      p_key: "orders:ip:1.2.3.4",
      p_limit: 10,
      p_window_seconds: 600,
    });
  });

  it("returns retryAfterMs once over the limit", async () => {
    mockRpc({ data: { allowed: false, retry_after_ms: 4200 }, error: null });

    expect(await rateLimit("k", { limit: 1, windowMs: 60_000 })).toEqual({ allowed: false, retryAfterMs: 4200 });
  });

  it("fails open when the database call errors", async () => {
    mockRpc({ data: null, error: { message: "connection lost" } });

    expect(await rateLimit("k", { limit: 1, windowMs: 60_000 })).toEqual({ allowed: true });
    expect(console.error).toHaveBeenCalled();
  });
});

describe("clientIp", () => {
  const req = (headers) => new Request("http://localhost", { headers });

  it("takes the first address from x-forwarded-for", () => {
    expect(clientIp(req({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip, then 'unknown'", () => {
    expect(clientIp(req({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(clientIp(req({}))).toBe("unknown");
  });
});
