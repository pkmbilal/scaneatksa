import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/r2/auth", () => ({
  getAuthedUserId: vi.fn(),
}));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: { from: vi.fn() },
}));
vi.mock("@/lib/r2/client", () => ({
  r2Client: { send: vi.fn().mockResolvedValue(undefined) },
  R2_BUCKET_NAME: "test-bucket",
}));

const { getAuthedUserId } = await import("@/lib/r2/auth");
const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
const { r2Client } = await import("@/lib/r2/client");
const { POST } = await import("./route.js");

// Chainable .from().select().eq().maybeSingle() mock matching how
// isOwnedKey() looks up the caller's restaurant.
function mockRestaurantLookup(data) {
  supabaseAdmin.from.mockReturnValue({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data, error: null }),
      }),
    }),
  });
}

function makeRequest(body) {
  return new Request("http://localhost/api/uploads/delete", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/uploads/delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    r2Client.send.mockResolvedValue(undefined);
  });

  it("rejects unauthenticated requests", async () => {
    getAuthedUserId.mockResolvedValue({ userId: null, error: { message: "no session" } });

    const res = await POST(makeRequest({ key: "avatars/x/y.jpg" }));

    expect(res.status).toBe(401);
  });

  it("rejects a missing key", async () => {
    getAuthedUserId.mockResolvedValue({ userId: "user-1", error: null });

    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
  });

  it("rejects a path-traversal key", async () => {
    getAuthedUserId.mockResolvedValue({ userId: "user-1", error: null });

    const res = await POST(makeRequest({ key: "avatars/user-1/../../secrets.jpg" }));

    expect(res.status).toBe(400);
  });

  it("allows deleting the caller's own avatar", async () => {
    getAuthedUserId.mockResolvedValue({ userId: "user-avatar", error: null });

    const res = await POST(makeRequest({ key: "avatars/user-avatar/pic.jpg" }));

    expect(res.status).toBe(200);
    expect(r2Client.send).toHaveBeenCalledTimes(1);
    const command = r2Client.send.mock.calls[0][0];
    expect(command.input.Key).toBe("avatars/user-avatar/pic.jpg");
  });

  it("refuses to delete another user's avatar", async () => {
    getAuthedUserId.mockResolvedValue({ userId: "user-attacker", error: null });
    mockRestaurantLookup(null); // attacker owns no restaurant either -- isOwnedKey falls through to false

    const res = await POST(makeRequest({ key: "avatars/user-victim/pic.jpg" }));

    expect(res.status).toBe(403);
    expect(r2Client.send).not.toHaveBeenCalled();
  });

  it("allows deleting a menu-item image under the caller's own restaurant", async () => {
    getAuthedUserId.mockResolvedValue({ userId: "owner-1", error: null });
    mockRestaurantLookup({ id: "restaurant-1" });

    const res = await POST(makeRequest({ key: "menu-items/restaurant-1/pic.jpg" }));

    expect(res.status).toBe(200);
    expect(r2Client.send).toHaveBeenCalledTimes(1);
  });

  it("refuses a key under a different restaurant than the caller owns", async () => {
    getAuthedUserId.mockResolvedValue({ userId: "owner-1", error: null });
    mockRestaurantLookup({ id: "restaurant-1" });

    const res = await POST(makeRequest({ key: "menu-items/restaurant-2/pic.jpg" }));

    expect(res.status).toBe(403);
    expect(r2Client.send).not.toHaveBeenCalled();
  });

  it("refuses restaurant-scoped keys for an account with no restaurant", async () => {
    getAuthedUserId.mockResolvedValue({ userId: "owner-none", error: null });
    mockRestaurantLookup(null);

    const res = await POST(makeRequest({ key: "restaurants/restaurant-1/logo.jpg" }));

    expect(res.status).toBe(403);
  });

  it("rate limits repeated requests from the same user", async () => {
    getAuthedUserId.mockResolvedValue({ userId: "user-spammer", error: null });

    let lastRes;
    for (let i = 0; i < 21; i++) {
      lastRes = await POST(makeRequest({ key: "avatars/user-spammer/pic.jpg" }));
    }

    expect(lastRes.status).toBe(429);
    expect(lastRes.headers.get("Retry-After")).toBeTruthy();
  });
});
