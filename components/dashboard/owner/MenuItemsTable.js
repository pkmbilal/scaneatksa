"use client";

import Link from "next/link";
import { Pencil, Trash2, Utensils } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { itemStatusTint, vegTint } from "@/components/dashboard/owner/utils";

const pillClass = "text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap";

export default function MenuItemsTable({
  menuItems,
  categoryMap,
  onToggleAvailability,
  onToggleSoldOut,
  onDeleteItem,
}) {
  return (
    <div className="hidden md:block">
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="px-4 py-3 font-semibold text-gray-500 dark:text-gray-400">Item</th>
              <th className="px-4 py-3 font-semibold text-gray-500 dark:text-gray-400">Category</th>
              <th className="px-4 py-3 font-semibold text-gray-500 dark:text-gray-400">Type</th>
              <th className="px-4 py-3 font-semibold text-gray-500 dark:text-gray-400">Price</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-500 dark:text-gray-400">Available</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-500 dark:text-gray-400">Sold Out</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>

          <tbody>
            {menuItems.map((item) => {
              const soldOut = !!item.is_sold_out;
              const available = !!item.is_available;

              return (
                <tr
                  key={item.id}
                  className={`border-b border-gray-100 last:border-0 dark:border-gray-800 ${soldOut ? "opacity-70" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {item.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-10 w-10 rounded-lg border border-gray-200 object-cover dark:border-gray-800"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800">
                          <Utensils className="h-4 w-4 text-gray-400" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="max-w-[220px] truncate font-medium text-gray-800 dark:text-white/90">
                            {item.name}
                          </p>
                          {soldOut && <span className={`${pillClass} ${itemStatusTint.soldOut}`}>Sold Out</span>}
                          {!available && (
                            <span className={`${pillClass} ${itemStatusTint.unavailable}`}>Unavailable</span>
                          )}
                        </div>

                        {item.description ? (
                          <p className="max-w-[320px] truncate text-xs text-gray-500 dark:text-gray-400">
                            {item.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`${pillClass} ${itemStatusTint.category}`}>
                      {categoryMap[item.category_id] || "Uncategorized"}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`${pillClass} ${item.is_veg ? vegTint.veg : vegTint.nonVeg}`}>
                      {item.is_veg ? "Veg" : "Non-veg"}
                    </span>
                  </td>

                  <td className="px-4 py-3 font-semibold text-gray-800 dark:text-white/90">SAR {item.price}</td>

                  <td className="px-4 py-3 text-center">
                    <Switch
                      className="cursor-pointer"
                      checked={available}
                      onCheckedChange={() => onToggleAvailability(item.id, item.is_available)}
                    />
                  </td>

                  <td className="px-4 py-3 text-center">
                    <Switch
                      className="cursor-pointer"
                      checked={soldOut}
                      onCheckedChange={() => onToggleSoldOut(item.id, item.is_sold_out)}
                    />
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/owner/menu/${item.id}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => onDeleteItem(item.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-error-50 px-3 py-1.5 text-sm font-semibold text-error-700 transition-colors hover:bg-error-100 dark:bg-error-500/15 dark:text-error-400 dark:hover:bg-error-500/25 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
