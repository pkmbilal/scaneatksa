"use client";

import { useEffect, useState } from "react";
import Link from "@/components/LocaleLink";
import { useRouter, usePathname } from "next/navigation";
import { stripLocalePrefix } from "@/lib/seo";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import {
  House,
  UtensilsCrossed,
  ShoppingCart,
  UserRound,
  MoreHorizontal,
  Info,
  Gauge,
  Headset,
  Sun,
  Moon,
  Languages,
  ChevronRight,
  UserRoundPen,
  KeyRound,
  ShieldUser,
  LogOut,
} from "lucide-react";

import { getSessionUser, getUserProfile, signOut } from "@/lib/auth/client";
import { useCart } from "@/app/CartContext";
import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  // Arabic public pages live under /ar (see lib/seo.js); compare routes
  // without the prefix.
  const pathname = stripLocalePrefix(usePathname() || "/");
  const { totalItems } = useCart();
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

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
    pathname?.startsWith("/menu/");

  if (hideTabBar) return null;

  const getDashboardLink = () => {
    if (profile?.role === "admin") return "/dashboard/admin";
    if (profile?.role === "owner") return "/dashboard/owner";
    return "/dashboard/customer";
  };
  const dashboardHref = getDashboardLink();

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
    setAccountOpen(false);
    router.push("/");
  };

  const handleAccountTap = () => {
    if (user && profile) setAccountOpen(true);
    else router.push("/auth/login");
  };

  const isActive = (href) =>
    href === "/" ? pathname === "/" : pathname === href || pathname?.startsWith(href + "/");

  const accountActive = pathname?.startsWith("/dashboard/customer") || accountOpen;

  const roleLabels = {
    admin: t("roleLabels.admin"),
    owner: t("roleLabels.owner"),
    customer: t("roleLabels.customer"),
    kitchen: t("roleLabels.kitchen"),
    waiter: t("roleLabels.waiter"),
  };

  const tabs = [
    { href: "/", label: t("nav.home"), icon: House, active: isActive("/") },
    { href: "/restaurants", label: t("nav.restaurants"), icon: UtensilsCrossed, active: isActive("/restaurants") },
    { href: "/cart", label: t("nav.cart"), icon: ShoppingCart, active: isActive("/cart"), badge: totalItems },
  ];

  const moreLinks = [
    { href: "/about", label: t("nav.about"), icon: Info },
    { href: "/how-it-works", label: t("nav.howItWorks"), icon: Gauge },
    { href: "/contact", label: t("nav.contact"), icon: Headset },
  ];

  const accountLinks = [
    { href: "/dashboard/customer/edit-profile", label: t("userMenu.editProfile"), icon: UserRoundPen },
    { href: "/dashboard/change-password", label: t("userMenu.changePassword"), icon: KeyRound },
    ...(profile?.role === "customer"
      ? [{ href: "/dashboard/customer/request-restaurant", label: t("userMenu.requestOwnerAccess"), icon: ShieldUser }]
      : []),
  ];

  const tabButtonClass = "flex flex-col items-center justify-center gap-1 py-2";
  const iconWrapClass = (active) =>
    cn(
      "relative flex h-9 w-9 items-center justify-center rounded-full transition-colors",
      active ? "bg-primary/10 text-primary" : "text-muted-foreground"
    );
  const labelClass = (active) => cn("text-[11px] font-medium", active ? "text-primary" : "text-muted-foreground");

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t bg-background/95 shadow-[0_-8px_24px_-8px_rgba(0,0,0,0.12)] backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden dark:shadow-[0_-8px_24px_-8px_rgba(0,0,0,0.5)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="grid grid-cols-5">
          {tabs.map(({ href, label, icon: Icon, active, badge }) => (
            <Link key={href} href={href} className={tabButtonClass}>
              <motion.span whileTap={{ scale: 0.88 }} className={iconWrapClass(active)}>
                <Icon className="h-5 w-5" />
                {!!badge && (
                  <span className="absolute -top-1 -end-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white ring-2 ring-background">
                    {badge}
                  </span>
                )}
              </motion.span>
              <span className={labelClass(active)}>{label}</span>
            </Link>
          ))}

          <button type="button" onClick={handleAccountTap} className={tabButtonClass}>
            <motion.span whileTap={{ scale: 0.88 }} className={iconWrapClass(accountActive)}>
              <UserRound className="h-5 w-5" />
            </motion.span>
            <span className={labelClass(accountActive)}>{t("nav.account")}</span>
          </button>

          <button type="button" onClick={() => setMoreOpen(true)} className={tabButtonClass}>
            <motion.span whileTap={{ scale: 0.88 }} className={iconWrapClass(moreOpen)}>
              <MoreHorizontal className="h-5 w-5" />
            </motion.span>
            <span className={labelClass(moreOpen)}>{t("nav.more")}</span>
          </button>
        </div>
      </nav>

      {/* Spacer so fixed-position content doesn't sit under the bar */}
      <div className="h-[64px] md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }} />

      {/* More sheet -- app-level info only (About/How It Works/Contact +
          language/theme). Login-agnostic: signed-out visitors never see this
          because tapping Account sends them straight to /auth/login. */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85vh] overflow-y-auto rounded-t-3xl border-none shadow-[0_-16px_40px_-12px_rgba(0,0,0,0.18)] md:hidden dark:shadow-[0_-16px_40px_-12px_rgba(0,0,0,0.6)]"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{t("nav.more")}</SheetTitle>
          </SheetHeader>

          <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/25" />

          <div
            className="px-4 pt-1"
            style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
          >
            <h2 className="px-3 pb-2 mb-1 border-b text-theme-sm font-medium">{t("nav.navigation")}</h2>
            <ul className="flex flex-col">
              {moreLinks.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setMoreOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/60 active:bg-muted"
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                          active ? "bg-primary text-white" : "bg-primary/10 text-primary"
                        )}
                      >
                        <Icon className="size-5" />
                      </span>
                      <span className="flex-1 text-sm font-medium">{label}</span>
                      <ChevronRight className="size-4 text-muted-foreground/50 rtl:-scale-x-100" />
                    </Link>
                  </li>
                );
              })}
            </ul>

            <h2 className="mt-4 px-3 pb-2 mb-1 border-b text-theme-sm font-medium">{t("nav.preferences")}</h2>
            <div className="flex flex-col">
              <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Languages className="size-5" />
                </span>
                <span className="flex-1 text-sm font-medium">{t("settings.language")}</span>
                <LanguageSwitcher variant="icon" />
              </div>

              <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {isDark ? <Moon className="size-5" /> : <Sun className="size-5" />}
                </span>
                <span className="flex-1 text-sm font-medium">{t("settings.appearance")}</span>
                <button
                  type="button"
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                  className="relative flex h-11 w-11 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:bg-accent"
                  aria-label={t("toggleDarkMode")}
                >
                  {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
                </button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Account sheet -- only reachable while signed in (guests are routed
          straight to /auth/login by handleAccountTap). */}
      <Sheet open={accountOpen} onOpenChange={setAccountOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85vh] overflow-y-auto rounded-t-3xl border-none shadow-[0_-16px_40px_-12px_rgba(0,0,0,0.18)] md:hidden dark:shadow-[0_-16px_40px_-12px_rgba(0,0,0,0.6)]"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{t("nav.account")}</SheetTitle>
          </SheetHeader>

          <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/25" />

          <div
            className="px-4 pt-1"
            style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
          >
            <Link
              href={dashboardHref}
              onClick={() => setAccountOpen(false)}
              className="flex items-center gap-3 rounded-xl bg-muted/60 px-3 py-3 transition-colors hover:bg-muted active:bg-muted"
            >
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className="bg-brand-50 text-brand-600 font-semibold dark:bg-brand-500/15 dark:text-brand-400">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold">{profile?.full_name || t("defaultUserName")}</p>
                  {profile?.role && (
                    <Badge className="h-4 shrink-0 bg-primary px-1.5 text-[10px] text-white">
                      {roleLabels[profile.role] || profile.role}
                    </Badge>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 rtl:-scale-x-100" />
            </Link>

            <h2 className="mt-4 px-3 pb-2 mb-1 border-b text-theme-sm font-medium">{t("nav.account")}</h2>
            <ul className="flex flex-col">
              {accountLinks.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/60 active:bg-muted"
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                          active ? "bg-primary text-white" : "bg-primary/10 text-primary"
                        )}
                      >
                        <Icon className="size-5" />
                      </span>
                      <span className="flex-1 text-sm font-medium">{label}</span>
                      <ChevronRight className="size-4 text-muted-foreground/50 rtl:-scale-x-100" />
                    </Link>
                  </li>
                );
              })}

              <li>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-colors hover:bg-destructive/5 active:bg-destructive/10"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                    <LogOut className="size-5 rtl:-scale-x-100" />
                  </span>
                  <span className="flex-1 text-sm font-medium text-destructive">{t("userMenu.logout")}</span>
                </button>
              </li>
            </ul>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
