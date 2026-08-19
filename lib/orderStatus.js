// Single source of truth for order status vocabulary, per-role transition
// rules, and the canned WhatsApp update sent at each customer-facing stage.
// Shared by the owner/customer/kitchen/waiter UIs and the status API route
// so the rules never drift between the client and the server.
import { buildWhatsAppLink } from "@/lib/whatsapp";

export const STATUS_LABELS = {
  new: "New",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
  completed: "Completed",
};

export const STATUS_TINTS = {
  new: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
  accepted: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400",
  preparing: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400",
  ready: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  delivered: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  completed: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  cancelled: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
};

// The customer-visible progress line (terminal states `cancelled`/`completed`
// are shown separately, not as a step on this line).
export const CUSTOMER_PROGRESS_STEPS = ["new", "preparing", "delivered"];

// Who is allowed to move an order from `from` to `to`. Owner is a safety-valve
// override -- any transition except a no-op, including cancel. Kitchen and
// waiter each own one slice of the lifecycle matching their dashboard queue:
// kitchen's queue is `new` only, so kitchen effectively accepts + starts an
// order in one action; waiter's queue is `preparing` + `ready`, so waiter
// both marks food ready and hands it over.
export function canTransition(role, from, to) {
  if (!from || !to || from === to) return false;
  if (role === "owner") return true;
  if (role === "kitchen") return from === "new" && to === "preparing";
  if (role === "waiter") {
    return (from === "preparing" && to === "ready") || (from === "ready" && to === "delivered");
  }
  return false;
}

// Restaurant-facing action button label for the next transition a role can
// make on an order currently in `status`. Returns null if that role has no
// action available on this order.
export function nextActionFor(role, status) {
  if (role === "kitchen" && status === "new") return { to: "preparing", label: "Start Preparing" };
  if (role === "waiter" && status === "preparing") return { to: "ready", label: "Mark Ready" };
  if (role === "waiter" && status === "ready") return { to: "delivered", label: "Mark Delivered" };
  return null;
}

// Only these transitions fire a customer-facing WhatsApp message -- matches
// the 3-stage flow the customer actually cares about (received / preparing /
// delivered). The intermediate `ready` handoff is staff-only.
const NOTIFY_STAGE_FOR_STATUS = {
  new: "received",
  preparing: "preparing",
  delivered: "delivered",
};

function messageForStage(stage, order, restaurantName) {
  const greeting = order.customer_name ? `Hi ${order.customer_name}! ` : "Hi! ";
  const place = restaurantName ? ` at ${restaurantName}` : "";

  switch (stage) {
    case "received":
      return `${greeting}Your order${place} has been received. 🧾 We'll let you know as soon as it's being prepared.`;
    case "preparing":
      return `${greeting}Good news — your order${place} is now being prepared. 👨‍🍳 We'll notify you when it's ready.`;
    case "delivered":
      return `${greeting}Your order${place} has been delivered. 🎉 Enjoy your meal, and thank you for ordering with us!`;
    default:
      return `${greeting}Your order${place} status is now: ${STATUS_LABELS[order.status] || order.status}.`;
  }
}

// Returns a wa.me link for the customer-facing message matching this order's
// current status, or null if there's no canned message for that status (e.g.
// `ready`, `accepted`, `cancelled`) or no usable phone number on the order.
export function buildStatusWhatsAppMessage(order, restaurantName) {
  const stage = NOTIFY_STAGE_FOR_STATUS[order?.status];
  if (!stage) return null;
  const message = messageForStage(stage, order, restaurantName);
  return buildWhatsAppLink(order?.customer_phone, message);
}
