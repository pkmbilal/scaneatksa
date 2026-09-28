import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { r2Client, R2_BUCKET_NAME, R2_PRIVATE_BUCKET_NAME, R2_PUBLIC_URL } from "@/lib/r2/client";
import { getAuthedUserId } from "@/lib/r2/auth";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const RATE_LIMIT = { limit: 20, windowMs: 60 * 1000 }; // 20 presigns/min/user

// image/<ext> allow-list -- keep in sync with the client-side check in
// lib/r2/upload.js so users get a fast, friendly error before we ever hit
// the network.
const ALLOWED_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
// Restaurant-request documents (CR certificate): PDFs or photos/scans, no GIF.
// Keep in sync with DOC_TYPES in lib/restaurantVerification.js and the
// extension list in the restaurant_requests_guard trigger.
const DOC_TYPES = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const PRIVATE_KINDS = new Set(["restaurant-request-doc"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB. Client-declared, not server-enforced (see note below).

// Every upload "kind" resolves to an object key namespaced by whatever it
// belongs to (never client-supplied), so one signed owner/user can't write
// into another's path.
async function resolveKey(kind, userId, ext) {
  const uuid = randomUUID();

  if (kind === "avatar") {
    return { key: `avatars/${userId}/${uuid}.${ext}` };
  }

  if (kind === "restaurant-request-doc") {
    return { key: `restaurant-requests/${userId}/${uuid}.${ext}` };
  }

  if (kind === "restaurant-logo" || kind === "menu-item") {
    const { data: restaurant, error } = await supabaseAdmin
      .from("restaurants")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();

    if (error || !restaurant) {
      return { error: NextResponse.json({ error: "No restaurant found for this account" }, { status: 403 }) };
    }

    const key =
      kind === "restaurant-logo"
        ? `restaurants/${restaurant.id}/logo-${uuid}.${ext}`
        : `menu-items/${restaurant.id}/${uuid}.${ext}`;

    return { key };
  }

  return { error: NextResponse.json({ error: "Invalid upload kind" }, { status: 400 }) };
}

export async function POST(req) {
  const { userId, error: authError } = await getAuthedUserId(req);
  if (authError || !userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const limited = await rateLimit(`presign:${userId}`, RATE_LIMIT);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many upload requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limited.retryAfterMs / 1000)) } }
    );
  }

  const body = await req.json().catch(() => null);
  const { kind, contentType, fileSize } = body || {};

  const isPrivate = PRIVATE_KINDS.has(kind);
  // Without this a URL gets signed with no bucket and R2 rejects the PUT
  // with an opaque error (e.g. env var added but the server not restarted).
  if (isPrivate && !R2_PRIVATE_BUCKET_NAME) {
    console.error("R2_PRIVATE_BUCKET_NAME is not set");
    return NextResponse.json({ error: "Private document storage is not configured" }, { status: 500 });
  }

  const ext = (isPrivate ? DOC_TYPES : ALLOWED_TYPES)[contentType];
  if (!ext) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  if (!fileSize || fileSize > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File is too large (max 5MB)" }, { status: 400 });
  }

  const { key, error: keyError } = await resolveKey(kind, userId, ext);
  if (keyError) return keyError;

  // Pinning ContentLength signs Content-Length as part of the presigned PUT,
  // so R2 rejects any request whose actual body size doesn't match exactly
  // -- this is what actually enforces the fileSize check above server-side;
  // without it a client could declare a small fileSize here and then PUT an
  // arbitrarily large body straight to the signed URL.
  const command = new PutObjectCommand({
    Bucket: isPrivate ? R2_PRIVATE_BUCKET_NAME : R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    ContentLength: fileSize,
  });

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 60 });

  // Private objects have no public URL -- callers store the key instead.
  return NextResponse.json({
    ok: true,
    uploadUrl,
    ...(isPrivate ? {} : { publicUrl: `${R2_PUBLIC_URL}/${key}` }),
    key,
  });
}
