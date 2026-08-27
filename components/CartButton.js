"use client";

import Link from "next/link";
import { useCart } from "@/app/CartContext";
import { ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CartButton({ restaurant, tableCode }) {
  const { totalItems } = useCart();
  if (!totalItems) return null;

  const href =
    restaurant?.slug
      ? `/cart?restaurant=${encodeURIComponent(restaurant.slug)}${
          tableCode ? `&t=${encodeURIComponent(tableCode)}` : ""
        }`
      : "/cart";

  return (
    <>
      {/* MOBILE */}
      <div className="m-cart-bar md:hidden fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <Button asChild className="m-cart-primary w-full h-12 rounded-xl">
            <Link href={href} className="flex items-center justify-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              <span className="font-semibold">View Cart</span>
              <Badge className="m-cart-badge ml-1">
                {totalItems}
              </Badge>
            </Link>
          </Button>
        </div>
      </div>

      <div className="md:hidden h-[72px]" />

      {/* DESKTOP */}
      <div className="hidden md:block fixed bottom-6 right-6 z-50">
        <Button asChild size="icon" className="m-cart-primary h-14 w-14 rounded-full shadow-lg">
          <Link href={href} aria-label="Open cart" className="relative">
            <ShoppingCart className="h-6 w-6" />
            <span className="absolute -top-2 -right-2">
              <Badge
                className="
                  m-cart-badge
                  h-6 min-w-6 px-2 rounded-full
                  flex items-center justify-center
                  shadow-sm
                "
              >
                {totalItems}
              </Badge>
            </span>
          </Link>
        </Button>
      </div>
    </>
  );
}
