import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from "@/lib/r2/client";
import { getAuthedUserId } from "@/lib/r2/auth";

export const runtime = "nodejs";

// image/<ext> allow-list -- keep in sync with the client-side check in
// lib/r2/upload.js so users get a fast, friendly error before we ever hit
// the network.
const ALLOWED_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB. Client-declared, not server-enforced (see note below).

// Every upload "kind" resolves to an object key namespaced by whatever it
// belongs to (never client-supplied), so one signed owner/user can't write
// into another's path.
async function resolveKey(kind, userId, ext) {
  const uuid = randomUUID();

  if (kind === "avatar") {
    return { key: `avatars/${userId}/${uuid}.${ext}` };
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

  const body = await req.json().catch(() => null);
  const { kind, contentType, fileSize } = body || {};

  const ext = ALLOWED_TYPES[contentType];
  if (!ext) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  if (!fileSize || fileSize > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File is too large (max 5MB)" }, { status: 400 });
  }

  const { key, error: keyError } = await resolveKey(kind, userId, ext);
  if (keyError) return keyError;

  // Note: PutObjectCommand's presigned URL can't hard-enforce fileSize --
  // that needs an S3 POST policy with conditions. Fine for v1 given this is
  // owner/authenticated-user-only, not a public upload form; revisit if this
  // ever opens up to anonymous/customer uploads.
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 60 });

  return NextResponse.json({
    ok: true,
    uploadUrl,
    publicUrl: `${R2_PUBLIC_URL}/${key}`,
    key,
  });
}
