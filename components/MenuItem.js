"use client";

import { useTranslations } from "next-intl";
import { useCart } from "@/app/CartContext";
import { ShoppingCart, Plus, Minus, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function MenuItem({ item, restaurant, categoryMap = {} }) {
  const t = useTranslations("menu");
  const { addToCart, cartItems, updateQuantity, removeFromCart } = useCart();
  const soldOut = !!item.is_sold_out;

  // ✅ FIX: normalize id types so inCartCount works
  const cartItem = cartItems.find((ci) => String(ci.id) === String(item.id));
  const inCartCount = cartItem?.quantity || 0;

  const handleAddToCart = () => {
    if (soldOut) return;
    addToCart(item, restaurant);
  };

  const handleIncrement = () => {
    if (soldOut) return;
    addToCart(item, restaurant);
  };

  const handleDecrement = () => {
    if (soldOut) return;
    if (!cartItem) return;
    const nextQty = inCartCount - 1;
    if (nextQty <= 0) removeFromCart(item.id);
    else updateQuantity(item.id, nextQty);
  };

  const categoryName = item.category_id
    ? categoryMap[item.category_id] || t("uncategorized")
    : t("uncategorized");

  return (
    <>
      {/* MOBILE */}
      <div className="sm:hidden">
        <div
          className={cn(
            "relative bg-white rounded-2xl shadow-sm border border-gray-100 transition-all overflow-hidden",
            soldOut ? "opacity-60" : "hover:border-gray-200"
          )}
        >
          {/* ✅ Use min-h so description can show */}
          <div className="flex min-h-28">
            {/* Left: image */}
            <div className="relative w-32 h-32 shrink-0">
              <div className="w-full h-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <ShoppingCart className="h-8 w-8" />
                  </div>
                )}

                {soldOut && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-bold text-xs px-2 py-0.5 bg-black/70 rounded-full">
                      {t("item.soldOutOverlay")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right content */}
            <div className="flex-1 min-w-0 p-4 flex flex-col">
              {/* Top row: name + price */}
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-1">
                  {item.name}
                </h3>
                <span className="text-sm font-bold text-gray-900 shrink-0 pt-0.5">
                  {t("item.price", { amount: Number(item.price).toFixed(2) })}
                </span>
              </div>

              {/* Description */}
              {/* {item.description && (
                <p className="mt-1.5 text-xs text-gray-600 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              )} */}

              {/* Badges */}
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge
                  variant="outline"
                  className="text-[10px] font-normal text-gray-600 border-gray-200 h-5"
                >
                  {item.categories?.name || categoryName}
                </Badge>

                {item.prep_time && (
                  <Badge variant="outline" className="text-[10px] gap-1 h-5 px-1.5">
                    <Clock className="h-2.5 w-2.5" />
                    {t("item.prepTime", { minutes: item.prep_time })}
                  </Badge>
                )}
              </div>

              {/* Bottom row */}
              <div className="mt-auto flex items-center justify-between">
                <div className="text-xs text-gray-400" />

                {inCartCount > 0 ? (
                  <div className="flex items-center gap-1.5 bg-green-50 rounded-full px-1.5 py-1 border border-green-100">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 rounded-full bg-white shadow-sm"
                      onClick={handleDecrement}
                      aria-label={t("item.decreaseAria")}
                    >
                      <Minus className="h-2.5 w-2.5" />
                    </Button>

                    <span className="text-xs font-bold text-green-700 min-w-[16px] text-center">
                      {inCartCount}
                    </span>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 rounded-full bg-white shadow-sm"
                      onClick={handleIncrement}
                      aria-label={t("item.increaseAria")}
                    >
                      <Plus className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleAddToCart}
                    disabled={soldOut}
                    size="sm"
                    className={cn(
                      "h-7 rounded-full px-3 text-xs font-medium transition-all",
                      soldOut
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-sm hover:shadow"
                    )}
                  >
                    {soldOut ? (
                      t("item.soldOutButton")
                    ) : (
                      <>
                        <Plus className="h-3 w-3 me-1" />
                        {t("item.add")}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DESKTOP/TABLET (unchanged) */}
      <div className="hidden sm:block">
        <Card
          className={cn(
            "overflow-hidden transition-shadow border !py-0 !pb-2",
            soldOut ? "opacity-60" : "hover:shadow-md hover:border-gray-200"
          )}
        >
          <CardContent className="p-0">
            {item.image_url && (
              <div className="relative w-full h-48 overflow-hidden bg-muted">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {soldOut && (
                  <span className="absolute top-3 end-3 inline-flex items-center rounded-full bg-background/90 text-foreground text-xs font-semibold px-3 py-1 shadow-sm border">
                    {t("item.soldOutBadge")}
                  </span>
                )}
              </div>
            )}

            <div className="p-4">
              <Badge variant="secondary" className="mb-2">
                {item.categories?.name || categoryName}
              </Badge>

              <h3 className="text-lg font-bold leading-tight">{item.name}</h3>

              {item.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {item.description}
                </p>
              )}

              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-bold text-primary">
                  {t("item.price", { amount: Number(item.price).toFixed(2) })}
                </span>

                {inCartCount > 0 ? (
                  <div className="inline-flex items-center rounded-full border bg-background p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={handleDecrement}
                      aria-label={t("item.decreaseQtyAria")}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-semibold">{inCartCount}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={handleIncrement}
                      disabled={soldOut}
                      aria-label={t("item.increaseQtyAria")}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button onClick={handleAddToCart} disabled={soldOut} className="rounded-lg cursor-pointer">
                    <ShoppingCart className="h-4 w-4 me-2" />
                    {t("item.addToCart")}
                  </Button>
                )}
              </div>

              {!item.image_url && soldOut && (
                <div className="mt-3">
                  <Badge variant="outline" className="rounded-full">
                    {t("item.soldOutBadge")}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
