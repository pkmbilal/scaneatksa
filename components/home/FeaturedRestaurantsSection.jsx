import Link from "@/components/LocaleLink";
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
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              {t("eyebrow")}
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
              {t("title")}
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-slate-600">{t("description")}</p>
          </div>

          <Link
            href={data.cta.href}
            className="group inline-flex items-center gap-2 text-base font-semibold text-emerald-700 transition hover:text-emerald-800"
          >
            {t("cta")}
            <ChevronRight className="h-4 w-4 transition-transform rtl:-scale-x-100 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
          </Link>
        </div>

        {restaurants?.length ? (
          <div className="grid grid-cols-1 items-stretch gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {restaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-gradient-to-b from-white to-slate-50 p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
              <Store className="h-8 w-8 text-[#00c951]" />
            </div>
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
