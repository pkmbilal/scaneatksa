"use client";

import { useTranslations } from "next-intl";
import { Store, Phone, Link2, MapPin } from "lucide-react";

export default function RestaurantInfoCard({ restaurant }) {
  const t = useTranslations("dashboard.owner");
  const notSet = t("restaurantInfoCard.notSet");

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">{t("restaurantInfoCard.title")}</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {t("restaurantInfoCard.subtitle")}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        {/* Full width */}
        <InfoRow
          icon={Store}
          label={t("restaurantInfoCard.name")}
          value={restaurant?.name || notSet}
          notSetValue={notSet}
          className="md:col-span-2"
        />

        {/* Two columns */}
        <InfoRow
          icon={Phone}
          label={t("restaurantInfoCard.whatsapp")}
          value={restaurant?.phone || notSet}
          notSetValue={notSet}
        />
        <InfoRow
          icon={Link2}
          label={t("restaurantInfoCard.slug")}
          value={restaurant?.slug ? `/menu/${restaurant.slug}` : notSet}
          notSetValue={notSet}
          mono
        />

        {/* Full width */}
        <InfoRow
          icon={MapPin}
          label={t("restaurantInfoCard.address")}
          value={restaurant?.address || notSet}
          notSetValue={notSet}
          className="md:col-span-2"
        />
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono = false, className = "", notSetValue }) {
  const isEmpty = !value || value === notSetValue;

  return (
    <div
      className={[
        "flex items-start gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800",
        className,
      ].join(" ")}
    >
      {/* Icon chip */}
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
        <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p
          className={[
            "mt-1 line-clamp-2 font-medium text-gray-800 dark:text-white/90",
            mono ? "font-mono text-xs" : "text-sm",
            isEmpty ? "text-gray-400 dark:text-gray-500" : "",
          ].join(" ")}
          title={typeof value === "string" ? value : undefined}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
