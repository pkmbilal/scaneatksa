"use client";

import { useState } from "react";
import { STATUS_LABELS, STATUS_TINTS, nextActionFor, buildStatusWhatsAppMessage } from "@/lib/orderStatus";

const channelTint = "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
const pillClass = "text-xs px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap";

// Shared work-queue view for kitchen/waiter dashboards -- each order shows
// its single next action for that role (from lib/orderStatus.nextActionFor)
// plus a WhatsApp resend link when the resulting status has a canned
// customer message.
export default function OrderQueue({ role, restaurantName, orders, loading, onAction }) {
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
      await onAction?.(order.id, toStatus);
    } finally {
      setActingId(null);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500 dark:text-gray-400">Loading orders…</div>;
  }

  if (!orders?.length) {
    return <div className="py-12 text-center text-gray-500 dark:text-gray-400">No orders in your queue.</div>;
  }

  return (
    <div className="space-y-3">
      {orders.map((o) => {
        const tableNum = o?.restaurant_tables?.table_number;
        const where =
          o.channel === "dine_in" ? `Table ${tableNum ?? "?"}` : o.channel === "delivery" ? "Delivery" : "Pickup";

        const action = nextActionFor(role, o.status);
        const whatsappLink = buildStatusWhatsAppMessage({ ...o, status: action?.to || o.status }, restaurantName);

        return (
          <div
            key={o.id}
            className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800 md:flex-row md:items-center md:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-gray-800 dark:text-white/90">Order</p>
                <span className={`${pillClass} ${channelTint}`}>{where}</span>
                <span className={`${pillClass} ${STATUS_TINTS[o.status] || STATUS_TINTS.new}`}>
                  {STATUS_LABELS[o.status] || o.status}
                </span>
              </div>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {formatDate(o.created_at)} • Total: SAR {Number(o.total || 0).toFixed(2)}
              </p>

              {o.notes && (
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold text-gray-800 dark:text-white/90">Notes:</span> {o.notes}
                </p>
              )}
            </div>

            {action && (
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAction(o, action.to)}
                  disabled={actingId === o.id}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
                >
                  {actingId === o.id ? "Updating…" : action.label}
                </button>

                {whatsappLink && (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-success-50 px-2.5 py-2 text-xs font-semibold text-success-700 hover:bg-success-100 dark:bg-success-500/15 dark:text-success-400"
                  >
                    WhatsApp update
                  </a>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
