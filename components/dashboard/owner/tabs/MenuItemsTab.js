"use client";

// Menu Items tab content for the owner dashboard's sidebar+tabs layout.
// Split out of the old OwnerMenuTabs.js (which used its own internal
// shadcn Tabs for items/categories) now that the sidebar owns that
// navigation. Renders the existing item list components/dialog unchanged.

import AddItemDialog from "@/components/dashboard/owner/dialogs/AddItemDialog";
import MenuItemsMobile from "@/components/dashboard/owner/MenuItemsMobile";
import MenuItemsTable from "@/components/dashboard/owner/MenuItemsTable";

export default function MenuItemsTab({ restaurant, menuItems, categories, categoryMap, actions }) {
  return (
    <div>
      <div className="flex justify-end mb-4">
        <AddItemDialog restaurantId={restaurant.id} categories={categories} onAdded={actions.reloadItems} />
      </div>

      {menuItems.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          No items yet. Add your first item ✨
        </div>
      ) : (
        <>
          <MenuItemsMobile
            menuItems={menuItems}
            categoryMap={categoryMap}
            onToggleAvailability={actions.toggleAvailability}
            onToggleSoldOut={actions.toggleSoldOut}
            onDeleteItem={actions.deleteItem}
          />

          <MenuItemsTable
            menuItems={menuItems}
            categoryMap={categoryMap}
            onToggleAvailability={actions.toggleAvailability}
            onToggleSoldOut={actions.toggleSoldOut}
            onDeleteItem={actions.deleteItem}
          />
        </>
      )}
    </div>
  );
}
