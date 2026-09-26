import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: "owner-1" } }, error: null }) },
  }),
}));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: vi.fn(),
    auth: { admin: { createUser: vi.fn(), deleteUser: vi.fn() } },
  },
}));

const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
const { POST } = await import("./route.js");

const staffRow = { id: "staff-1", full_name: "Ali", role: "kitchen", is_active: true, created_at: "2026-09-26" };

// restaurants lookup (requireOwnerRestaurant) + user_profiles update.
function mockTables({ profileResult }) {
  supabaseAdmin.from.mockImplementation((table) => {
    if (table === "restaurants") {
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: "rest-1" }, error: null }) }) }) };
    }
    if (table === "user_profiles") {
      return { update: () => ({ eq: () => ({ select: () => ({ single: async () => profileResult }) }) }) };
    }
    throw new Error(`unexpected table ${table}`);
  });
}

function makeRequest(body) {
  return new Request("http://localhost/api/staff", {
    method: "POST",
    headers: { authorization: "Bearer t" },
    body: JSON.stringify(body),
  });
}

const validBody = { email: "ali@example.com", password: "secret123", fullName: "Ali", role: "kitchen" };

describe("POST /api/staff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("creates the account and assigns it to the owner's restaurant", async () => {
    supabaseAdmin.auth.admin.createUser.mockResolvedValue({ data: { user: { id: "staff-1" } }, error: null });
    mockTables({ profileResult: { data: staffRow, error: null } });

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(200);
    expect((await res.json()).staff).toEqual(staffRow);
    expect(supabaseAdmin.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  it("deletes the new login if the profile update fails", async () => {
    supabaseAdmin.auth.admin.createUser.mockResolvedValue({ data: { user: { id: "staff-2" } }, error: null });
    supabaseAdmin.auth.admin.deleteUser.mockResolvedValue({ error: null });
    mockTables({ profileResult: { data: null, error: { message: "boom" } } });

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(400);
    expect(supabaseAdmin.auth.admin.deleteUser).toHaveBeenCalledWith("staff-2");
    expect((await res.json()).error).not.toContain("boom");
  });

  it("gives a friendly message for an email that's already registered", async () => {
    supabaseAdmin.auth.admin.createUser.mockResolvedValue({
      data: null,
      error: { message: "A user with this email address has already been registered" },
    });
    mockTables({ profileResult: { data: null, error: null } });

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("An account with this email already exists.");
  });
});
