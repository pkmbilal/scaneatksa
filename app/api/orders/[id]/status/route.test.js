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
// `raced: true` simulates another staff member changing the order first:
// the conditional update (.eq("status", previous)) matches no row.
function mockTables({ profile, order, raced = false }) {
  const updated = raced ? null : { ...order, status: "preparing" };
  const updateEqs = [];
  supabaseAdmin.from.mockImplementation((table) => {
    if (table === "user_profiles") {
      return { select: () => ({ eq: () => ({ single: async () => ({ data: profile, error: null }) }) }) };
    }
    if (table === "orders") {
      const eq = (col, val) => {
        updateEqs.push([col, val]);
        return { eq, select: () => ({ maybeSingle: async () => ({ data: updated, error: null }) }) };
      };
      return {
        select: () => ({ eq: () => ({ single: async () => ({ data: order, error: null }) }) }),
        update: () => ({ eq }),
      };
    }
    throw new Error(`unexpected table ${table}`);
  });
  return updateEqs;
}

describe("PATCH /api/orders/[id]/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAuthedUserId.mockResolvedValue({ userId: "kitchen-1", error: null });
  });

  const order = { id: "order-1", restaurant_id: "rest-1", status: "new" };

  it("lets active kitchen staff start an order at their restaurant", async () => {
    const updateEqs = mockTables({ profile: { role: "kitchen", restaurant_id: "rest-1", is_active: true }, order });

    const res = await PATCH(makeRequest("preparing"), ctx);

    expect(res.status).toBe(200);
    expect((await res.json()).order.status).toBe("preparing");
    // The update is conditional on the status the transition was checked against.
    expect(updateEqs).toEqual([
      ["id", "order-1"],
      ["status", "new"],
    ]);
  });

  it("returns 409 when someone else changed the order first", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockTables({ profile: { role: "kitchen", restaurant_id: "rest-1", is_active: true }, order, raced: true });

    const res = await PATCH(makeRequest("preparing"), ctx);

    expect(res.status).toBe(409);
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
