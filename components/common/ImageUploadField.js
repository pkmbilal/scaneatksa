"use client";
// Reusable image upload control backed by Cloudflare R2 (see lib/r2/upload.js).
// Deliberately unopinionated about surrounding markup -- no outer <label>, no
// fixed spacing -- so it drops into both the raw-Tailwind dashboard pages and
// the shadcn-heavy EditProfileForm without a visual clash. Callers keep their
// own label/hint text and just pass `value`/`onChange` like they would for a
// plain <input>.

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import { uploadImageToR2, UploadValidationError } from "@/lib/r2/upload";

const DEFAULT_LABELS = {
  choose: "Choose image",
  change: "Change image",
  uploading: "Uploading…",
  remove: "Remove",
  invalidType: "Please choose a JPEG, PNG, WebP, or GIF image.",
  tooLarge: "Image must be smaller than 5MB.",
  uploadFailed: "Upload failed. Please try again.",
};

export default function ImageUploadField({
  value,
  onChange,
  kind, // "restaurant-logo" | "menu-item" | "avatar"
  labels,
  previewClassName = "w-full h-44 object-cover rounded-lg border border-gray-200 dark:border-gray-800",
}) {
  const t = { ...DEFAULT_LABELS, ...labels };
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [previewBroken, setPreviewBroken] = useState(false);

  // Re-arm the preview whenever `value` changes -- otherwise a broken image
  // (e.g. a stale/legacy URL) that already hid itself via onError would stay
  // hidden forever, even after a later upload sets a perfectly valid src.
  useEffect(() => setPreviewBroken(false), [value]);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so picking the same file again still fires onChange
    if (!file) return;

    setError("");
    setUploading(true);
    try {
      const url = await uploadImageToR2(file, kind);
      onChange?.(url);
    } catch (err) {
      setError(err instanceof UploadValidationError ? t[err.message] || t.uploadFailed : t.uploadFailed);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t.uploading}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              {value ? t.change : t.choose}
            </>
          )}
        </Button>

        {value && !uploading && (
          <button
            type="button"
            onClick={() => onChange?.("")}
            className="text-xs text-gray-500 hover:text-error-600 dark:text-gray-400 dark:hover:text-error-400"
          >
            {t.remove}
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-error-600 dark:text-error-400">{error}</p>}

      {value && !previewBroken && (
        <div className="mt-3">
          <img src={value} alt="" className={previewClassName} onError={() => setPreviewBroken(true)} />
        </div>
      )}
    </div>
  );
}
