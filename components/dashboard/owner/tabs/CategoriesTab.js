"use client";

// Categories tab content for the owner dashboard's sidebar+tabs layout.
// Split out of the old OwnerMenuTabs.js. Renders the existing categories
// panel unchanged. The "Add Category" action now lives in the page-level
// section header.

import CategoriesPanel from "@/components/dashboard/owner/CategoriesPanel";

export default function CategoriesTab({ categories, actions }) {
  return (
    <CategoriesPanel categories={categories} onRename={actions.renameCategory} onDelete={actions.deleteCategory} />
  );
}
