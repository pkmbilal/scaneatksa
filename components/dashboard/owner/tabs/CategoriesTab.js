"use client";

// Categories tab content for the owner dashboard's sidebar+tabs layout.
// Split out of the old OwnerMenuTabs.js. Renders the existing categories
// panel/dialog unchanged.

import AddCategoryDialog from "@/components/dashboard/owner/dialogs/AddCategoryDialog";
import CategoriesPanel from "@/components/dashboard/owner/CategoriesPanel";

export default function CategoriesTab({ restaurant, categories, actions }) {
  return (
    <div>
      <div className="flex justify-end mb-4">
        <AddCategoryDialog restaurantId={restaurant.id} onAdded={actions.reloadCategories} />
      </div>

      <CategoriesPanel categories={categories} onRename={actions.renameCategory} onDelete={actions.deleteCategory} />
    </div>
  );
}
