"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import MenuItem from "@/components/MenuItem";
import MashrabiyaFret from "@/components/menu/MashrabiyaFret";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

// `categories` is an ordered array of { name, count } from the page (sorted
// by the owner's sort_order). When no filter/search is active the menu is
// shown grouped under those category headers; picking a category or typing
// a query collapses it to a single flat grid.
export default function MenuClient({ items, categories, restaurant }) {
  const t = useTranslations("menu");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const uncategorized = t("uncategorized");
  const query = searchQuery.trim().toLowerCase();

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = !query || item.name.toLowerCase().includes(query);
      const matchesCategory =
        selectedCategory === "All" ||
        (item.categories?.name || uncategorized) === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, query, selectedCategory, uncategorized]);

  const grouped = selectedCategory === "All" && query === "";

  const pillBase =
    "flex-none rounded-full border px-4 py-1.5 text-sm font-medium transition-colors";
  const pillActive =
    "border-[color:var(--m-emerald)] bg-[color:var(--m-emerald)] text-[color:var(--m-on-emerald)]";
  const pillIdle =
    "border-[color:var(--m-line)] bg-[color:var(--m-parchment)] text-[color:var(--m-ink-soft)] hover:text-[color:var(--m-ink)]";

  return (
    <div className="space-y-8">
      {/* Filter rail */}
      <div className="sticky top-0 z-10 -mx-4 border-b border-[color:var(--m-line)] bg-[color:var(--m-limestone)]/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto max-w-6xl space-y-3">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--m-ink-soft)]" />
            <Input
              placeholder={t("search.placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-[color:var(--m-line)] bg-[color:var(--m-parchment)] ps-9 text-[color:var(--m-ink)] placeholder:text-[color:var(--m-ink-soft)] focus-visible:ring-1 focus-visible:ring-[color:var(--m-emerald)]"
            />
          </div>

          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide md:mx-0 md:px-0">
            <button
              onClick={() => setSelectedCategory("All")}
              className={cn(pillBase, selectedCategory === "All" ? pillActive : pillIdle)}
            >
              {t("categories.all")}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={cn(
                  pillBase,
                  selectedCategory === cat.name ? pillActive : pillIdle
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Items */}
      {filteredItems.length === 0 ? (
        <div className="py-16 text-center text-[color:var(--m-ink-soft)]">
          <p className="font-display text-lg text-[color:var(--m-ink)]">{t("empty.title")}</p>
          <p className="mt-1 text-sm">{t("empty.subtitle")}</p>
        </div>
      ) : grouped ? (
        <div className="space-y-12">
          {categories.map((cat) => {
            const catItems = items.filter(
              (it) => (it.categories?.name || uncategorized) === cat.name
            );
            if (catItems.length === 0) return null;
            return (
              <section key={cat.name}>
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="font-display text-2xl font-semibold text-[color:var(--m-ink)] md:text-3xl">
                    {cat.name}
                  </h2>
                  <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-[color:var(--m-ink-soft)]">
                    {t("categories.count", { count: catItems.length })}
                  </span>
                </div>
                <MashrabiyaFret variant="band" className="mt-3 mb-6" />
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {catItems.map((item, i) => (
                    <MenuItem
                      key={item.id}
                      item={item}
                      restaurant={restaurant}
                      index={i}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item, i) => (
            <MenuItem key={item.id} item={item} restaurant={restaurant} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
