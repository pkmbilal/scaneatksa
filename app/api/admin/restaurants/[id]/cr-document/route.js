import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/auth/admin";
import { r2Client, R2_PRIVATE_BUCKET_NAME } from "@/lib/r2/client";

export const runtime = "nodejs";

const URL_TTL_SECONDS = 300;

// Admin-only: a short-lived presigned GET for the CR certificate an owner
// submitted after approval (restaurants.cr_document_path, set by the
// owner_submit_cr RPC). Same private bucket as request documents -- see
// app/api/admin/restaurant-requests/[id]/document/route.js.
export async function GET(req, context) {
  const { error: authError } = await requireAdmin(req);
  if (authError) return authError;

  if (!R2_PRIVATE_BUCKET_NAME) {
    console.error("R2_PRIVATE_BUCKET_NAME is not set");
    return NextResponse.json({ error: "Private document storage is not configured" }, { status: 500 });
  }

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Missing restaurant id" }, { status: 400 });

  const { data: restaurant, error } = await supabaseAdmin
    .from("restaurants")
    .select("cr_document_path")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error loading restaurant CR document:", error);
    return NextResponse.json({ error: "Failed to load restaurant" }, { status: 500 });
  }
  if (!restaurant?.cr_document_path) {
    return NextResponse.json({ error: "No document on this restaurant" }, { status: 404 });
  }

  const url = await getSignedUrl(
    r2Client,
    new GetObjectCommand({
      Bucket: R2_PRIVATE_BUCKET_NAME,
      Key: restaurant.cr_document_path,
      ResponseContentDisposition: "inline",
    }),
    { expiresIn: URL_TTL_SECONDS }
  );

  return NextResponse.json({ ok: true, url });
}
