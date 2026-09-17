import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/r2/auth", () => ({
  getAuthedUserId: vi.fn(),
}));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: { from: vi.fn() },
}));
vi.mock("@/lib/r2/client", () => ({
  r2Client: {},
  R2_BUCKET_NAME: "test-bucket",
  R2_PUBLIC_URL: "https://pub.example.com",
}));
vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn().mockResolvedValue("https://signed.example.com/upload"),
}));

const { getAuthedUserId } = await import("@/lib/r2/auth");
const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
const { POST } = await import("./route.js");

// Chainable .from().select().eq().maybeSingle() mock matching how
// resolveKey() queries supabaseAdmin for the caller's restaurant.
function mockRestaurantLookup(result) {
  supabaseAdmin.from.mockReturnValue({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => result,
      }),
    }),
  });
}

function makeRequest(body) {
  return new Request("http://localhost/api/uploads/presign", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/uploads/presign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSignedUrl.mockResolvedValue("https://signed.example.com/upload");
  });

  it("rejects unauthenticated requests", async () => {
    getAuthedUserId.mockResolvedValue({ userId: null, error: { message: "no session" } });

    const res = await POST(makeRequest({ kind: "avatar", contentType: "image/jpeg", fileSize: 1000 }));

    expect(res.status).toBe(401);
  });

  it("rejects an unsupported content type", async () => {
    getAuthedUserId.mockResolvedValue({ userId: "user-type", error: null });

    const res = await POST(makeRequest({ kind: "avatar", contentType: "image/svg+xml", fileSize: 1000 }));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/unsupported/i);
  });

  it("rejects a file over the size cap", async () => {
    getAuthedUserId.mockResolvedValue({ userId: "user-size", error: null });

    const res = await POST(
      makeRequest({ kind: "avatar", contentType: "image/jpeg", fileSize: 6 * 1024 * 1024 })
    );

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/too large/i);
  });

  it("rejects a missing/zero fileSize", async () => {
    getAuthedUserId.mockResolvedValue({ userId: "user-nosize", error: null });

    const res = await POST(makeRequest({ kind: "avatar", contentType: "image/jpeg" }));

    expect(res.status).toBe(400);
  });

  it("rejects an invalid kind", async () => {
    getAuthedUserId.mockResolvedValue({ userId: "user-kind", error: null });

    const res = await POST(makeRequest({ kind: "bogus", contentType: "image/jpeg", fileSize: 1000 }));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/invalid upload kind/i);
  });

  it("namespaces an avatar key under the caller's own user id", async () => {
    getAuthedUserId.mockResolvedValue({ userId: "user-avatar-123", error: null });

    const res = await POST(makeRequest({ kind: "avatar", contentType: "image/jpeg", fileSize: 1000 }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.key).toMatch(/^avatars\/user-avatar-123\/[0-9a-f-]+\.jpg$/);
    expect(json.publicUrl).toBe(`https://pub.example.com/${json.key}`);
    expect(json.uploadUrl).toBe("https://signed.example.com/upload");
  });

  it("signs the upload with the exact declared fileSize (server-side size enforcement)", async () => {
    getAuthedUserId.mockResolvedValue({ userId: "user-contentlength", error: null });

    await POST(makeRequest({ kind: "avatar", contentType: "image/png", fileSize: 4242 }));

    expect(getSignedUrl).toHaveBeenCalledTimes(1);
    const [, command] = getSignedUrl.mock.calls[0];
    expect(command.input.ContentLength).toBe(4242);
    expect(command.input.ContentType).toBe("image/png");
  });

  it("namespaces a restaurant-logo/menu-item key under the caller's restaurant", async () => {
    getAuthedUserId.mockResolvedValue({ userId: "user-owner", error: null });
    mockRestaurantLookup({ data: { id: "restaurant-abc" }, error: null });

    const res = await POST(makeRequest({ kind: "menu-item", contentType: "image/webp", fileSize: 1000 }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.key).toMatch(/^menu-items\/restaurant-abc\/[0-9a-f-]+\.webp$/);
  });

  it("refuses restaurant-logo/menu-item uploads for an account with no restaurant", async () => {
    getAuthedUserId.mockResolvedValue({ userId: "user-no-restaurant", error: null });
    mockRestaurantLookup({ data: null, error: null });

    const res = await POST(makeRequest({ kind: "restaurant-logo", contentType: "image/png", fileSize: 1000 }));

    expect(res.status).toBe(403);
  });

  it("rate limits repeated requests from the same user", async () => {
    getAuthedUserId.mockResolvedValue({ userId: "user-spammer", error: null });

    let lastRes;
    for (let i = 0; i < 21; i++) {
      lastRes = await POST(makeRequest({ kind: "avatar", contentType: "image/jpeg", fileSize: 1000 }));
    }

    expect(lastRes.status).toBe(429);
    expect(lastRes.headers.get("Retry-After")).toBeTruthy();
  });
});
