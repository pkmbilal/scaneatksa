"use client";

import CategoryPill from "@/components/dashboard/owner/CategoryPill";

export default function CategoriesPanel({ categories, onRename, onDelete }) {
  return (
    <div>
      {categories.length === 0 ? (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
          No categories yet. Add one to organize your menu.
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
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
