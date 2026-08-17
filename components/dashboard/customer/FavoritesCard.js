"use client";

import Link from "next/link";
import { Heart, ExternalLink, MapPin, X } from "lucide-react";

export default function FavoritesCard({ favorites = [], onRemove }) {
  const items = Array.isArray(favorites) ? favorites : [];

  return (
    <div>
      <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-white/90">
        <Heart className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        Favorite Restaurants
      </h3>

      {items.length === 0 ? (
        <div className="mt-4 rounded-xl border border-gray-200 p-6 text-center dark:border-gray-800">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
            <Heart className="h-6 w-6" />
          </div>
          <p className="font-semibold text-gray-800 dark:text-white/90">No favorites yet</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Browse restaurants and save your top picks.
          </p>
          <Link
            href="/restaurants"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            <ExternalLink className="h-4 w-4" />
            Browse Restaurants
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {items.map((fav) => {
            // support both possible shapes
            const r = fav?.restaurant || fav?.restaurants;
            const rid = fav?.restaurant_id ?? r?.id;
            const name = r?.name ?? `Restaurant (${rid})`;
            const slug = r?.slug || null;
            const address = r?.address || null;

            const href = slug ? `/menu/${slug}` : "#";

            return (
              <div
                key={fav?.id ?? `${rid ?? "no-id"}-${slug ?? "no-slug"}`}
                className="group relative rounded-xl border border-gray-200 p-4 transition-colors hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700"
              >
                {slug ? (
                  <Link href={href} className="block">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-800 transition-colors group-hover:text-brand-600 dark:text-white/90 dark:group-hover:text-brand-400">
                        {name}
                      </p>
                      {address && (
                        <p className="mt-1 line-clamp-2 flex items-start gap-1 text-sm text-gray-500 dark:text-gray-400">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          {address}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 inline-flex items-center text-sm font-medium text-brand-600 dark:text-brand-400">
                      View Menu <ExternalLink className="ml-1 h-4 w-4" />
                    </div>
                  </Link>
                ) : (
                  <div className="block">
                    <p className="truncate font-semibold text-gray-800 dark:text-white/90">{name}</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Restaurant details not loaded
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  title="Remove from favorites"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!rid) return;
                    onRemove?.(rid, name);
                  }}
                  className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 opacity-100 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-300 md:opacity-0 md:group-hover:opacity-100 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
