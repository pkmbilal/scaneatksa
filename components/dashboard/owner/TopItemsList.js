"use client";

// Ranked list of best-selling menu items for the owner Analytics tab. A
// list, not a chart -- clearer than a bar chart for a top-5 ranking and
// needs no new chart primitive. Names/prices are the order_items snapshot
// at order time, not a live join to menu_items, so a renamed/repriced item
// still shows historically-accurate figures.
import { useTranslations } from "next-intl";

export default function TopItemsList({ items }) {
  const t = useTranslations("dashboard.owner");

  if (!items || items.length === 0) {
    return (
      <div className="flex h-[160px] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        {t("analyticsTab.noItemsYet")}
      </div>
    );
  }

  return (
    <ol className="space-y-2">
      {items.map((item, i) => (
        <li
          key={item.name || i}
          className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 dark:border-gray-800 dark:bg-white/[0.02]"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
            {i + 1}
          </span>
          <span className="min-w-0 flex-1 truncate font-medium text-gray-800 dark:text-white/90">
            {item.name || t("analyticsTab.unnamedItem")}
          </span>
          <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
            {t("analyticsTab.itemQuantity", { count: item.quantity })}
          </span>
          <span className="shrink-0 text-sm font-semibold text-gray-800 dark:text-white/90">
            {t("common.price", { amount: item.revenue.toFixed(2) })}
          </span>
        </li>
      ))}
    </ol>
  );
}
