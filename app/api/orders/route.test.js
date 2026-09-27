import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/r2/auth", () => ({
  getAuthedUserId: vi.fn(),
}));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: { rpc: vi.fn() },
}));
vi.mock("@/lib/rateLimit", () => ({
  rateLimit: vi.fn(),
  clientIp: () => "203.0.113.7",
}));

const { getAuthedUserId } = await import("@/lib/r2/auth");
const { rateLimit } = await import("@/lib/rateLimit");
const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
const { POST } = await import("./route.js");

// supabaseAdmin.rpc(...).single() -> result
function mockRpc(result) {
  supabaseAdmin.rpc.mockReturnValue({ single: async () => result });
}

function makeRequest(body, headers = {}) {
  return new Request("http://localhost/api/orders", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

const validBody = {
  restaurantSlug: "demo",
  channel: "pickup",
  items: [{ id: "item-1", quantity: 2 }],
  customer: { name: "Sara", phone: "0501234567" },
  notes: "No onions",
};

describe("POST /api/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    rateLimit.mockResolvedValue({ allowed: true });
  });

  it("rate-limits per IP before touching the database", async () => {
    rateLimit.mockResolvedValue({ allowed: false, retryAfterMs: 90_500 });

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("91");
    expect(rateLimit).toHaveBeenCalledWith("orders:ip:203.0.113.7", { limit: 10, windowMs: 600_000 });
    expect(supabaseAdmin.rpc).not.toHaveBeenCalled();
  });

  it("places an order through create_order and returns its id", async () => {
    mockRpc({ data: { order_id: "order-1", table_number: null }, error: null });

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, orderId: "order-1", tableNumber: null });
    expect(supabaseAdmin.rpc).toHaveBeenCalledWith("create_order", {
      p_restaurant_slug: "demo",
      p_channel: "pickup",
      p_table_code: null,
      p_items: [{ id: "item-1", quantity: 2 }],
      p_customer_name: "Sara",
      p_customer_phone: "0501234567",
      p_delivery_address: "",
      p_notes: "No onions",
      p_user_id: null,
    });
    expect(getAuthedUserId).not.toHaveBeenCalled();
  });

  it("attaches the signed-in user's id when a token is sent", async () => {
    getAuthedUserId.mockResolvedValue({ userId: "user-1", error: null });
    mockRpc({ data: { order_id: "order-2", table_number: 4 }, error: null });

    const res = await POST(
      makeRequest({ ...validBody, channel: "dine_in", tableCode: "abc" }, { authorization: "Bearer t" })
    );

    expect(res.status).toBe(200);
    expect(supabaseAdmin.rpc.mock.calls[0][1]).toMatchObject({ p_user_id: "user-1", p_table_code: "abc" });
  });

  it("requires a valid phone number for every channel", async () => {
    const res = await POST(makeRequest({ ...validBody, customer: { phone: "123" } }));

    expect(res.status).toBe(400);
    expect(supabaseAdmin.rpc).not.toHaveBeenCalled();
  });

  it("requires an address for delivery", async () => {
    const res = await POST(makeRequest({ ...validBody, channel: "delivery" }));

    expect(res.status).toBe(400);
    expect(supabaseAdmin.rpc).not.toHaveBeenCalled();
  });

  it("rejects an empty cart and overly long notes before calling the database", async () => {
    expect((await POST(makeRequest({ ...validBody, items: [] }))).status).toBe(400);
    expect((await POST(makeRequest({ ...validBody, notes: "x".repeat(501) }))).status).toBe(400);
    expect(supabaseAdmin.rpc).not.toHaveBeenCalled();
  });

  it("maps create_order error keys to friendly messages", async () => {
    mockRpc({ data: null, error: { message: "restaurant_unavailable" } });
    let res = await POST(makeRequest(validBody));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("This restaurant is currently unavailable.");

    mockRpc({ data: null, error: { message: "item_unavailable:Margherita" } });
    res = await POST(makeRequest(validBody));
    expect((await res.json()).error).toBe("Margherita is currently unavailable.");

    mockRpc({ data: null, error: { message: "invalid_quantity" } });
    res = await POST(makeRequest(validBody));
    expect(res.status).toBe(400);
  });

  it("hides unexpected database errors behind a generic message", async () => {
    mockRpc({ data: null, error: { message: 'relation "orders" does not exist' } });

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Unable to place the order right now.");
  });
});
