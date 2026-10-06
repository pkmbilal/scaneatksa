import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/r2/auth", () => ({ getAuthedUserId: vi.fn() }));
vi.mock("@/lib/rateLimit", () => ({ rateLimit: vi.fn() }));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: { from: vi.fn(), auth: { admin: { updateUserById: vi.fn() } } },
}));

const { getAuthedUserId } = await import("@/lib/r2/auth");
const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
const { rateLimit } = await import("@/lib/rateLimit");
const { requireAdmin, setUserDisabled } = await import("./admin.js");

// Records every .from("user_profiles").update(patch).eq() call.
function mockProfileUpdates(result = { error: null }) {
  const updates = [];
  supabaseAdmin.from.mockReturnValue({
    update: (patch) => ({
      eq: async () => {
        updates.push(patch);
        return result;
      },
    }),
  });
  return updates;
}

describe("setUserDisabled", () => {
  beforeEach(() => vi.clearAllMocks());

  it("flags the profile inactive and bans the auth user", async () => {
    const updates = mockProfileUpdates();
    supabaseAdmin.auth.admin.updateUserById.mockResolvedValue({ error: null });

    const { error } = await setUserDisabled("user-1", true);

    expect(error).toBeNull();
    expect(updates).toEqual([{ is_active: false }]);
    expect(supabaseAdmin.auth.admin.updateUserById).toHaveBeenCalledWith("user-1", { ban_duration: "876000h" });
  });

  it("re-enabling lifts the ban", async () => {
    mockProfileUpdates();
    supabaseAdmin.auth.admin.updateUserById.mockResolvedValue({ error: null });

    await setUserDisabled("user-1", false);

    expect(supabaseAdmin.auth.admin.updateUserById).toHaveBeenCalledWith("user-1", { ban_duration: "none" });
  });

  it("reverts the profile flag if the ban fails", async () => {
    const updates = mockProfileUpdates();
    supabaseAdmin.auth.admin.updateUserById.mockResolvedValue({ error: { message: "boom" } });

    const { error } = await setUserDisabled("user-1", true);

    expect(error).toEqual({ message: "boom" });
    expect(updates).toEqual([{ is_active: false }, { is_active: true }]);
  });
});

// A request carrying a (signature-less) JWT whose payload has this aal --
// requireAdmin only decodes the claim; getAuthedUserId (mocked) verifies.
function adminRequest(aal = "aal2") {
  const payload = Buffer.from(JSON.stringify({ sub: "u1", aal })).toString("base64url");
  return new Request("http://localhost", { headers: { Authorization: `Bearer h.${payload}.s` } });
}

describe("requireAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimit.mockResolvedValue({ allowed: true });
  });

  function mockProfile(profile) {
    supabaseAdmin.from.mockReturnValue({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: profile }) }) }),
    });
  }

  it("rejects unauthenticated callers", async () => {
    getAuthedUserId.mockResolvedValue({ userId: null, error: { message: "no session" } });
    const { error } = await requireAdmin(new Request("http://localhost"));
    expect(error.status).toBe(401);
  });

  it("rejects non-admins and disabled admins", async () => {
    getAuthedUserId.mockResolvedValue({ userId: "u1", error: null });

    mockProfile({ role: "owner", is_active: true });
    expect((await requireAdmin(adminRequest())).error.status).toBe(403);

    mockProfile({ role: "admin", is_active: false });
    expect((await requireAdmin(adminRequest())).error.status).toBe(403);
  });

  it("rejects an admin session that hasn't passed MFA", async () => {
    getAuthedUserId.mockResolvedValue({ userId: "u1", error: null });
    mockProfile({ role: "admin", is_active: true });

    expect((await requireAdmin(adminRequest("aal1"))).error.status).toBe(403);
    expect((await requireAdmin(new Request("http://localhost"))).error.status).toBe(403);
  });

  it("rate-limits per admin", async () => {
    getAuthedUserId.mockResolvedValue({ userId: "u1", error: null });
    mockProfile({ role: "admin", is_active: true });
    rateLimit.mockResolvedValue({ allowed: false, retryAfterMs: 5000 });

    const { error } = await requireAdmin(adminRequest());
    expect(error.status).toBe(429);
    expect(rateLimit).toHaveBeenCalledWith("admin:u1", expect.any(Object));
  });

  it("accepts an active admin with MFA", async () => {
    getAuthedUserId.mockResolvedValue({ userId: "u1", error: null });
    mockProfile({ role: "admin", is_active: true });

    expect(await requireAdmin(adminRequest())).toEqual({ userId: "u1" });
  });
});
