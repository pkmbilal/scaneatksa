"use client";

import { supabaseBrowser } from "@/lib/supabase/client";

const supabase = supabaseBrowser();

// Keep in sync with the server-side allow-list in
// app/api/uploads/presign/route.js -- this copy only exists to fail fast
// client-side before spending a network round trip.
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export class UploadValidationError extends Error {}

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

  const { data: sess } = await supabase.auth.getSession();
  const token = sess?.session?.access_token;

  const presignRes = await fetch("/api/uploads/presign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ kind, contentType: file.type, fileSize: file.size }),
  });

  const presign = await presignRes.json().catch(() => null);
  if (!presignRes.ok || !presign?.ok) {
    throw new Error(presign?.error || "presignFailed");
  }

  const putRes = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
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
