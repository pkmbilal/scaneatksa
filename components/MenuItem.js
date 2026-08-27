"use client";

import { useTranslations } from "next-intl";
import { useCart } from "@/app/CartContext";
import { ShoppingCart, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import StarRating from "@/components/reviews/StarRating";
import MashrabiyaFret from "@/components/menu/MashrabiyaFret";

export default function MenuItem({ item, restaurant, index = 0 }) {
  const t = useTranslations("menu");
  const { addToCart, cartItems, updateQuantity, removeFromCart } = useCart();
  const soldOut = !!item.is_sold_out;

  // normalize id types so the in-cart count matches
  const cartItem = cartItems.find((ci) => String(ci.id) === String(item.id));
  const inCartCount = cartItem?.quantity || 0;

  const handleAddToCart = () => {
    if (!soldOut) addToCart(item, restaurant);
  };
  const handleIncrement = () => {
    if (!soldOut) addToCart(item, restaurant);
  };
  const handleDecrement = () => {
    if (soldOut || !cartItem) return;
    const nextQty = inCartCount - 1;
    if (nextQty <= 0) removeFromCart(item.id);
    else updateQuantity(item.id, nextQty);
  };

  const categoryName = item.categories?.name || t("uncategorized");
  const price = t("item.price", { amount: Number(item.price).toFixed(2) });
  // Stagger the entrance in short waves rather than one long cascade.
  const riseStyle = { animationDelay: `${(index % 6) * 60}ms` };

  const eyebrowMark = (
    <MashrabiyaFret
      variant="tick"
      className="inline-flex text-[color:var(--m-brass)]"
    />
  );

  // Veg / non-veg indicator: the square-with-a-dot convention diners here
  // recognise. `is_veg` is nullable -- only show a mark when it's set.
  const dietMark =
    item.is_veg == null ? null : (
      <span
        role="img"
        aria-label={t(item.is_veg ? "item.veg" : "item.nonVeg")}
        title={t(item.is_veg ? "item.veg" : "item.nonVeg")}
        className={cn(
          "grid h-4 w-4 shrink-0 place-items-center rounded-[3px] border-[1.5px]",
          item.is_veg
            ? "border-[color:var(--m-veg)]"
            : "border-[color:var(--m-nonveg)]"
        )}
      >
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            item.is_veg
              ? "bg-[color:var(--m-veg)]"
              : "bg-[color:var(--m-nonveg)]"
          )}
        />
      </span>
    );

  const stepper = (small) => (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-[color:var(--m-emerald)]/30 bg-[color:var(--m-parchment)]",
        small ? "gap-1.5 px-1.5 py-1" : "p-1"
      )}
    >
      <Button
        size="icon"
        variant="ghost"
        className={cn(
          "rounded-full text-[color:var(--m-ink)] hover:bg-[color:var(--m-emerald)]/10",
          small ? "h-6 w-6" : "h-8 w-8"
        )}
        onClick={handleDecrement}
        aria-label={t("item.decreaseQtyAria")}
      >
        <Minus className={small ? "h-2.5 w-2.5" : "h-4 w-4"} />
      </Button>
      <span
        className={cn(
          "text-center font-semibold text-[color:var(--m-ink)] tabular-nums",
          small ? "min-w-4 text-xs" : "w-8"
        )}
      >
        {inCartCount}
      </span>
      <Button
        size="icon"
        variant="ghost"
        className={cn(
          "rounded-full text-[color:var(--m-ink)] hover:bg-[color:var(--m-emerald)]/10",
          small ? "h-6 w-6" : "h-8 w-8"
        )}
        onClick={handleIncrement}
        disabled={soldOut}
        aria-label={t("item.increaseQtyAria")}
      >
        <Plus className={small ? "h-2.5 w-2.5" : "h-4 w-4"} />
      </Button>
    </div>
  );

  const addButton = (small) => (
    <Button
      onClick={handleAddToCart}
      disabled={soldOut}
      className={cn(
        "rounded-full bg-[color:var(--m-go)] font-semibold text-white shadow-sm transition hover:brightness-95",
        small ? "h-7 px-3 text-xs" : "h-9 px-4"
      )}
    >
      <Plus className={cn("me-1", small ? "h-3 w-3" : "h-4 w-4")} />
      {small ? t("item.add") : t("item.addToCart")}
    </Button>
  );

  const soldOutTag = (boxed) =>
    boxed ? (
      <span className="rounded-full border border-[color:var(--m-line)] px-3 py-1 text-xs font-medium text-[color:var(--m-ink-soft)]">
        {t("item.soldOutBadge")}
      </span>
    ) : (
      <span className="text-xs font-medium text-[color:var(--m-ink-soft)]">
        {t("item.soldOutBadge")}
      </span>
    );

  return (
    <>
      {/* MOBILE */}
      <div className="m-rise sm:hidden" style={riseStyle}>
        <div
          className={cn(
            "m-card m-card-hover relative overflow-hidden rounded-2xl",
            soldOut && "opacity-60"
          )}
        >
          <div className="flex min-h-32">
            <div className="relative h-32 w-32 shrink-0 overflow-hidden bg-[color:var(--m-limestone)]">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[color:var(--m-ink-soft)]">
                  <ShoppingCart className="h-8 w-8" />
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col p-3.5">
              <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-[color:var(--m-ink-soft)]">
                {eyebrowMark}
                {categoryName}
              </span>
              <div className="mt-0.5 flex items-start justify-between gap-2">
                <h3 className="font-display text-sm font-semibold leading-tight text-[color:var(--m-ink)] line-clamp-2">
                  {item.name}
                </h3>
                {dietMark}
              </div>

              {item.rating?.review_count > 0 && (
                <div className="mt-1">
                  <StarRating
                    value={item.rating.avg_rating}
                    reviewCount={item.rating.review_count}
                    showValue
                    size="sm"
                    className="text-[color:var(--m-ink-soft)]"
                  />
                </div>
              )}

              {item.description && (
                <p className="mt-1 text-xs leading-relaxed text-[color:var(--m-ink-soft)] line-clamp-2">
                  {item.description}
                </p>
              )}

              <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                <span className="text-sm font-semibold tabular-nums text-[color:var(--m-ink)]">
                  {price}
                </span>
                {soldOut
                  ? soldOutTag(false)
                  : inCartCount > 0
                    ? stepper(true)
                    : addButton(true)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DESKTOP / TABLET */}
      <div className="m-rise hidden sm:block" style={riseStyle}>
        <div
          className={cn(
            "m-card m-card-hover relative flex h-full flex-col overflow-hidden rounded-2xl",
            soldOut && "opacity-60"
          )}
        >
          {item.image_url ? (
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-[color:var(--m-limestone)]">
              <img
                src={item.image_url}
                alt={item.name}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center bg-[color:var(--m-limestone)] text-[color:var(--m-ink-soft)]">
              <ShoppingCart className="h-10 w-10" />
            </div>
          )}

          <div className="flex flex-1 flex-col p-4">
            <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-[color:var(--m-ink-soft)]">
              {eyebrowMark}
              {categoryName}
            </span>

            <div className="mt-1 flex items-start justify-between gap-2">
              <h3 className="font-display text-lg font-semibold leading-tight text-[color:var(--m-ink)]">
                {item.name}
              </h3>
              {dietMark}
            </div>

            {item.rating?.review_count > 0 && (
              <div className="mt-1.5">
                <StarRating
                  value={item.rating.avg_rating}
                  reviewCount={item.rating.review_count}
                  showValue
                  size="sm"
                  className="text-[color:var(--m-ink-soft)]"
                />
              </div>
            )}

            {item.description && (
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--m-ink-soft)] line-clamp-2">
                {item.description}
              </p>
            )}

            <div className="mt-4 flex items-center justify-between gap-2 pt-2">
              <span className="text-lg font-semibold tabular-nums text-[color:var(--m-ink)]">
                {price}
              </span>
              {soldOut
                ? soldOutTag(true)
                : inCartCount > 0
                  ? stepper(false)
                  : addButton(false)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
