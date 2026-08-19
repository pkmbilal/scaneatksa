"use client";

import { useState } from "react";
import { STATUS_LABELS, STATUS_TINTS, buildStatusWhatsAppMessage } from "@/lib/orderStatus";

const channelTint = "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
const pillClass = "text-xs px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap";

const ALL_STATUSES = Object.keys(STATUS_LABELS);

export default function OwnerOrdersTab({ restaurant, orders, ordersLoading, onStatusChange }) {
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
      await onStatusChange?.(order.id, nextStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      {ordersLoading ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading orders…</div>
      ) : orders.length === 0 ? (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">No orders yet.</div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const tableNum = o?.restaurant_tables?.table_number;
            const where =
              o.channel === "dine_in"
                ? `Table ${tableNum ?? "?"}`
                : o.channel === "delivery"
                ? "Delivery"
                : "Pickup";

            const whatsappLink = buildStatusWhatsAppMessage(o, restaurant?.name);

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

                  {(o.customer_phone || o.delivery_address) && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {o.customer_phone ? `📞 ${o.customer_phone}` : ""}{" "}
                      {o.delivery_address ? `• 📍 ${o.delivery_address}` : ""}
                    </p>
                  )}

                  {o.notes && (
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-semibold text-gray-800 dark:text-white/90">Notes:</span> {o.notes}
                    </p>
                  )}

                  <div className="break-all text-xs text-gray-400 dark:text-gray-500 mt-1">{o.id}</div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <select
                    value=""
                    onChange={(e) => handleStatusPick(o, e.target.value)}
                    disabled={updatingId === o.id}
                    className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-semibold dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="" disabled>
                      {updatingId === o.id ? "Updating…" : "Change status"}
                    </option>
                    {ALL_STATUSES.filter((s) => s !== o.status).map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>

                  {whatsappLink && (
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-success-50 px-2.5 py-1.5 text-xs font-semibold text-success-700 hover:bg-success-100 dark:bg-success-500/15 dark:text-success-400"
                    >
                      Send WhatsApp update
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
