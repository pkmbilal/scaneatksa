"use client";
import { supabaseBrowser } from "@/lib/supabase/client";
const supabase = supabaseBrowser();

import { useState } from "react";
import { DialogFooter } from "@/components/ui/dialog";

export default function AddTableForm({ restaurantId, onSuccess }) {
  const [count, setCount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const n = Number(count || 0);
    if (!n || n < 1 || n > 200) {
      setError("Please enter a valid number of tables (1 to 200).");
      return;
    }

    setLoading(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token;

      const res = await fetch(`/api/restaurants/${restaurantId}/tables/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ count: n }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || "Failed to add tables.");
        setLoading(false);
        return;
      }

      setLoading(false);
      setCount("");
      onSuccess?.();
    } catch (err) {
      setError(err?.message || "Server error adding tables.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
          Number of tables to add
        </label>
        <input
          type="number"
          min={1}
          max={200}
          value={count}
          onChange={(e) => setCount(e.target.value)}
          placeholder="e.g., 5"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          New tables continue from your current highest table number — e.g. if you have Table 1–8, this
          adds Table 9 onward.
        </p>
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
          {loading ? "Adding…" : "Add Table"}
        </button>
      </DialogFooter>
    </form>
  );
}
