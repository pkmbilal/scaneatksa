import Link from "next/link";
import { ChevronRight, Store } from "lucide-react";
import { getTranslations } from "next-intl/server";
import RestaurantCard from "@/components/restaurant/RestaurantCard";

export default async function FeaturedRestaurantsSection({ data, restaurants }) {
  const t = await getTranslations("home.featuredRestaurants");

  return (
    <section className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
              {t("eyebrow")}
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
              {t("title")}
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-slate-600">{t("description")}</p>
          </div>

          <Link
            href={data.cta.href}
            className="inline-flex items-center gap-2 text-base font-semibold text-emerald-700 transition hover:text-emerald-800"
          >
            {t("cta")}
            <ChevronRight className="h-4 w-4 rtl:-scale-x-100" />
          </Link>
        </div>

        {restaurants?.length ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {restaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Store className="mx-auto h-10 w-10 text-slate-400" />
            <h3 className="mt-4 text-xl font-semibold text-slate-900">
              {t("emptyState.title")}
            </h3>
            <p className="mt-2 text-slate-600">{t("emptyState.description")}</p>
          </div>
        )}
      </div>
    </section>
  );
}
