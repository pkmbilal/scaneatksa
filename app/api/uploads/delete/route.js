import { NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { r2Client, R2_BUCKET_NAME } from "@/lib/r2/client";
import { getAuthedUserId } from "@/lib/r2/auth";

export const runtime = "nodejs";

// A key may only be deleted by the account it belongs to -- mirrors the
// namespacing resolveKey() applies in app/api/uploads/presign/route.js.
// Never trust the "kind" the caller thinks a key is; check the key itself.
async function isOwnedKey(key, userId) {
  if (key.startsWith(`avatars/${userId}/`)) return true;

  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();

  if (!restaurant) return false;

  return key.startsWith(`restaurants/${restaurant.id}/`) || key.startsWith(`menu-items/${restaurant.id}/`);
}

export async function POST(req) {
  const { userId, error: authError } = await getAuthedUserId(req);
  if (authError || !userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const key = body?.key;

  if (!key || typeof key !== "string" || key.includes("..")) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  if (!(await isOwnedKey(key, userId))) {
    return NextResponse.json({ error: "Not allowed to delete this object" }, { status: 403 });
  }

  // DeleteObjectCommand doesn't error when the key is already gone, so a
  // double-delete (e.g. a retried request) is safely a no-op.
  await r2Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));

  return NextResponse.json({ ok: true });
}
