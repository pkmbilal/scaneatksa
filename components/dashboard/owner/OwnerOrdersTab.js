"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { STATUS_LABELS, STATUS_TINTS, CHANNEL_META, channelTint, pillClass } from "@/lib/orderStatus";
import { notifyStatusChange } from "@/lib/whatsappClient";

const ALL_STATUSES = Object.keys(STATUS_LABELS);

export default function OwnerOrdersTab({ restaurant, orders, ordersLoading, onStatusChange }) {
  const t = useTranslations("dashboard.owner");
  const [updatingId, setUpdatingId] = useState(null);

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
          <div className="space-y-3">
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
                className={`flex flex-col gap-3 rounded-2xl border border-l-4 border-gray-200 bg-white p-4 shadow-theme-xs transition-all duration-200 hover:border-gray-300 hover:shadow-theme-md dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700 md:flex-row md:items-center md:justify-between ${meta.accent}`}
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

                    {o.order_items?.length > 0 && (
                      <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
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
                    )}

                    <p className="mt-2 border-t border-gray-100 pt-2 text-sm font-semibold text-gray-800 dark:border-gray-800 dark:text-white/90">
                      {t("ownerOrdersTab.totalLabel", { amount: Number(o.total || 0).toFixed(2) })}
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
