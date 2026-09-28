import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

vi.mock("@/lib/auth/admin", () => ({
  requireAdmin: vi.fn(),
}));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: { from: vi.fn() },
}));
vi.mock("@/lib/r2/client", () => ({
  r2Client: {},
  R2_PRIVATE_BUCKET_NAME: "private-bucket",
}));
vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn().mockResolvedValue("https://signed.example.com/doc"),
}));

const { requireAdmin } = await import("@/lib/auth/admin");
const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
const { GET } = await import("./route.js");

const ctx = (id) => ({ params: Promise.resolve({ id }) });
const makeRequest = () => new Request("http://localhost/api/admin/restaurant-requests/x/document");

// .from("restaurant_requests").select().eq().maybeSingle() -> result
function mockRequestLookup(result) {
  supabaseAdmin.from.mockReturnValue({
    select: () => ({ eq: () => ({ maybeSingle: async () => result }) }),
  });
}

describe("GET /api/admin/restaurant-requests/[id]/document", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdmin.mockResolvedValue({ userId: "admin-1" });
    getSignedUrl.mockResolvedValue("https://signed.example.com/doc");
  });

  it("rejects non-admins", async () => {
    requireAdmin.mockResolvedValue({ error: NextResponse.json({ error: "Not allowed" }, { status: 403 }) });

    const res = await GET(makeRequest(), ctx("req-1"));

    expect(res.status).toBe(403);
    expect(getSignedUrl).not.toHaveBeenCalled();
  });

  it("404s when the request has no document", async () => {
    mockRequestLookup({ data: { cr_document_path: null }, error: null });

    const res = await GET(makeRequest(), ctx("req-1"));

    expect(res.status).toBe(404);
  });

  it("returns a short-lived signed GET for the private bucket", async () => {
    mockRequestLookup({
      data: { cr_document_path: "restaurant-requests/user-1/abc.pdf" },
      error: null,
    });

    const res = await GET(makeRequest(), ctx("req-1"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.url).toBe("https://signed.example.com/doc");
    const [, command, opts] = getSignedUrl.mock.calls[0];
    expect(command.input.Bucket).toBe("private-bucket");
    expect(command.input.Key).toBe("restaurant-requests/user-1/abc.pdf");
    expect(opts.expiresIn).toBe(300);
  });
});
