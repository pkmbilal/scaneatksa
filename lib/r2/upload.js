"use client";

import { supabaseBrowser } from "@/lib/supabase/client";

const supabase = supabaseBrowser();

// Keep in sync with the server-side allow-list in
// app/api/uploads/presign/route.js -- this copy only exists to fail fast
// client-side before spending a network round trip.
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const COMPRESS_QUALITY = 0.8;
const COMPRESS_MAX_DIMENSION = {
  avatar: 512, // shown at 80px (h-20 w-20) in EditProfileForm -- no reason to keep it large
  "restaurant-logo": 1600,
  "menu-item": 1600,
};

export class UploadValidationError extends Error {}

// Downscales + re-encodes a file to JPEG client-side so uploads land closer
// to ~200KB without any server/Supabase involvement. GIFs are left alone
// (likely animated -- flattening to JPEG would keep only one frame). Never
// throws: any failure, or a "compressed" result that's actually bigger than
// the original (can happen with already-optimized small images), falls back
// to the original file so compression can never break an otherwise-valid
// upload.
async function compressImage(file, kind) {
  if (file.type === "image/gif") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const maxDimension = COMPRESS_MAX_DIMENSION[kind] || 1600;
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    // JPEG has no alpha channel -- without this, transparent PNG/WebP source
    // pixels (e.g. a logo on a transparent background) would render as
    // opaque black instead of just losing their transparency.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", COMPRESS_QUALITY));
    if (!blob || blob.size >= file.size) return file;

    const jpgName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], jpgName, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

// Uploads a File straight to R2 via a short-lived presigned PUT URL, then
// returns the file's public URL to store on the record (restaurants.image_url,
// menu_items.image_url, user_profiles.avatar_url). `kind` tells the presign
// route which namespace/ownership check to apply --
// "restaurant-logo" | "menu-item" | "avatar".
export async function uploadImageToR2(file, kind) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new UploadValidationError("invalidType");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new UploadValidationError("tooLarge");
  }

  const uploadFile = await compressImage(file, kind);

  const { data: sess } = await supabase.auth.getSession();
  const token = sess?.session?.access_token;

  const presignRes = await fetch("/api/uploads/presign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ kind, contentType: uploadFile.type, fileSize: uploadFile.size }),
  });

  const presign = await presignRes.json().catch(() => null);
  if (!presignRes.ok || !presign?.ok) {
    throw new Error(presign?.error || "presignFailed");
  }

  const putRes = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": uploadFile.type },
    body: uploadFile,
  });

  if (!putRes.ok) {
    throw new Error("uploadFailed");
  }

  return presign.publicUrl;
}

// Deletes a previously-uploaded object by key (as returned alongside
// publicUrl by /api/uploads/presign). Best-effort by design -- callers use
// this to clean up a replaced/removed image and shouldn't fail the UI flow
// if it errors, so this only logs rather than throwing.
export async function deleteImageFromR2(key) {
  try {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess?.session?.access_token;

    const res = await fetch("/api/uploads/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ key }),
    });

    if (!res.ok) {
      console.warn("Failed to delete old R2 object", key, await res.text().catch(() => ""));
    }
  } catch (err) {
    console.warn("Failed to delete old R2 object", key, err);
  }
}

// Derives the object key from a public R2 URL, or null if the URL isn't one
// of ours (e.g. a legacy pre-migration URL still on file) -- only URLs we
// recognize are safe to fire a delete for.
export function keyFromR2Url(url) {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (!base || !url || !url.startsWith(`${base}/`)) return null;
  return url.slice(base.length + 1);
}

// Call this only after a save has actually persisted `newUrl` -- comparing
// against the value the form loaded at open time. Deleting at that point
// (rather than the moment ImageUploadField swaps the preview) means a
// replace-then-cancel/never-save leaves the old object intact and the DB
// row's image_url stays valid, instead of pointing at a deleted object.
export function cleanupOldImage(oldUrl, newUrl) {
  if (!oldUrl || oldUrl === newUrl) return;
  const key = keyFromR2Url(oldUrl);
  if (key) deleteImageFromR2(key);
}
