"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import MenuItem from "@/components/MenuItem";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MenuClient({ items, categories, restaurant }) {
    const t = useTranslations("menu");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            const matchesSearch = item.name
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
            const matchesCategory =
                selectedCategory === "All" ||
                (item.categories?.name || t("uncategorized")) === selectedCategory;

            return matchesSearch && matchesCategory;
        });
    }, [items, searchQuery, selectedCategory, t]);

    return (
        <div className="space-y-6">
            {/* Search and Filter Section */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 -mx-4 px-4 border-b border-border/40">
                <div className="max-w-7xl mx-auto space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t("search.placeholder")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="ps-9 bg-muted/50 border-input/60 focus-visible:ring-1 focus-visible:ring-ring"
                        />
                    </div>

                    {/* Category Pills */}
                    <div className="flex gap-1 md:gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                        <button
                            onClick={() => setSelectedCategory("All")}
                            className={cn(
                                "flex-none px-4 py-1.5 rounded-full text-sm font-medium transition-colors border",
                                selectedCategory === "All"
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            {t("categories.all")}
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                    "flex-none px-4 py-1.5 rounded-full text-sm font-medium transition-colors border",
                                    selectedCategory === cat
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-background text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Menu Items Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                        <MenuItem
                            key={item.id}
                            item={item}
                            restaurant={restaurant}
                            categoryMap={{}}
                        />
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        <p className="text-lg font-medium">{t("empty.title")}</p>
                        <p className="text-sm">{t("empty.subtitle")}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
