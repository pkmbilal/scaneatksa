"use client";

import { toast } from "sonner";
import { buildStatusWhatsAppMessage } from "@/lib/orderStatus";

// wa.me has no background-send mode -- WhatsApp always requires a human to
// press Send inside the chat itself. This is the closest to "automatic" a
// non-Business-API integration allows: auto-open the pre-filled chat instead
// of requiring a separate manual button click, with a toast confirming what
// happened. Call this right after a status-change API call succeeds, passing
// the updated order it returned.
export function notifyStatusChange(order, restaurantName) {
  if (!order) return;

  const link = buildStatusWhatsAppMessage(order, restaurantName);
  if (!link) {
    toast.info("Status updated. No customer phone on file — WhatsApp message not sent.");
    return;
  }

  const win = window.open(link, "_blank", "noopener,noreferrer");
  if (win) {
    toast.success("Status updated — WhatsApp update opened in a new tab. Press Send to notify the customer.");
  } else {
    toast.warning("Status updated, but the browser blocked the WhatsApp tab.", {
      action: { label: "Open WhatsApp", onClick: () => window.open(link, "_blank", "noopener,noreferrer") },
    });
  }
}
