"use client";

const channelTint = "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

const orderStatusTint = {
  pending: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
  confirmed: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400",
  preparing: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400",
  ready: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  completed: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  cancelled: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
};

const pillClass = "text-xs px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap";

export default function OwnerOrdersTab({ restaurant, orders, ordersLoading }) {
  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
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

            return (
              <div
                key={o.id}
                className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-800 dark:text-white/90">Order</p>
                    <span className={`${pillClass} ${channelTint}`}>{where}</span>
                    <span className={`${pillClass} ${orderStatusTint[o.status] || orderStatusTint.pending}`}>
                      {o.status}
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
                </div>

                <div className="break-all text-xs text-gray-400 dark:text-gray-500">{o.id}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
