import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/r2/auth", () => ({ getAuthedUserId: vi.fn() }));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: { from: vi.fn(), auth: { admin: { updateUserById: vi.fn() } } },
}));

const { getAuthedUserId } = await import("@/lib/r2/auth");
const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
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

describe("requireAdmin", () => {
  beforeEach(() => vi.clearAllMocks());

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
    expect((await requireAdmin(new Request("http://localhost"))).error.status).toBe(403);

    mockProfile({ role: "admin", is_active: false });
    expect((await requireAdmin(new Request("http://localhost"))).error.status).toBe(403);
  });

  it("accepts an active admin", async () => {
    getAuthedUserId.mockResolvedValue({ userId: "u1", error: null });
    mockProfile({ role: "admin", is_active: true });

    expect(await requireAdmin(new Request("http://localhost"))).toEqual({ userId: "u1" });
  });
});
