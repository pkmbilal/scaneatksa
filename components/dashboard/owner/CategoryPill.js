"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";

export default function CategoryPill({ category, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setName(category.name), [category.name]);

  const save = async () => {
    setError("");
    setSaving(true);

    const res = await onRename(category.id, name);

    setSaving(false);

    if (!res?.ok) {
      setError(res?.message || "Failed to rename");
      return;
    }

    setEditing(false);
  };

  return (
    <div className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-800">
      {!editing ? (
        <>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{category.name}</span>

          <button
            type="button"
            className="rounded-full p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200 cursor-pointer"
            onClick={() => setEditing(true)}
            title="Rename"
          >
            <Pencil className="h-4 w-4" />
          </button>

          <button
            type="button"
            className="rounded-full p-1 text-error-600 transition hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/15 cursor-pointer"
            onClick={onDelete}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      ) : (
        <>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 w-40 rounded-full border border-gray-300 px-3 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            autoFocus
          />

          <button
            type="button"
            className="rounded-full p-1 text-success-600 transition hover:bg-success-50 dark:text-success-400 dark:hover:bg-success-500/15 cursor-pointer disabled:opacity-50"
            onClick={save}
            disabled={saving}
            title="Save"
          >
            <Check className="h-4 w-4" />
          </button>

          <button
            type="button"
            className="rounded-full p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200 cursor-pointer"
            onClick={() => {
              setEditing(false);
              setName(category.name);
              setError("");
            }}
            title="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </>
      )}

      {error ? <span className="ml-1 text-xs text-error-600 dark:text-error-400">{error}</span> : null}
    </div>
  );
}
