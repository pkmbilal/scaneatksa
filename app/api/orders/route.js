import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthedUserId } from "@/lib/r2/auth";
import { normalizeSaudiWhatsAppNumber } from "@/lib/whatsapp";

export const runtime = "nodejs";

const MAX_NAME_LENGTH = 100;
const MAX_TEXT_LENGTH = 500; // notes, delivery address

// create_order() raises these keys (see supabase/migrations/*_create_order_function.sql).
// It does every DB-dependent check -- restaurant published/not suspended,
// channel enabled, table active, items on this menu and available,
// quantities 1..99, no duplicates -- and inserts the order + its items in one
// transaction, so a failure never leaves an item-less order behind.
const RPC_ERRORS = {
  invalid_channel: ["Invalid checkout request.", 400],
  restaurant_unavailable: ["This restaurant is currently unavailable.", 404],
  channel_unavailable: ["This ordering option is no longer available for this restaurant.", 400],
  invalid_table: ["This table QR code is no longer active. Please scan it again.", 400],
  invalid_cart: ["Your cart is empty or invalid.", 400],
  invalid_quantity: ["One or more cart quantities are invalid.", 400],
  duplicate_item: ["Duplicate cart items are not allowed.", 400],
};

function errorResponse(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function rpcErrorResponse(error) {
  const message = error?.message || "";

  if (message.startsWith("item_unavailable")) {
    const name = message.slice("item_unavailable:".length).trim();
    return errorResponse(
      name ? `${name} is currently unavailable.` : "An item in your cart is no longer on the menu."
    );
  }

  const known = RPC_ERRORS[message];
  if (known) return errorResponse(...known);

  console.error("create_order failed:", error);
  return errorResponse("Unable to place the order right now.", 500);
}

const cleanText = (value, max) => {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > max ? null : text;
};

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    const { restaurantSlug, channel, tableCode, items, customer, notes } = body || {};

    if (!restaurantSlug || typeof restaurantSlug !== "string") {
      return errorResponse("Invalid checkout request.");
    }
    if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
      return errorResponse("Your cart is empty or too large.");
    }

    // Every channel needs a reachable WhatsApp number (mirrors the cart's
    // validateBeforePlace); delivery also needs an address.
    const phoneDigits = normalizeSaudiWhatsAppNumber(customer?.phone);
    if (phoneDigits.length < 9 || phoneDigits.length > 15) {
      return errorResponse("Valid WhatsApp number is required");
    }

    const name = cleanText(customer?.name, MAX_NAME_LENGTH);
    const address = cleanText(customer?.address, MAX_TEXT_LENGTH);
    const cleanNotes = cleanText(notes, MAX_TEXT_LENGTH);
    if (name === null || address === null || cleanNotes === null) {
      return errorResponse("Some order details are too long.");
    }
    if (channel === "delivery" && !address) {
      return errorResponse("Delivery address is required.");
    }

    // Optional: attach the order to the signed-in customer.
    let userId = null;
    if (req.headers.get("authorization")) {
      ({ userId } = await getAuthedUserId(req));
    }

    const { data, error } = await supabaseAdmin
      .rpc("create_order", {
        p_restaurant_slug: restaurantSlug,
        p_channel: channel,
        p_table_code: channel === "dine_in" ? tableCode || null : null,
        p_items: items.map((item) => ({ id: item?.id, quantity: item?.quantity })),
        p_customer_name: name,
        p_customer_phone: String(customer.phone).trim(),
        p_delivery_address: address,
        p_notes: cleanNotes,
        p_user_id: userId || null,
      })
      .single();

    if (error || !data) return rpcErrorResponse(error);

    return NextResponse.json({ ok: true, orderId: data.order_id, tableNumber: data.table_number });
  } catch (err) {
    console.error("POST /api/orders failed:", err);
    return errorResponse("Unable to place the order right now.", 500);
  }
}
