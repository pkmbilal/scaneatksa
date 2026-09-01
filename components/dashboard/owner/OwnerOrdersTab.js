"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { List, LayoutGrid } from "lucide-react";
import { STATUS_LABELS, STATUS_TINTS, STATUS_DOT, CHANNEL_META, channelTint, pillClass } from "@/lib/orderStatus";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { notifyStatusChange } from "@/lib/whatsappClient";
import { filterOrdersByRange } from "@/components/dashboard/owner/lib/ordersDateRange";

const ALL_STATUSES = Object.keys(STATUS_LABELS);

export default function OwnerOrdersTab({ restaurant, orders, ordersLoading, onStatusChange, range = "all" }) {
  const t = useTranslations("dashboard.owner");
  const [updatingId, setUpdatingId] = useState(null);
  const [viewMode, setViewMode] = useState("card");

  const visibleOrders = useMemo(() => filterOrdersByRange(orders, range), [orders, range]);

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
      ) : visibleOrders.length === 0 ? (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
          {orders.length === 0 ? t("ownerOrdersTab.empty") : t("ownerOrdersTab.emptyFiltered")}
        </div>
      ) : (
        <>
          <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
            {t("ownerOrdersTab.count", { n: visibleOrders.length })}
          </p>
          <div className="mb-3 hidden justify-end md:flex">
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
          {visibleOrders.map((o) => {
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
                className={`flex flex-col gap-3 rounded-2xl border border-l-4 border-gray-200 bg-white p-4 shadow-theme-xs transition-all duration-200 hover:border-gray-300 hover:shadow-theme-md dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700 ${
                  viewMode === "list" ? "md:flex-row md:items-center md:justify-between" : ""
                } ${meta.accent}`}
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
                      {formatDate(o.created_at)}
                    </p>

                    {(o.customer_name || o.customer_phone || o.delivery_address) && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {[
                          o.customer_name ? `👤 ${o.customer_name}` : null,
                          o.customer_phone ? `📞 ${o.customer_phone}` : null,
                          o.delivery_address ? `📍 ${o.delivery_address}` : null,
                        ]
                          .filter(Boolean)
                          .join("  •  ")}
                      </p>
                    )}

                    <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-white/[0.02]">
                      {o.order_items?.length > 0 && (
                        <>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            {t("ownerOrdersTab.itemsHeading")}
                          </p>
                          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                            {o.order_items.map((item) => (
                              <li key={item.id} className="flex items-start justify-between gap-3">
                                <span className="min-w-0">
                                  {item.name}{" "}
                                  <span className="text-gray-400 dark:text-gray-500">
                                    {t("ownerOrdersTab.itemUnit", {
                                      qty: item.quantity,
                                      price: Number(item.price).toFixed(2),
                                    })}
                                  </span>
                                </span>
                                <span className="shrink-0 tabular-nums text-gray-700 dark:text-gray-300">
                                  {t("common.price", {
                                    amount: (Number(item.price) * Number(item.quantity)).toFixed(2),
                                  })}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                      <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2 text-sm font-semibold text-gray-800 dark:border-gray-700 dark:text-white/90">
                        <span>{t("ownerOrdersTab.totalWord")}</span>
                        <span className="tabular-nums">
                          {t("common.price", { amount: Number(o.total || 0).toFixed(2) })}
                        </span>
                      </div>
                    </div>

                    {o.notes && (
                      <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-semibold text-gray-800 dark:text-white/90">{t("ownerOrdersTab.notesLabel")}</span> {o.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Select
                    value=""
                    onValueChange={(next) => handleStatusPick(o, next)}
                    disabled={updatingId === o.id}
                  >
                    <SelectTrigger
                      className={`h-auto w-fit cursor-pointer gap-1.5 rounded-full border-0 px-2.5 py-1.5 text-xs font-semibold shadow-none ${STATUS_TINTS[o.status] || STATUS_TINTS.new}`}
                      aria-label={t("ownerOrdersTab.changeStatus")}
                    >
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[o.status] || STATUS_DOT.new}`} />
                      {updatingId === o.id ? t("ownerOrdersTab.updating") : t(`status.${o.status}`)}
                    </SelectTrigger>
                    <SelectContent position="popper" align="end">
                      {ALL_STATUSES.filter((s) => s !== o.status).map((s) => (
                        <SelectItem key={s} value={s} className="cursor-pointer">
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[s]}`} />
                          {t(`status.${s}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
