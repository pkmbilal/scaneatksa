"use client";

// Menu Items tab content for the owner dashboard's sidebar+tabs layout.
// Split out of the old OwnerMenuTabs.js (which used its own internal
// shadcn Tabs for items/categories) now that the sidebar owns that
// navigation. Renders the existing item list components unchanged.
// The "Add Item" action now lives in the page-level section header.

import MenuItemsMobile from "@/components/dashboard/owner/MenuItemsMobile";
import MenuItemsTable from "@/components/dashboard/owner/MenuItemsTable";
import OwnerStats from "@/components/dashboard/owner/OwnerStats";

export default function MenuItemsTab({ menuItems, categoryMap, actions }) {
  return (
    <div>
      <OwnerStats menuItems={menuItems} />

      {menuItems.length === 0 ? (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400 mt-6">
          No items yet. Add your first item ✨
        </div>
      ) : (
        <div className="mt-6">
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
        </div>
      )}
    </div>
  );
}
