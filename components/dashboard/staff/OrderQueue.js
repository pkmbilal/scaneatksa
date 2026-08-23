"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { UtensilsCrossed, Bike, ShoppingBag } from "lucide-react";
import { STATUS_LABELS, STATUS_TINTS, nextActionFor } from "@/lib/orderStatus";
import { notifyStatusChange } from "@/lib/whatsappClient";

const channelTint = "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
const pillClass = "text-xs px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap";

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

// Translation key (under dashboard.staff) for the role-specific label of the
// next action a role can take on an order in `status`. Mirrors
// lib/orderStatus.nextActionFor's role/status combinations, but the display
// text itself is owned here so it can be localized without touching the
// shared state-machine source of truth.
function actionLabelKey(role, status) {
  if (role === "kitchen" && status === "new") return "kitchen.actions.startPreparing";
  if (role === "kitchen" && status === "preparing") return "kitchen.actions.markReady";
  if (role === "waiter" && status === "ready") return "waiter.actions.markDelivered";
  return null;
}

// Shared work-queue view for kitchen/waiter dashboards -- each order shows
// its single next action for that role (from lib/orderStatus.nextActionFor).
// On success, the canned WhatsApp update for the new status auto-opens (see
// lib/whatsappClient.notifyStatusChange).
export default function OrderQueue({ role, restaurantName, orders, loading, onAction }) {
  const t = useTranslations("dashboard.staff");
  const [actingId, setActingId] = useState(null);

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const handleAction = async (order, toStatus) => {
    setActingId(order.id);
    try {
      const updated = await onAction?.(order.id, toStatus);
      notifyStatusChange(updated, restaurantName);
    } finally {
      setActingId(null);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500 dark:text-gray-400">{t("queue.loading")}</div>;
  }

  if (!orders?.length) {
    return <div className="py-12 text-center text-gray-500 dark:text-gray-400">{t("queue.empty")}</div>;
  }

  return (
    <div className="space-y-3">
      {orders.map((o) => {
        const tableNum = o?.restaurant_tables?.table_number;
        const where =
          o.channel === "dine_in"
            ? t("queue.channel.dineIn", { table: tableNum ?? "?" })
            : o.channel === "delivery"
              ? t("queue.channel.delivery")
              : t("queue.channel.pickup");

        const action = nextActionFor(role, o.status);
        const labelKey = actionLabelKey(role, o.status);
        // STATUS_LABELS keys (lib/orderStatus.js) are the state-machine
        // vocabulary and stay untouched -- only the rendered text is
        // localized here, falling back to the shared English label for any
        // status without a dedicated translation.
        const statusKey = `queue.status.${o.status}`;
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
                  <p className="font-semibold text-gray-800 dark:text-white/90">{t("queue.orderLabel")}</p>
                  <span className={`${pillClass} ${channelTint}`}>{where}</span>
                  <span className={`${pillClass} ${STATUS_TINTS[o.status] || STATUS_TINTS.new}`}>
                    {STATUS_LABELS[o.status] ? t(statusKey) : o.status}
                  </span>
                </div>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(o.created_at)} • {t("queue.total", { amount: Number(o.total || 0).toFixed(2) })}
                </p>

                {o.notes && (
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-semibold text-gray-800 dark:text-white/90">{t("queue.notesLabel")}</span>{" "}
                    {o.notes}
                  </p>
                )}
              </div>
            </div>

            {action && (
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAction(o, action.to)}
                  disabled={actingId === o.id}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
                >
                  {actingId === o.id ? t("queue.updating") : labelKey ? t(labelKey) : action.label}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
