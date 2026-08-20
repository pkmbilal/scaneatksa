"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/app/CartContext";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  ShoppingCart,
  ShoppingBag,
  Store,
  Trash2,
  Plus,
  Minus,
  BadgeCheck,
  Clipboard,
  MapPin,
  Bike,
  UtensilsCrossed,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { normalizeSaudiWhatsAppNumber } from "@/lib/whatsapp";
import { STATUS_LABELS, STATUS_TINTS } from "@/lib/orderStatus";
import { supabaseBrowser } from "@/lib/supabase/client";

const supabase = supabaseBrowser();

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
  const [placedOrder, setPlacedOrder] = useState(null); // { orderId, loggedIn, tableNumber, channel, itemCount, total }

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

  const handlePlaceOrder = async () => {
    const err = validateBeforePlace();
    if (err) {
      setPlaceError(err);
      return;
    }

    setPlaceError("");
    setPlacing(true);

    try {
      // 1) Revalidate the cart against the live menu (price/name/availability
      // may have drifted since items were added).
      const validateRes = await fetch("/api/checkout/validate", {
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

      const validateData = await validateRes.json();
      if (!validateRes.ok) {
        setPlaceError(validateData?.error || "Unable to validate your cart.");
        return;
      }

      const currentById = new Map(
        cartItems.map((item) => [String(item.id), item]),
      );
      const menuChanged = validateData.items.some((item) => {
        const current = currentById.get(String(item.id));
        return (
          !current ||
          current.name !== item.name ||
          Number(current.price) !== Number(item.price)
        );
      });

      if (menuChanged) {
        setPlaceError(
          "The menu changed while you were ordering. Return to the menu and review your cart.",
        );
        return;
      }

      // 2) Place the order — this is now the actual checkout action.
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
      if (!orderRes.ok || !orderData?.orderId) {
        setPlaceError(orderData?.error || "We couldn't place your order. Please try again.");
        return;
      }

      if (orderData.tableNumber) setTableNumber(orderData.tableNumber);

      setPlacedOrder({
        orderId: orderData.orderId,
        loggedIn: !!token,
        tableNumber: orderData.tableNumber ?? tableNumber,
        channel: isDineIn ? "dine_in" : channel,
        itemCount: totalItems,
        total: totalPrice,
      });

      clearCart();
    } catch {
      setPlaceError(
        "We couldn’t reach the server. Check your connection and try again.",
      );
    } finally {
      setPlacing(false);
    }
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
    setPlacedOrder(null);
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

  if (placedOrder) {
    const orderRef = placedOrder.orderId.slice(-8).toUpperCase();
    const whereLabel =
      placedOrder.channel === "dine_in"
        ? `Table ${placedOrder.tableNumber ?? "?"}`
        : placedOrder.channel === "delivery"
          ? "Delivery"
          : "Pickup";

    return (
      <div className="min-h-[calc(100vh-64px)] bg-muted/30">
        <div className="mx-auto max-w-xl px-4 py-10">
          <Card className="overflow-hidden">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-6 w-6" />
                Order placed!
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Order #{orderRef} — the restaurant has received it.
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border bg-background p-3">
                <div className="text-sm text-muted-foreground">
                  {whereLabel} • {placedOrder.itemCount} item
                  {placedOrder.itemCount === 1 ? "" : "s"} • {money(placedOrder.total)}
                </div>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${STATUS_TINTS.new}`}>
                  {STATUS_LABELS.new}
                </span>
              </div>

              {placedOrder.loggedIn ? (
                <Button asChild className="w-full">
                  <Link href="/dashboard/customer">Track this order</Link>
                </Button>
              ) : placedOrder.channel !== "dine_in" && customerPhone.trim() ? (
                <p className="text-sm text-muted-foreground rounded-lg border bg-background p-3">
                  You’ll receive WhatsApp updates from the restaurant as your
                  order status changes, at {customerPhone.trim()}.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground rounded-lg border bg-background p-3">
                  The kitchen has received your order — sit tight!
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setPlacedOrder(null);
                    router.push(menuHref);
                  }}
                >
                  Place another order
                </Button>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setPlacedOrder(null);
                    router.push("/restaurants");
                  }}
                >
                  Browse restaurants
                </Button>
              </div>
            </CardContent>
          </Card>
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
                      <Input
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="e.g. 9665xxxxxxx"
                      />
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Name (optional)</p>
                      <Input
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Your name"
                      />
                    </div>

                    {channel === "delivery" && (
                      <div className="space-y-1">
                        <p className="text-sm font-semibold flex items-center gap-2">
                          <MapPin className="h-4 w-4" /> Address *
                        </p>
                        <Textarea
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="District, street, building, apartment..."
                          className="min-h-[80px]"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-sm font-semibold">Notes (optional)</p>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any instructions..."
                    className="min-h-[70px]"
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
                    className="w-full cursor-pointer"
                    onClick={handlePlaceOrder}
                    disabled={placing || !cartItems?.length}
                  >
                    {placing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShoppingBag className="h-4 w-4" />
                    )}
                    {placing ? "Placing order…" : "Place Order"}
                  </Button>
                </div>

                {!isDineIn && (
                  <p className="text-xs text-muted-foreground">
                    We’ll send WhatsApp updates to your phone number as your
                    order status changes.
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
