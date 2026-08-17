"use client";
import { supabaseBrowser } from "@/lib/supabase/client";
const supabase = supabaseBrowser();

import { useState } from "react";
import { DialogFooter } from "@/components/ui/dialog";

export default function AddCategoryForm({ restaurantId, onSuccess }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanName = name.trim();
    if (!cleanName) {
      setError("Category name is required.");
      setLoading(false);
      return;
    }

    const { error: dbError } = await supabase
      .from("categories")
      .insert([{ restaurant_id: restaurantId, name: cleanName }]);

    if (dbError) {
      const msg = dbError.message?.toLowerCase().includes("duplicate")
        ? "This category already exists."
        : dbError.message;
      setError(msg);
      setLoading(false);
      return;
    }

    setLoading(false);
    setName("");
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
          Category Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Biriyani"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />
      </div>

      {error ? (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      ) : null}

      <DialogFooter className="gap-2 sm:gap-0">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Adding…" : "Add Category"}
        </button>
      </DialogFooter>
    </form>
  );
}
