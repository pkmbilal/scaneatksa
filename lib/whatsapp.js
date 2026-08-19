// Shared WhatsApp deep-link helpers. No Business API integration yet -- every
// "send" is a wa.me link that a human (customer, kitchen, waiter, or owner)
// opens and presses send on themselves. Centralized here so the automated
// Business API integration can later replace just this file's internals
// without touching every call site.

export function normalizeSaudiWhatsAppNumber(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("05") && digits.length === 10) {
    digits = "966" + digits.slice(1);
  } else if (digits.startsWith("5") && digits.length === 9) {
    digits = "966" + digits;
  }
  return digits;
}

// Returns a wa.me URL for the given phone + plain-text message, or null if
// the phone number doesn't normalize to a usable Saudi WhatsApp number.
export function buildWhatsAppLink(phone, message) {
  const normalized = normalizeSaudiWhatsAppNumber(phone);
  if (!normalized) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
