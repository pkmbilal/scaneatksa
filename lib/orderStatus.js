// Single source of truth for order status vocabulary, per-role transition
// rules, and the canned WhatsApp update sent at each customer-facing stage.
// Shared by the owner/customer/kitchen/waiter UIs and the status API route
// so the rules never drift between the client and the server.
import { UtensilsCrossed, Bike, ShoppingBag } from "lucide-react";
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

// Solid dot color per status, used next to the status label in the owner's
// status-change dropdown (same color families as STATUS_TINTS above, just
// a solid swatch instead of a tinted pill).
export const STATUS_DOT = {
  new: "bg-warning-500",
  accepted: "bg-brand-500",
  preparing: "bg-brand-500",
  ready: "bg-success-500",
  delivered: "bg-success-500",
  completed: "bg-success-500",
  cancelled: "bg-error-500",
};

// Shared badge/card styling for the order channel (dine-in/delivery/pickup),
// used by the customer, owner, and kitchen/waiter order cards so all three
// surfaces render the same colored accent border + icon badge per channel.
export const CHANNEL_META = {
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

export const channelTint = "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
export const pillClass = "text-xs px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap";

// The two statuses that mean "this order is done" -- revenue is realized
// (used by analytics to count actual revenue vs. still-in-flight orders)
// and a customer is allowed to leave a review against it (verified purchase
// gate enforced again server-side by the reviews_insert_own RLS policy).
export const REVENUE_STATUSES = ["delivered", "completed"];

// Who is allowed to move an order from `from` to `to`. Owner is a safety-valve
// override -- any transition except a no-op, including cancel. Kitchen and
// waiter each own one slice of the lifecycle matching their dashboard queue:
// kitchen's queue is `new` + `preparing`, so kitchen both starts an order and
// marks the food ready; waiter's queue is `ready` only, so waiter just hands
// the finished order over to the customer.
export function canTransition(role, from, to) {
  if (!from || !to || from === to) return false;
  if (role === "owner") return true;
  if (role === "kitchen") {
    return (from === "new" && to === "preparing") || (from === "preparing" && to === "ready");
  }
  if (role === "waiter") return from === "ready" && to === "delivered";
  return false;
}

// Restaurant-facing action button label for the next transition a role can
// make on an order currently in `status`. Returns null if that role has no
// action available on this order.
export function nextActionFor(role, status) {
  if (role === "kitchen" && status === "new") return { to: "preparing", label: "Start Preparing" };
  if (role === "kitchen" && status === "preparing") return { to: "ready", label: "Mark Ready" };
  if (role === "waiter" && status === "ready") return { to: "delivered", label: "Mark Delivered" };
  return null;
}

// Every status has a canned customer-facing WhatsApp message so a change to
// any of the 7 statuses can auto-notify the customer.
const NOTIFY_STAGE_FOR_STATUS = {
  new: "received",
  accepted: "accepted",
  preparing: "preparing",
  ready: "ready",
  delivered: "delivered",
  cancelled: "cancelled",
  completed: "completed",
};

function messageForStage(stage, order, restaurantName) {
  const greeting = order.customer_name ? `Hi ${order.customer_name}! ` : "Hi! ";
  const place = restaurantName ? ` at ${restaurantName}` : "";

  switch (stage) {
    case "received":
      return `${greeting}Your order${place} has been received. 🧾 We'll let you know as soon as it's being prepared.`;
    case "accepted":
      return `${greeting}Your order${place} has been accepted and will be prepared shortly. 👍`;
    case "preparing":
      return `${greeting}Good news — your order${place} is now being prepared. 👨‍🍳 We'll notify you when it's ready.`;
    case "ready":
      return `${greeting}Your order${place} is ready! 🍽️ It'll be with you shortly.`;
    case "delivered":
      return `${greeting}Your order${place} has been delivered. 🎉 Enjoy your meal, and thank you for ordering with us!`;
    case "cancelled":
      return `${greeting}We're sorry, but your order${place} has been cancelled. Please contact us if you have any questions.`;
    case "completed":
      return `${greeting}Your order${place} is complete. 🙏 Thank you for choosing us — we hope to see you again soon!`;
    default:
      return `${greeting}Your order${place} status is now: ${STATUS_LABELS[order.status] || order.status}.`;
  }
}

// Returns a wa.me link for the customer-facing message matching this order's
// current status, or null if there's no usable phone number on the order.
export function buildStatusWhatsAppMessage(order, restaurantName) {
  const stage = NOTIFY_STAGE_FOR_STATUS[order?.status];
  if (!stage) return null;
  const message = messageForStage(stage, order, restaurantName);
  return buildWhatsAppLink(order?.customer_phone, message);
}
