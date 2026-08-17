"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Pencil, Trash2, Utensils } from "lucide-react";

import { Switch } from "@/components/ui/switch";

import { groupItemsByCategory, itemStatusTint, vegTint } from "@/components/dashboard/owner/utils";

const pillClass = "text-[10px] px-2 py-[3px] rounded-full font-semibold";

export default function MenuItemsMobile({
  menuItems,
  categoryMap,
  onToggleAvailability,
  onToggleSoldOut,
  onDeleteItem,
}) {
  const grouped = useMemo(
    () => groupItemsByCategory(menuItems, categoryMap),
    [menuItems, categoryMap],
  );

  return (
    <div className="md:hidden">
      {Object.entries(grouped).map(([catName, items]) => (
        <div key={catName} className="mb-6">
          <div className="py-2">
            <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
              {catName}{" "}
              <span className="font-medium text-gray-500 dark:text-gray-400">
                ({items.length} items)
              </span>
            </p>
          </div>

          <div className="space-y-3">
            {items.map((item) => {
              const soldOut = !!item.is_sold_out;
              const available = !!item.is_available;

              return (
                <div
                  key={item.id}
                  className={[
                    "rounded-2xl border border-gray-200 p-3 dark:border-gray-800",
                    soldOut ? "opacity-70" : "",
                  ].join(" ")}
                >
                  <div className="grid grid-cols-3 gap-3">
                    {/* image */}
                    <div className="relative col-span-1 h-[78px] w-[78px]">
                      {item.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-full w-full rounded-2xl border border-gray-200 object-cover dark:border-gray-800"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800">
                          <Utensils className="h-5 w-5 text-gray-400" />
                        </div>
                      )}

                      {soldOut && (
                        <span
                          className={`absolute -top-2 -left-2 rounded-full border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 ${pillClass} ${itemStatusTint.soldOut}`}
                        >
                          Sold Out
                        </span>
                      )}
                    </div>

                    {/* content */}
                    <div className="col-span-2 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold leading-tight text-gray-800 dark:text-white/90">
                            {item.name}
                          </p>

                          <div className="mt-1 flex flex-wrap gap-1.5">
                            <span className={`${pillClass} ${item.is_veg ? vegTint.veg : vegTint.nonVeg}`}>
                              {item.is_veg ? "Veg" : "Non-veg"}
                            </span>

                            {!available && (
                              <span className={`${pillClass} ${itemStatusTint.unavailable}`}>Unavailable</span>
                            )}

                            {available && !soldOut && (
                              <span className={`${pillClass} ${itemStatusTint.live}`}>Live</span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="whitespace-nowrap text-sm font-bold leading-none text-brand-600 dark:text-brand-400">
                            SAR {item.price}
                          </p>
                        </div>
                      </div>

                      {item.description ? (
                        <p className="mt-2 line-clamp-2 text-xs leading-snug text-gray-500 dark:text-gray-400">
                          {item.description}
                        </p>
                      ) : null}
                    </div>

                    {/* controls */}
                    <div className="col-span-3">
                      <div className="flex items-center justify-end gap-2">
                        <div className="flex h-8 items-center gap-2 rounded-full border border-gray-200 px-2 dark:border-gray-800 sm:h-9 sm:px-3">
                          <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300">Live</span>
                          <Switch
                            className="scale-90 sm:scale-100"
                            checked={available}
                            onCheckedChange={() => onToggleAvailability(item.id, item.is_available)}
                          />
                        </div>

                        <div className="flex h-8 items-center gap-2 rounded-full border border-gray-200 px-2 dark:border-gray-800 sm:h-9 sm:px-3">
                          <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300">Sold</span>
                          <Switch
                            className="scale-90 sm:scale-100"
                            checked={soldOut}
                            onCheckedChange={() => onToggleSoldOut(item.id, item.is_sold_out)}
                          />
                        </div>

                        <Link
                          href={`/dashboard/owner/menu/${item.id}/edit`}
                          aria-label="Edit item"
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 sm:h-9 sm:w-9"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>

                        <button
                          type="button"
                          aria-label="Delete item"
                          onClick={() => onDeleteItem(item.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-error-50 text-error-700 transition-colors hover:bg-error-100 dark:bg-error-500/15 dark:text-error-400 dark:hover:bg-error-500/25 sm:h-9 sm:w-9 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
