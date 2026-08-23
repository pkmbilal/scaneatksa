"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { List, LayoutGrid, UtensilsCrossed, Bike, ShoppingBag } from "lucide-react";
import { STATUS_LABELS, STATUS_TINTS } from "@/lib/orderStatus";
import { notifyStatusChange } from "@/lib/whatsappClient";

const channelTint = "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
const pillClass = "text-xs px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap";

const ALL_STATUSES = Object.keys(STATUS_LABELS);

const CHANNEL_META = {
  dine_in: {
    icon: UtensilsCrossed,
    accent: "border-l-brand-500",
    badge: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400",
  },
  delivery: {
    icon: Bike,
    accent: "border-l-orange-500",
    badge: "bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400",
  },
  pickup: {
    icon: ShoppingBag,
    accent: "border-l-success-500",
    badge: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400",
  },
};

export default function OwnerOrdersTab({ restaurant, orders, ordersLoading, onStatusChange }) {
  const t = useTranslations("dashboard.owner");
  const [updatingId, setUpdatingId] = useState(null);
  const [viewMode, setViewMode] = useState("list");

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const handleStatusPick = async (order, nextStatus) => {
    if (!nextStatus || nextStatus === order.status) return;
    setUpdatingId(order.id);
    try {
      const updated = await onStatusChange?.(order.id, nextStatus);
      notifyStatusChange(updated, restaurant?.name);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      {ordersLoading ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">{t("ownerOrdersTab.loading")}</div>
      ) : orders.length === 0 ? (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">{t("ownerOrdersTab.empty")}</div>
      ) : (
        <>
          <div className="mb-3 flex justify-end">
            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-pressed={viewMode === "list"}
                aria-label={t("ownerOrdersTab.viewList")}
                title={t("ownerOrdersTab.viewList")}
                className={`rounded-md p-1.5 transition-colors cursor-pointer ${
                  viewMode === "list"
                    ? "bg-brand-500 text-white"
                    : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("card")}
                aria-pressed={viewMode === "card"}
                aria-label={t("ownerOrdersTab.viewCard")}
                title={t("ownerOrdersTab.viewCard")}
                className={`rounded-md p-1.5 transition-colors cursor-pointer ${
                  viewMode === "card"
                    ? "bg-brand-500 text-white"
                    : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className={viewMode === "card" ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>
          {orders.map((o) => {
            const tableNum = o?.restaurant_tables?.table_number;
            const where =
              o.channel === "dine_in"
                ? t("ownerOrdersTab.channel.dineIn", { number: tableNum ?? "?" })
                : o.channel === "delivery"
                ? t("ownerOrdersTab.channel.delivery")
                : t("ownerOrdersTab.channel.pickup");
            const meta = CHANNEL_META[o.channel] || CHANNEL_META.dine_in;
            const ChannelIcon = meta.icon;

            return (
              <div
                key={o.id}
                className={
                  viewMode === "card"
                    ? `flex flex-col gap-3 rounded-2xl border border-l-4 border-gray-200 bg-white p-4 shadow-theme-xs transition-all duration-200 hover:border-gray-300 hover:shadow-theme-md dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700 ${meta.accent}`
                    : `flex flex-col gap-3 rounded-2xl border border-l-4 border-gray-200 bg-white p-4 shadow-theme-xs transition-all duration-200 hover:border-gray-300 hover:shadow-theme-md dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700 md:flex-row md:items-center md:justify-between ${meta.accent}`
                }
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    title={where}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.badge}`}
                  >
                    <ChannelIcon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-800 dark:text-white/90">{t("ownerOrdersTab.orderLabel")}</p>
                      <span className={`${pillClass} ${channelTint}`}>{where}</span>
                      <span className={`${pillClass} ${STATUS_TINTS[o.status] || STATUS_TINTS.new}`}>
                        {o.status && STATUS_LABELS[o.status] ? t(`status.${o.status}`) : o.status}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(o.created_at)} • {t("ownerOrdersTab.totalLabel", { amount: Number(o.total || 0).toFixed(2) })}
                    </p>

                    {(o.customer_phone || o.delivery_address) && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {o.customer_phone ? `📞 ${o.customer_phone}` : ""}{" "}
                        {o.delivery_address ? `• 📍 ${o.delivery_address}` : ""}
                      </p>
                    )}

                    {o.notes && (
                      <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-semibold text-gray-800 dark:text-white/90">{t("ownerOrdersTab.notesLabel")}</span> {o.notes}
                      </p>
                    )}

                    <div className="break-all text-xs text-gray-400 dark:text-gray-500 mt-1">{o.id}</div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <select
                    value=""
                    onChange={(e) => handleStatusPick(o, e.target.value)}
                    disabled={updatingId === o.id}
                    className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-semibold dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="" disabled>
                      {updatingId === o.id ? t("ownerOrdersTab.updating") : t("ownerOrdersTab.changeStatus")}
                    </option>
                    {ALL_STATUSES.filter((s) => s !== o.status).map((s) => (
                      <option key={s} value={s}>
                        {t(`status.${s}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
          </div>
        </>
      )}
    </div>
  );
}
