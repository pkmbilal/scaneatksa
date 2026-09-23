"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import {
  House,
  UtensilsCrossed,
  ShoppingCart,
  UserRound,
  Menu,
  Info,
  Gauge,
  Headset,
  Sun,
  Moon,
  UserRoundPen,
  ShieldUser,
  LogOut,
} from "lucide-react";

import { getSessionUser, getUserProfile, signOut } from "@/lib/auth/client";
import { useCart } from "@/app/CartContext";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// Primary app-level navigation for the customer ordering flow, plus (via the
// "More" tab) everything the top Navbar's mobile hamburger used to cover --
// that hamburger is now only rendered on /menu/[slug] (see Navbar.js), which
// never shows this bar because it already has its own fixed "View Cart" bar
// (components/CartButton.js) that a second fixed bottom bar would stack on.
export default function MobileTabBar() {
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const { totalItems } = useCart();
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { user: currentUser } = await getSessionUser();
      if (cancelled) return;

      if (!currentUser) {
        setUser(null);
        setProfile(null);
        return;
      }

      setUser(currentUser);
      const { data: userProfile } = await getUserProfile(currentUser.id);
      if (!cancelled) setProfile(userProfile);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const hideTabBar =
    pathname?.startsWith("/auth/") ||
    pathname === "/dashboard" ||
    pathname?.startsWith("/dashboard/admin") ||
    pathname?.startsWith("/dashboard/owner") ||
    pathname?.startsWith("/dashboard/kitchen") ||
    pathname?.startsWith("/dashboard/waiter") ||
    pathname?.startsWith("/dashboard/change-password") ||
    pathname?.startsWith("/menu/");

  if (hideTabBar) return null;

  const getDashboardLink = () => {
    if (profile?.role === "admin") return "/dashboard/admin";
    if (profile?.role === "owner") return "/dashboard/owner";
    return "/dashboard/customer";
  };
  const dashboardHref = user && profile ? getDashboardLink() : "/auth/login";

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setProfile(null);
    setMoreOpen(false);
    router.push("/");
  };

  const isActive = (href) =>
    href === "/" ? pathname === "/" : pathname === href || pathname?.startsWith(href + "/");

  const tabs = [
    { href: "/", label: t("nav.home"), icon: House, active: isActive("/") },
    { href: "/restaurants", label: t("nav.restaurants"), icon: UtensilsCrossed, active: isActive("/restaurants") },
    { href: "/cart", label: t("nav.cart"), icon: ShoppingCart, active: isActive("/cart"), badge: totalItems },
    { href: dashboardHref, label: t("nav.account"), icon: UserRound, active: pathname?.startsWith("/dashboard/customer") },
  ];

  const tabButtonClass = "flex flex-col items-center justify-center gap-1 py-2";
  const iconWrapClass = (active) =>
    cn(
      "relative flex h-9 w-9 items-center justify-center rounded-full",
      active ? "text-primary" : "text-muted-foreground"
    );
  const labelClass = (active) => cn("text-[11px] font-medium", active ? "text-primary" : "text-muted-foreground");

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="grid grid-cols-5">
          {tabs.map(({ href, label, icon: Icon, active, badge }) => (
            <Link key={href} href={href} className={tabButtonClass}>
              <motion.span whileTap={{ scale: 0.88 }} className={iconWrapClass(active)}>
                <Icon className="h-5 w-5" />
                {!!badge && (
                  <span className="absolute -top-1 -end-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                    {badge}
                  </span>
                )}
              </motion.span>
              <span className={labelClass(active)}>{label}</span>
            </Link>
          ))}

          <button type="button" onClick={() => setMoreOpen(true)} className={tabButtonClass}>
            <motion.span whileTap={{ scale: 0.88 }} className={iconWrapClass(moreOpen)}>
              <Menu className="h-5 w-5" />
            </motion.span>
            <span className={labelClass(moreOpen)}>{t("nav.more")}</span>
          </button>
        </div>
      </nav>

      {/* Spacer so fixed-position content doesn't sit under the bar */}
      <div className="h-[64px] md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }} />

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl md:hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>{t("nav.more")}</SheetTitle>
          </SheetHeader>

          <div
            className="px-4 pt-2"
            style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
          >
            <ul className="flex flex-col gap-1">
              <li>
                <Link
                  href="/about"
                  onClick={() => setMoreOpen(false)}
                  className={`menu-item ${isActive("/about") ? "menu-item-active" : "menu-item-inactive"}`}
                >
                  <Info className="size-5" />
                  {t("nav.about")}
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  onClick={() => setMoreOpen(false)}
                  className={`menu-item ${isActive("/how-it-works") ? "menu-item-active" : "menu-item-inactive"}`}
                >
                  <Gauge className="size-5" />
                  {t("nav.howItWorks")}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  onClick={() => setMoreOpen(false)}
                  className={`menu-item ${isActive("/contact") ? "menu-item-active" : "menu-item-inactive"}`}
                >
                  <Headset className="size-5" />
                  {t("nav.contact")}
                </Link>
              </li>
            </ul>

            <div className="mt-4 flex items-center gap-3 border-t pt-4">
              <LanguageSwitcher variant="icon" />
              <button
                type="button"
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="relative flex h-11 w-11 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:bg-accent"
                aria-label={t("toggleDarkMode")}
              >
                {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
              </button>
            </div>

            <div className="mt-4 border-t pt-4">
              {user && profile ? (
                <>
                  <div className="flex items-center gap-3 rounded-xl border p-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-brand-50 text-brand-600 font-semibold dark:bg-brand-500/15 dark:text-brand-400">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{profile.full_name || t("defaultUserName")}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>

                  <ul className="mt-3 flex flex-col gap-1">
                    <li>
                      <Link
                        href="/dashboard/customer/edit-profile"
                        onClick={() => setMoreOpen(false)}
                        className={`menu-item ${isActive("/dashboard/customer/edit-profile") ? "menu-item-active" : "menu-item-inactive"}`}
                      >
                        <UserRoundPen className="size-5" />
                        {t("userMenu.editProfile")}
                      </Link>
                    </li>
                    {profile.role === "customer" && (
                      <li>
                        <Link
                          href="/dashboard/customer/request-restaurant"
                          onClick={() => setMoreOpen(false)}
                          className={`menu-item ${isActive("/dashboard/customer/request-restaurant") ? "menu-item-active" : "menu-item-inactive"}`}
                        >
                          <ShieldUser className="size-5" />
                          {t("userMenu.requestOwnerAccess")}
                        </Link>
                      </li>
                    )}
                    <li>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="menu-item menu-item-inactive w-full cursor-pointer"
                      >
                        <LogOut className="size-5 rtl:-scale-x-100" />
                        {t("userMenu.logout")}
                      </button>
                    </li>
                  </ul>
                </>
              ) : (
                <div className="rounded-2xl border p-4">
                  <p className="text-sm font-semibold">{t("guest.welcomeTitle")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t("guest.welcomeSubtitle")}</p>
                  <Button className="mt-3 w-full rounded-xl bg-primary hover:bg-green-700" asChild>
                    <Link href="/auth/login" onClick={() => setMoreOpen(false)}>
                      {t("guest.loginSignup")}
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
