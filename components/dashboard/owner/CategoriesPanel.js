"use client";

import CategoryPill from "@/components/dashboard/owner/CategoryPill";

export default function CategoriesPanel({ categories, onRename, onDelete }) {
  return (
    <div>
      <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">Categories</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Rename or remove categories. Items become Uncategorized if deleted.
      </p>

      {categories.length === 0 ? (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
          No categories yet. Add one to organize your menu.
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((c) => (
            <CategoryPill
              key={c.id}
              category={c}
              onRename={onRename}
              onDelete={() => onDelete(c.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
