export function groupItemsByCategory(menuItems, categoryMap, uncategorizedLabel = "Uncategorized") {
  const grouped = {};
  for (const item of menuItems || []) {
    const name = categoryMap?.[item.category_id] || uncategorizedLabel;
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push(item);
  }
  return grouped;
}

// Shared badge tint classes for menu item status pills, used by both
// MenuItemsTable.js (desktop) and MenuItemsMobile.js so the two views stay
// visually consistent for the same underlying data.
export const vegTint = {
  veg: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  nonVeg: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
};

export const itemStatusTint = {
  soldOut: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
  unavailable: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
  live: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  category: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};
