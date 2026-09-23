"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { House, UtensilsCrossed, ShoppingCart, UserRound } from "lucide-react";

import { getSessionUser, getUserProfile } from "@/lib/auth/client";
import { useCart } from "@/app/CartContext";
import { cn } from "@/lib/utils";

// Primary app-level navigation for the customer ordering flow. Only shown on
// the routes that make up that flow (see `visible` below) -- deliberately
// excludes /menu/[slug], which already has its own floating "View Cart" bar
// (components/CartButton.js) that a second fixed bottom bar would stack on.
export default function MobileTabBar() {
  const t = useTranslations("common");
  const pathname = usePathname();
  const { totalItems } = useCart();
  const [dashboardHref, setDashboardHref] = useState("/auth/login");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { user } = await getSessionUser();
      if (!user) return;

      const { data: profile } = await getUserProfile(user.id);
      if (cancelled) return;

      if (profile?.role === "admin") setDashboardHref("/dashboard/admin");
      else if (profile?.role === "owner") setDashboardHref("/dashboard/owner");
      else setDashboardHref("/dashboard/customer");
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const visible =
    pathname === "/" ||
    pathname === "/restaurants" ||
    pathname === "/cart" ||
    pathname?.startsWith("/dashboard/customer");

  if (!visible) return null;

  const isActive = (href) =>
    href === "/" ? pathname === "/" : pathname === href || pathname?.startsWith(href + "/");

  const tabs = [
    { href: "/", label: t("nav.home"), icon: House, active: isActive("/") },
    { href: "/restaurants", label: t("nav.restaurants"), icon: UtensilsCrossed, active: isActive("/restaurants") },
    { href: "/cart", label: t("nav.cart"), icon: ShoppingCart, active: isActive("/cart"), badge: totalItems },
    { href: dashboardHref, label: t("nav.account"), icon: UserRound, active: pathname?.startsWith("/dashboard/customer") },
  ];

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="grid grid-cols-4">
          {tabs.map(({ href, label, icon: Icon, active, badge }) => (
            <Link key={href} href={href} className="flex flex-col items-center justify-center gap-1 py-2">
              <motion.span
                whileTap={{ scale: 0.88 }}
                className={cn(
                  "relative flex h-9 w-9 items-center justify-center rounded-full",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {!!badge && (
                  <span className="absolute -top-1 -end-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                    {badge}
                  </span>
                )}
              </motion.span>
              <span className={cn("text-[11px] font-medium", active ? "text-primary" : "text-muted-foreground")}>
                {label}
              </span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Spacer so fixed-position content doesn't sit under the bar */}
      <div className="h-[64px] md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }} />
    </>
  );
}
