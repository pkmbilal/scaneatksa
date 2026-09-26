import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/r2/auth", () => ({ getAuthedUserId: vi.fn() }));
vi.mock("@/lib/supabaseAdmin", () => ({ supabaseAdmin: { from: vi.fn() } }));

const { getAuthedUserId } = await import("@/lib/r2/auth");
const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
const { PATCH } = await import("./route.js");

const ctx = { params: Promise.resolve({ id: "order-1" }) };

function makeRequest(status) {
  return new Request("http://localhost/api/orders/order-1/status", {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// Per-table chainable mocks for the three queries the route makes.
function mockTables({ profile, order }) {
  const updated = { ...order, status: "preparing" };
  supabaseAdmin.from.mockImplementation((table) => {
    if (table === "user_profiles") {
      return { select: () => ({ eq: () => ({ single: async () => ({ data: profile, error: null }) }) }) };
    }
    if (table === "orders") {
      return {
        select: () => ({ eq: () => ({ single: async () => ({ data: order, error: null }) }) }),
        update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: updated, error: null }) }) }) }),
      };
    }
    throw new Error(`unexpected table ${table}`);
  });
}

describe("PATCH /api/orders/[id]/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAuthedUserId.mockResolvedValue({ userId: "kitchen-1", error: null });
  });

  const order = { id: "order-1", restaurant_id: "rest-1", status: "new" };

  it("lets active kitchen staff start an order at their restaurant", async () => {
    mockTables({ profile: { role: "kitchen", restaurant_id: "rest-1", is_active: true }, order });

    const res = await PATCH(makeRequest("preparing"), ctx);

    expect(res.status).toBe(200);
    expect((await res.json()).order.status).toBe("preparing");
  });

  it("rejects a disabled staff account even with a still-valid token", async () => {
    mockTables({ profile: { role: "kitchen", restaurant_id: "rest-1", is_active: false }, order });

    const res = await PATCH(makeRequest("preparing"), ctx);

    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("Account disabled");
  });

  it("rejects staff from another restaurant", async () => {
    mockTables({ profile: { role: "kitchen", restaurant_id: "rest-2", is_active: true }, order });

    expect((await PATCH(makeRequest("preparing"), ctx)).status).toBe(403);
  });
});
