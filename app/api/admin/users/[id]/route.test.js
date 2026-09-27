import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

vi.mock("@/lib/auth/admin", () => ({
  requireAdmin: vi.fn(),
  setUserDisabled: vi.fn(),
}));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: { from: vi.fn(), auth: { admin: { deleteUser: vi.fn() } } },
}));

const { requireAdmin, setUserDisabled } = await import("@/lib/auth/admin");
const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
const { PATCH, DELETE } = await import("./route.js");

const ctx = (id) => ({ params: Promise.resolve({ id }) });

function makeRequest(method, body) {
  return new Request("http://localhost/api/admin/users/x", {
    method,
    body: body ? JSON.stringify(body) : undefined,
  });
}

// .from("restaurants").select().eq().limit().maybeSingle() -> result
function mockOwnedRestaurant(data) {
  supabaseAdmin.from.mockReturnValue({
    select: () => ({ eq: () => ({ limit: () => ({ maybeSingle: async () => ({ data }) }) }) }),
  });
}

describe("/api/admin/users/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    requireAdmin.mockResolvedValue({ userId: "admin-1" });
  });

  it("rejects non-admins", async () => {
    requireAdmin.mockResolvedValue({ error: NextResponse.json({ error: "Not allowed" }, { status: 403 }) });

    expect((await PATCH(makeRequest("PATCH", { is_active: false }), ctx("user-2"))).status).toBe(403);
    expect((await DELETE(makeRequest("DELETE"), ctx("user-2"))).status).toBe(403);
    expect(setUserDisabled).not.toHaveBeenCalled();
    expect(supabaseAdmin.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  it("refuses to act on the admin's own account", async () => {
    expect((await PATCH(makeRequest("PATCH", { is_active: false }), ctx("admin-1"))).status).toBe(400);
    expect((await DELETE(makeRequest("DELETE"), ctx("admin-1"))).status).toBe(400);
  });

  it("disables and re-enables through setUserDisabled", async () => {
    setUserDisabled.mockResolvedValue({ error: null });

    expect((await PATCH(makeRequest("PATCH", { is_active: false }), ctx("user-2"))).status).toBe(200);
    expect(setUserDisabled).toHaveBeenLastCalledWith("user-2", true);

    expect((await PATCH(makeRequest("PATCH", { is_active: true }), ctx("user-2"))).status).toBe(200);
    expect(setUserDisabled).toHaveBeenLastCalledWith("user-2", false);
  });

  it("rejects a non-boolean is_active", async () => {
    expect((await PATCH(makeRequest("PATCH", { is_active: "no" }), ctx("user-2"))).status).toBe(400);
    expect(setUserDisabled).not.toHaveBeenCalled();
  });

  it("refuses to delete a restaurant owner", async () => {
    mockOwnedRestaurant({ id: "rest-1" });

    const res = await DELETE(makeRequest("DELETE"), ctx("owner-1"));

    expect(res.status).toBe(409);
    expect(supabaseAdmin.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  it("deletes the auth user (profile cascades)", async () => {
    mockOwnedRestaurant(null);
    supabaseAdmin.auth.admin.deleteUser.mockResolvedValue({ error: null });

    const res = await DELETE(makeRequest("DELETE"), ctx("user-2"));

    expect(res.status).toBe(200);
    expect(supabaseAdmin.auth.admin.deleteUser).toHaveBeenCalledWith("user-2");
  });
});
