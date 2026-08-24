"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, ChevronDown } from "lucide-react";

export default function RestaurantsFilters({ cities = [], cuisines = [] }) {
  const t = useTranslations("restaurants");
  const router = useRouter();
  const sp = useSearchParams();

  const [type, setType] = useState(sp.get("type") || "restaurants"); // restaurants | food
  const [q, setQ] = useState(sp.get("q") || "");
  const [city, setCity] = useState(sp.get("city") || "");
  const [cuisine, setCuisine] = useState(sp.get("cuisine") || "");
  const [veg, setVeg] = useState(sp.get("veg") === "1");

  useEffect(() => {
    setType(sp.get("type") || "restaurants");
    setQ(sp.get("q") || "");
    setCity(sp.get("city") || "");
    setCuisine(sp.get("cuisine") || "");
    setVeg(sp.get("veg") === "1");
  }, [sp]);

  // ✅ robust apply: can accept a base params to avoid "stale sp" issues on mobile
  const apply = (next, baseParams) => {
    const params = baseParams
      ? new URLSearchParams(baseParams.toString())
      : new URLSearchParams(sp.toString());

    Object.entries(next).forEach(([k, v]) => {
      if (v === "" || v === null || v === undefined || v === false) {
        params.delete(k);
      } else {
        params.set(k, String(v));
      }
    });

    params.delete("page");

    const url = `/restaurants?${params.toString()}`;
    router.push(url);

    // ✅ helps when the page uses Server Components / server data fetching
    router.refresh();
  };

  const clearAll = () => {
    router.push("/restaurants");
    router.refresh();
  };

  const filtersActive = Boolean(city || cuisine || veg || type !== "restaurants");

  return (
    <div className="w-full bg-white border rounded-2xl p-4 md:p-5 shadow-sm">
      {/* ✅ MOBILE ONLY: Search bar first, then scrollable filter pills */}
      <div className="md:hidden space-y-3">
        {/* Search bar like screenshot */}
        <div className="relative">
          <Search
            size={18}
            className="absolute start-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const base = new URLSearchParams(sp.toString());
                apply({ q: q.trim(), type }, base);
              }
            }}
            placeholder={t("filters.mobileSearchPlaceholder")}
            className="w-full h-12 ps-11 pe-4 border rounded-2xl bg-gray-50 focus:bg-white outline-none"
          />
        </div>

        {/* Scrollable pills row like screenshot */}
        <div className="-mx-4 px-4 overflow-x-auto">
          <div className="flex items-center gap-2 w-max pb-1">
            {/* Restaurants/Food pill */}
            <label className="relative">
              <span className="sr-only">{t("filters.searchForLabel")}</span>
              <select
                value={type}
                onChange={(e) => {
                  const v = e.target.value;
                  setType(v);
                  const base = new URLSearchParams(sp.toString());
                  apply({ type: v }, base);
                }}
                className="h-10 ps-4 pe-9 border rounded-xl bg-white text-sm font-semibold text-gray-900 appearance-none"
              >
                <option value="restaurants">{t("filters.typeRestaurants")}</option>
                <option value="food">{t("filters.typeFood")}</option>
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
            </label>

            {/* City pill */}
            <label className="relative">
              <span className="sr-only">{t("filters.cityLabel")}</span>
              <select
                value={city}
                onChange={(e) => {
                  const v = e.target.value;
                  setCity(v);
                  const base = new URLSearchParams(sp.toString());
                  apply({ city: v }, base);
                }}
                className="h-10 ps-4 pe-9 border rounded-xl bg-white text-sm font-semibold text-gray-900 appearance-none"
              >
                <option value="">{t("filters.cityLabel")}</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
            </label>

            {/* Cuisines pill */}
            <label className="relative">
              <span className="sr-only">{t("filters.cuisinesLabel")}</span>
              <select
                value={cuisine}
                onChange={(e) => {
                  const v = e.target.value;
                  setCuisine(v);
                  const base = new URLSearchParams(sp.toString());
                  apply({ cuisine: v }, base);
                }}
                className="h-10 ps-4 pe-9 border rounded-xl bg-white text-sm font-semibold text-gray-900 appearance-none"
              >
                <option value="">{t("filters.cuisinesLabel")}</option>
                {cuisines.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
            </label>

            {/* Veg pill */}
            <button
              type="button"
              onClick={() => {
                const next = !veg;
                setVeg(next);
                const base = new URLSearchParams(sp.toString());
                apply({ veg: next ? "1" : "" }, base);
              }}
              aria-pressed={veg}
              className={`h-10 px-4 border rounded-xl text-sm font-semibold transition ${
                veg
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-gray-900"
              }`}
            >
              {t("filters.vegPill")}
            </button>

            {/* Clear pill */}
            {filtersActive && (
              <button
                type="button"
                onClick={clearAll}
                className="h-10 px-4 border rounded-xl text-sm font-semibold bg-gray-100 text-gray-800"
              >
                {t("filters.clear")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ✅ DESKTOP: keep your current desktop layout exactly the same */}
      <div className="hidden md:block">
        <div className="flex flex-col md:flex-row md:flex-nowrap gap-3 md:items-end">
          {/* Search Type */}
          <div className="w-full md:w-44">
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              {t("filters.searchForLabel")}
            </label>
            <select
              value={type}
              onChange={(e) => {
                const v = e.target.value;
                setType(v);
                const base = new URLSearchParams(sp.toString());
                apply({ type: v }, base);
              }}
              className="w-full h-11 px-3 border rounded-xl bg-white"
            >
              <option value="restaurants">{t("filters.typeRestaurants")}</option>
              <option value="food">{t("filters.typeFood")}</option>
            </select>
          </div>

          {/* Search */}
          <div className="w-full md:w-[300px]">
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              {type === "food" ? t("filters.foodNameLabel") : t("filters.restaurantNameLabel")}
            </label>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const base = new URLSearchParams(sp.toString());
                  apply({ q: q.trim(), type }, base);
                }
              }}
              placeholder={
                type === "food"
                  ? t("filters.foodNamePlaceholder")
                  : t("filters.restaurantNamePlaceholder")
              }
              className="w-full h-11 px-4 border rounded-xl"
            />
          </div>

          {/* City */}
          <div className="w-full md:w-56">
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              {t("filters.cityLabel")}
            </label>
            <select
              value={city}
              onChange={(e) => {
                const v = e.target.value;
                setCity(v);
                const base = new URLSearchParams(sp.toString());
                apply({ city: v }, base);
              }}
              className="w-full h-11 px-3 border rounded-xl bg-white"
            >
              <option value="">{t("filters.cityAllOption")}</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cuisine */}
          <div className="w-full md:w-56">
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              {t("filters.cuisineLabel")}
            </label>
            <select
              value={cuisine}
              onChange={(e) => {
                const v = e.target.value;
                setCuisine(v);
                const base = new URLSearchParams(sp.toString());
                apply({ cuisine: v }, base);
              }}
              className="w-full h-11 px-3 border rounded-xl bg-white"
            >
              <option value="">{t("filters.cuisineAllOption")}</option>
              {cuisines.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Vegetarian toggle */}
          <div className="w-full md:w-[75px]">
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              {t("filters.vegetarianLabel")}
            </label>

            <div className="h-11 border rounded-xl px-2 flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  const next = !veg;
                  setVeg(next);
                  const base = new URLSearchParams(sp.toString());
                  apply({ veg: next ? "1" : "" }, base);
                }}
                aria-pressed={veg}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  veg ? "bg-green-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                    veg ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 w-full md:w-auto md:ms-auto">
            <button
              type="button"
              onClick={() => {
                const base = new URLSearchParams(sp.toString());
                apply({ q: q.trim(), type }, base);
              }}
              className="h-11 px-4 rounded-xl bg-primary text-white font-semibold hover:bg-green-600 transition flex-1 md:flex-none"
            >
              {t("filters.apply")}
            </button>

            <button
              type="button"
              onClick={clearAll}
              className="h-11 px-4 rounded-xl bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200 transition flex-1 md:flex-none"
            >
              {t("filters.clear")}
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-3">
          {t.rich("filters.tip", { b: (chunks) => <b>{chunks}</b> })}
        </p>
      </div>
    </div>
  );
}
