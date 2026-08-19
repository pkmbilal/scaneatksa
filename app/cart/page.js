"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/app/CartContext";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  ShoppingCart,
  Store,
  Trash2,
  Plus,
  Minus,
  MessageCircle,
  BadgeCheck,
  Clipboard,
  MapPin,
  Bike,
  UtensilsCrossed,
  Copy,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { normalizeSaudiWhatsAppNumber } from "@/lib/whatsapp";
import { supabaseBrowser } from "@/lib/supabase/client";

const supabase = supabaseBrowser();

function createCheckoutReference() {
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return "SE-" + stamp + "-" + random;
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

export default function CartPage() {
  const {
    cartItems,
    restaurant,
    updateQuantity,
    removeFromCart,
    totalPrice,
    clearCart,
    cartReady,
  } = useCart();

  const [tableCode, setTableCode] = useState(null);
  const [tableNumber, setTableNumber] = useState(null); // ✅ NEW: resolved table number
  const [channel, setChannel] = useState("pickup"); // dine_in | pickup | delivery
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState("");
  const [whatsappOpened, setWhatsAppOpened] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedOrder, setSavedOrder] = useState(null); // { orderId, loggedIn }
  const checkoutSnapshotRef = useRef(null);

  const router = useRouter();

  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  );

  const money = (v) => `SAR ${Number(v || 0).toFixed(2)}`;

  // ✅ Step 1: Read `t` from Cart URL immediately
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const t = sp.get("t");
    if (t) setTableCode(t);
  }, []);

  // ✅ Step 2: Prefer `t` from URL, else localStorage fallback, persist back
  useEffect(() => {
    if (!restaurant?.slug) return;
    if (typeof window === "undefined") return;

    const key = `tableCode:${restaurant.slug}`;
    const sp = new URLSearchParams(window.location.search);

    const tFromUrl = sp.get("t");
    const stored = localStorage.getItem(key);
    const code = tFromUrl || tableCode || stored || null;

    if (code) localStorage.setItem(key, code);
    setTableCode(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant?.slug]);

  // ✅ Decide channel based on tableCode + restaurant capabilities
  useEffect(() => {
    if (!restaurant) return;

    if (tableCode) {
      setChannel("dine_in");
      return;
    }

    if (restaurant?.pickup_available) setChannel("pickup");
    else if (restaurant?.delivery_available) setChannel("delivery");
    else setChannel("pickup");
  }, [tableCode, restaurant]);

  const isDineIn = !!tableCode;

  // ✅ NEW: resolve table number from server (tableCode -> table_number)
  useEffect(() => {
    if (!isDineIn || !tableCode || !restaurant?.id) {
      setTableNumber(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/table/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            restaurantId: restaurant.id,
            tableCode,
          }),
        });

        const data = await res.json();
        if (!res.ok) return;
        if (!cancelled) setTableNumber(data?.tableNumber ?? null);
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isDineIn, tableCode, restaurant?.id]);

  const menuHref = useMemo(() => {
    if (!restaurant?.slug) return "/";
    return isDineIn
      ? `/menu/${restaurant.slug}?t=${encodeURIComponent(tableCode)}`
      : `/menu/${restaurant.slug}`;
  }, [restaurant?.slug, isDineIn, tableCode]);

  const restaurantPhone = useMemo(() => {
    return normalizeSaudiWhatsAppNumber(restaurant?.phone);
  }, [restaurant?.phone]);

  const getCheckoutSnapshot = () => {
    if (!checkoutSnapshotRef.current) {
      checkoutSnapshotRef.current = {
        reference: createCheckoutReference(),
        createdAt: new Date(),
      };
    }
    return checkoutSnapshotRef.current;
  };

  const generateWhatsAppMessage = (resolvedTableNumber = tableNumber) => {
    const checkout = getCheckoutSnapshot();
    let message = `*NEW ORDER*\n`;
    message += `━━━━━━━━━━━━━━\n`;
    message += `*Reference:* ${checkout.reference}\n`;
    message += `*Time:* ${checkout.createdAt.toLocaleString("en-SA", {
      timeZone: "Asia/Riyadh",
    })}\n`;

    // Restaurant + type
    if (restaurant?.name) message += `*Restaurant:* ${restaurant.name}\n`;

    const typeLabel = isDineIn
      ? "Dine-in"
      : channel === "delivery"
        ? "Delivery"
        : "Pickup";

    message += `*Type:* ${typeLabel}\n`;

    // Table (dine-in)
    if (isDineIn) {
      message += `*Table:* ${resolvedTableNumber ? `Table ${resolvedTableNumber}` : "Table ?"}\n`;
    }

    // Customer details (online)
    if (!isDineIn) {
      if (customerName?.trim()) message += `*Name:* ${customerName.trim()}\n`;
      if (customerPhone?.trim())
        message += `*Phone:* ${customerPhone.trim()}\n`;
      if (channel === "delivery" && deliveryAddress?.trim()) {
        message += `*Address:* ${deliveryAddress.trim()}\n`;
      }
    }

    // Divider
    message += `\n━━━━━━━━━━━━━━\n`;
    message += `*ITEMS*\n`;

    // Items list
    cartItems.forEach((item, idx) => {
      const lineTotal = money(item.price * item.quantity);
      message += `${idx + 1}) ${item.name}  x${item.quantity}  —  ${lineTotal}\n`;
    });

    // Divider + totals
    message += `━━━━━━━━━━━━━━\n`;
    message += `*Items:* ${totalItems}\n`;
    message += `*Total:* ${money(totalPrice)}\n`;

    // Notes
    if (notes?.trim()) {
      message += `\n *Notes:* ${notes.trim()}\n`;
    }

    return encodeURIComponent(message);
  };

  const handleWhatsAppOrder = async () => {
    const err = validateBeforePlace();
    if (err) {
      setPlaceError(err);
      return;
    }

    if (!restaurantPhone) {
      setPlaceError(
        "WhatsApp ordering is unavailable because the restaurant phone number isn’t set.",
      );
      return;
    }

    setPlaceError("");
    setPlacing(true);
    setCopied(false);

    const popup = window.open("", "_blank");
    if (popup) popup.opener = null;

    try {
      const response = await fetch("/api/checkout/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantSlug: restaurant.slug,
          channel: isDineIn ? "dine_in" : channel,
          tableCode: isDineIn ? tableCode : null,
          items: cartItems.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        popup?.close();
        setPlaceError(data?.error || "Unable to validate your cart.");
        return;
      }

      const currentById = new Map(
        cartItems.map((item) => [String(item.id), item]),
      );
      const menuChanged = data.items.some((item) => {
        const current = currentById.get(String(item.id));
        return (
          !current ||
          current.name !== item.name ||
          Number(current.price) !== Number(item.price)
        );
      });

      if (menuChanged) {
        popup?.close();
        setPlaceError(
          "The menu changed while you were ordering. Return to the menu and review your cart.",
        );
        return;
      }

      const validatedPhone = normalizeSaudiWhatsAppNumber(
        data?.restaurant?.phone,
      );
      if (!validatedPhone) {
        popup?.close();
        setPlaceError(
          "WhatsApp ordering is unavailable because the restaurant phone number isn’t set.",
        );
        return;
      }

      // Persist the order so it shows up in both the owner's and the
      // customer's Orders tabs. Best-effort: if this fails we still let the
      // customer place the order via WhatsApp as before, rather than
      // blocking checkout on it.
      try {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess?.session?.access_token;

        const orderRes = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            restaurantSlug: restaurant.slug,
            channel: isDineIn ? "dine_in" : channel,
            tableCode: isDineIn ? tableCode : null,
            items: cartItems.map((item) => ({
              id: item.id,
              quantity: item.quantity,
            })),
            customer: {
              name: customerName?.trim() || null,
              phone: customerPhone?.trim() || null,
              address: channel === "delivery" ? deliveryAddress?.trim() || null : null,
            },
            notes: notes?.trim() || null,
          }),
        });

        const orderData = await orderRes.json();
        if (orderRes.ok && orderData?.orderId) {
          setSavedOrder({ orderId: orderData.orderId, loggedIn: !!token });
        }
      } catch {
        // ignore — WhatsApp ordering below still works without a saved order
      }

      const message = generateWhatsAppMessage(data.tableNumber);
      const whatsappUrl = `https://wa.me/${validatedPhone}?text=${message}`;
      checkoutSnapshotRef.current.message = decodeURIComponent(message);

      if (data.tableNumber) setTableNumber(data.tableNumber);
      setWhatsAppOpened(true);

      if (popup) {
        popup.location.replace(whatsappUrl);
      } else {
        window.location.href = whatsappUrl;
      }
    } catch {
      popup?.close();
      setPlaceError(
        "We couldn’t open WhatsApp. Check your connection or copy the order instead.",
      );
    } finally {
      setPlacing(false);
    }
  };

  const handleCopyOrder = async () => {
    try {
      const message =
        checkoutSnapshotRef.current?.message ||
        decodeURIComponent(generateWhatsAppMessage());
      checkoutSnapshotRef.current.message = message;
      await copyText(message);
      setCopied(true);
      setPlaceError("");
    } catch {
      setPlaceError("Your browser blocked copying. Please select and copy the order manually.");
    }
  };

  const handleConfirmSent = () => {
    clearCart();
    router.push("/restaurants");
  };

  const handleDec = (item) => {
    if (item.quantity <= 1) return removeFromCart(item.id);
    updateQuantity(item.id, item.quantity - 1);
  };
  const handleInc = (item) => updateQuantity(item.id, item.quantity + 1);

  const clearTableLink = () => {
    if (!restaurant?.slug) return;
    localStorage.removeItem(`tableCode:${restaurant.slug}`);
    setTableCode(null);
    setTableNumber(null); // ✅ clear resolved number too
    setPlaceError("");
    setWhatsAppOpened(false);
    setSavedOrder(null);
    checkoutSnapshotRef.current = null;
  };

  const validateBeforePlace = () => {
    setPlaceError("");
    if (!restaurant?.slug)
      return "Restaurant is missing. Please go back and open menu again.";
    if (!cartItems?.length) return "Your cart is empty.";

    if (!isDineIn && !restaurant?.pickup_available && !restaurant?.delivery_available) {
      return "This restaurant has not enabled online ordering.";
    }

    const customerPhoneDigits = normalizeSaudiWhatsAppNumber(customerPhone);

    if (!isDineIn && channel === "delivery") {
      if (customerPhoneDigits.length < 9 || customerPhoneDigits.length > 15)
        return "Please enter a valid phone number for delivery.";
      if (!deliveryAddress.trim()) return "Please enter delivery address.";
    }
    if (!isDineIn && channel === "pickup") {
      if (customerPhoneDigits.length < 9 || customerPhoneDigits.length > 15)
        return "Please enter a valid phone number for pickup.";
    }

    if (isDineIn && !tableCode) {
      return "Missing table code. Please scan the table QR again.";
    }

    return "";
  };

  if (!cartReady) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-muted/30 flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Restoring your cart…
        </div>
      </div>
    );
  }

  if (!cartItems?.length) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <Card className="overflow-hidden">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Your cart is empty
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Add some items and come back — we’ll keep them here 🍔
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/restaurants">Browse restaurants</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="icon" className="shrink-0">
                <Link href={menuHref}>
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>

              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold leading-tight truncate">
                  Your Cart
                </h1>

                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="secondary" className="gap-1">
                    <ShoppingCart className="h-3.5 w-3.5" />
                    {totalItems} item{totalItems === 1 ? "" : "s"}
                  </Badge>

                  {restaurant?.name && (
                    <Badge variant="outline" className="gap-1">
                      <Store className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[220px]">
                        {restaurant.name}
                      </span>
                    </Badge>
                  )}

                  <Badge
                    variant={isDineIn ? "default" : "secondary"}
                    className="gap-1"
                  >
                    {isDineIn ? (
                      <UtensilsCrossed className="h-3.5 w-3.5" />
                    ) : (
                      <Bike className="h-3.5 w-3.5" />
                    )}
                    {isDineIn
                      ? "Dine-in"
                      : channel === "delivery"
                        ? "Delivery"
                        : "Pickup"}
                  </Badge>
                </div>

                {isDineIn && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Linked to a table via QR{" "}
                      {tableNumber ? `(Table ${tableNumber})` : "(Table ?)"}.
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearTableLink}
                      className="h-7 px-2"
                      title="Use this if you’re ordering online from home"
                    >
                      <Clipboard className="h-3.5 w-3.5 mr-1" />
                      Switch to online
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* <Button variant="destructive" className="shrink-0 rounded-full" onClick={clearCart}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button> */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-8 overflow-hidden gap-0">
            <CardHeader className="pb-0">
              <CardTitle className="text-base md:text-lg">Items</CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              <div className="divide-y">
                {cartItems.map((item) => (
                  <div key={item.id} className="p-4 md:p-5 flex gap-4">
                    <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-xl overflow-hidden bg-muted">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <ShoppingCart className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold leading-tight truncate">
                            {item.name}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {money(item.price)} each
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeFromCart(item.id)}
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="inline-flex items-center rounded-full border bg-background p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => handleDec(item)}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>

                          <div className="w-10 text-center font-semibold">
                            {item.quantity}
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => handleInc(item)}
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            Item total
                          </p>
                          <p className="font-bold">
                            {money(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between">
              <div className="flex items-center justify-between gap-3">
                <Button asChild variant="outline">
                  <Link href={menuHref}>Continue shopping</Link>
                </Button>

                <Button
                  variant="destructive"
                  className="w-fit cursor-pointer hover:bg-red-500"
                  onClick={clearCart}
                >
                  <Trash2 className="h-4 mr-2" />
                  Clear
                </Button>
              </div>

              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <BadgeCheck className="h-4 w-4" />
                Review your items before ordering
              </div>
            </CardFooter>
          </Card>

          <div className="lg:col-span-4">
            <Card className="lg:sticky lg:top-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Summary</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {!isDineIn && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Order type</p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={channel === "pickup" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setChannel("pickup")}
                        disabled={!restaurant?.pickup_available}
                      >
                        Pickup
                      </Button>
                      <Button
                        type="button"
                        variant={channel === "delivery" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setChannel("delivery")}
                        disabled={!restaurant?.delivery_available}
                      >
                        Delivery
                      </Button>
                    </div>
                    {!restaurant?.pickup_available &&
                      !restaurant?.delivery_available && (
                        <p className="text-xs text-muted-foreground">
                          This restaurant has not enabled pickup or delivery.
                        </p>
                      )}
                  </div>
                )}

                {!isDineIn && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Phone *</p>
                      <input
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="e.g. 9665xxxxxxx"
                        className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Name (optional)</p>
                      <input
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Your name"
                        className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                      />
                    </div>

                    {channel === "delivery" && (
                      <div className="space-y-1">
                        <p className="text-sm font-semibold flex items-center gap-2">
                          <MapPin className="h-4 w-4" /> Address *
                        </p>
                        <textarea
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="District, street, building, apartment..."
                          className="w-full min-h-[80px] rounded-md border bg-background px-3 py-2 text-sm"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-sm font-semibold">Notes (optional)</p>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any instructions..."
                    className="w-full min-h-[70px] rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <span className="font-medium">{totalItems}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{money(totalPrice)}</span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold">Total</span>
                  <span className="text-xl font-bold text-primary">
                    {money(totalPrice)}
                  </span>
                </div>

                {placeError && (
                  <p className="text-sm text-destructive">{placeError}</p>
                )}

                <div className="grid gap-2">
                  <Button
                    size="lg"
                    className="w-full hover:bg-green-600 text-white cursor-pointer"
                    onClick={handleWhatsAppOrder}
                    disabled={!restaurantPhone || placing}
                  >
                    {placing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MessageCircle className="h-4 w-4" />
                    )}
                    {placing ? "Checking menu…" : "Continue on WhatsApp"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleCopyOrder}
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copied ? "Order copied" : "Copy order text"}
                  </Button>
                </div>

                {whatsappOpened && (
                  <div
                    className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950"
                    role="status"
                  >
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                      <div>
                        <p className="text-sm font-semibold">WhatsApp opened</p>
                        <p className="mt-1 text-xs leading-5 text-emerald-800">
                          Your cart is still here. Clear it only after you send the message.
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full border-emerald-300 bg-white hover:bg-emerald-100"
                      onClick={handleConfirmSent}
                    >
                      I sent it — clear my cart
                    </Button>

                    {savedOrder?.loggedIn && (
                      <Link
                        href="/dashboard/customer"
                        className="mt-2 block text-center text-xs font-semibold text-emerald-800 underline underline-offset-2"
                      >
                        Track this order in My Orders
                      </Link>
                    )}
                  </div>
                )}

                {!restaurantPhone && (
                  <p className="text-xs text-muted-foreground">
                    WhatsApp ordering is unavailable because the restaurant
                    phone number isn’t set.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
