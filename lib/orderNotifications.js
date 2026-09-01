// Pure (no React) helpers that turn a Supabase `orders` realtime event into a
// role-relevant notification, plus the copy for rendering it. Shared by every
// dashboard's alert layer (`useOrderAlerts`) so the "is this worth alerting
// <role> about?" rules live in one place, next to lib/orderStatus.js.
//
// Note on payloads: `public.orders` uses the default replica identity, so a
// realtime UPDATE's `old` record carries only the primary key -- `prev.status`
// is usually undefined. That's fine here: the only writer of `status` is the
// PATCH /api/orders/[id]/status route (it always sets a new value), and
// `notificationKey` de-dupes a burst of "*" events for the same row + status.

// Statuses a customer is told about -- progress on an order they placed. We skip
// `new` (they just placed it) and `accepted` (internal, not customer-facing).
const CUSTOMER_ALERT_STATUSES = new Set([
  "preparing",
  "ready",
  "delivered",
  "completed",
  "cancelled",
]);

// Status changes an owner is alerted about on an existing order.
const OWNER_ALERT_STATUSES = new Set(["ready", "delivered", "cancelled"]);

// classifyOrderEvent({ role, eventType, next, prev }) -> notification | null
//   kind "new"    -> a brand-new order landed in the restaurant
//   kind "ready"  -> an order became ready to serve (waiter's cue)
//   kind "status" -> some other tracked status change on an existing order
export function classifyOrderEvent({ role, eventType, next, prev }) {
  if (!role || !next || !next.status) return null;

  const status = next.status;
  const changed = status !== prev?.status;

  switch (role) {
    case "kitchen": {
      if (status !== "new") return null;
      if (eventType === "INSERT") return build("new", next);
      if (eventType === "UPDATE" && changed) return build("new", next);
      return null;
    }
    case "waiter": {
      if (eventType === "UPDATE" && changed && status === "ready") {
        return build("ready", next);
      }
      return null;
    }
    case "owner": {
      if (eventType === "INSERT") return build("new", next);
      if (eventType === "UPDATE" && changed && OWNER_ALERT_STATUSES.has(status)) {
        return build("status", next);
      }
      return null;
    }
    case "customer": {
      if (eventType === "UPDATE" && changed && CUSTOMER_ALERT_STATUSES.has(status)) {
        return build("status", next);
      }
      return null;
    }
    default:
      return null;
  }
}

function build(kind, row) {
  return {
    kind,
    status: row.status,
    orderId: row.id,
    total: row.total ?? null,
    currency: row.currency || "SAR",
    createdAt: new Date().toISOString(),
  };
}

// Stable identity for de-duping a burst of "*" events for the same row + status.
export function notificationKey(item) {
  return `${item.orderId}:${item.status}`;
}

// Short, human-friendly order reference from the uuid.
export function shortOrderRef(orderId) {
  return String(orderId || "").slice(0, 8).toUpperCase();
}

function formatAmount(total, currency) {
  const n = Number(total);
  if (!Number.isFinite(n)) return null;
  const value = Number.isInteger(n) ? String(n) : n.toFixed(2);
  return `${value} ${currency || "SAR"}`;
}

// notificationCopy(item, t) -> { title, body }
// `t` must be the `dashboard.common` translator.
export function notificationCopy(item, t) {
  const ref = t("notifications.order.ref", { ref: shortOrderRef(item.orderId) });

  if (item.kind === "new") {
    const amount = formatAmount(item.total, item.currency);
    return {
      title: t("notifications.order.newTitle"),
      body: amount
        ? t("notifications.order.newBody", { amount })
        : t("notifications.order.newBodyNoAmount"),
    };
  }

  if (item.kind === "ready") {
    return { title: t("notifications.order.readyTitle"), body: ref };
  }

  return {
    title: t("notifications.order.statusTitle", { status: t(`status.${item.status}`) }),
    body: ref,
  };
}

// Maps a stored notification to the generic shape NotificationDropdown renders.
export function notificationToItem(notification, t) {
  const { title } = notificationCopy(notification, t);
  return {
    id: notification.id,
    title,
    subtitle: t("notifications.order.ref", {
      ref: shortOrderRef(notification.orderId),
    }),
    timestamp: notification.createdAt,
  };
}
