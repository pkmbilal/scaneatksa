"use client";

import { useEffect, useState } from "react";
import Link from "@/components/LocaleLink";
import { useRouter, usePathname } from "next/navigation";
import { stripLocalePrefix } from "@/lib/seo";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { getSessionUser, getUserProfile, signOut } from "@/lib/auth/client";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import {
  LayoutDashboard,
  UserRoundPen,
  LogOut,
  ShieldUser,
  Gauge,
  Headset,
  Sun,
  Moon,
  PanelLeftOpen,
  PanelRightOpen,
  Info,
  UtensilsCrossed,
  ShoppingCart,
  KeyRound,
  ChevronRight,
} from "lucide-react";

import Image from "next/image";

export default function Navbar() {
  const t = useTranslations("common");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");

  const router = useRouter();
  // Arabic public pages live under /ar (see lib/seo.js); compare routes
  // without the prefix.
  const pathname = stripLocalePrefix(usePathname() || "/");
  const { isRTL } = useLanguage();
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // ✅ compute this early, but DON'T return yet (hooks must run first)
  const hideNavbar =
    pathname?.startsWith("/auth/") ||
    pathname === "/dashboard" ||
    pathname?.startsWith("/dashboard/admin") ||
    pathname?.startsWith("/dashboard/owner") ||
    pathname?.startsWith("/dashboard/customer") ||
    pathname?.startsWith("/dashboard/kitchen") ||
    pathname?.startsWith("/dashboard/waiter");

  // Only the home page gets a transparent header floating over its photo
  // hero; every other route keeps the normal solid sticky bar.
  const isHome = pathname === "/";
  // Change-password is a dashboard-adjacent utility page: it gets this bar's
  // logo+page-pill on mobile (matching every other page), but never on
  // desktop, where it already has its own "Back to Dashboard" link.
  const isChangePassword = pathname?.startsWith("/dashboard/change-password");
  // The QR menu page is the one exception to "no top nav on mobile" -- it's
  // the only route whose mobile hamburger (language/theme/account access)
  // still lives inside this header, so it must stay visible there.
  const isMenuPage = pathname?.startsWith("/menu/");
  const [isScrolled, setIsScrolled] = useState(false);
  const isTransparent = isHome && !isScrolled;

  useEffect(() => {
    if (!isHome) return;

    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHome]);

  useEffect(() => {
    // ✅ if navbar is hidden, don't do auth/profile loading
    if (hideNavbar) return;
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hideNavbar, pathname]);

  async function loadUser() {
    const { user: currentUser } = await getSessionUser();

    if (currentUser) {
      setUser(currentUser);
      const { data: userProfile } = await getUserProfile(currentUser.id);
      setProfile(userProfile);
    } else {
      setUser(null);
      setProfile(null);
    }
  }

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      if (!search.trim()) return;
      router.push(`/?q=${encodeURIComponent(search)}`);
      setMobileOpen(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setProfile(null);
    setMobileOpen(false);
    router.push("/");
  };

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

  const getDashboardLink = () => {
    if (profile?.role === "admin") return "/dashboard/admin";
    if (profile?.role === "owner") return "/dashboard/owner";
    return "/dashboard/customer";
  };

  const roleLabels = {
    admin: t("roleLabels.admin"),
    owner: t("roleLabels.owner"),
    customer: t("roleLabels.customer"),
    kitchen: t("roleLabels.kitchen"),
    waiter: t("roleLabels.waiter"),
  };
  const getRoleLabel = () => roleLabels[profile?.role] || profile?.role;

  // ✅ safe to return AFTER hooks
  if (hideNavbar) return null;

  // active helper for mobile list highlighting
  const isActive = (href) => {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  // Stronger hover/keyboard highlight for the account menu items than the
  // near-white default `focus:bg-accent`.
  const menuItemClass =
    "focus:bg-primary/10 focus:text-primary font-medium transition-colors";

  const navLinkClass = isTransparent
    ? "text-md font-semibold text-white/90 hover:text-white transition-colors"
    : "text-md font-semibold hover:text-primary transition-colors";

  // Mobile-only page pill shown at the end of the bar (balances the logo,
  // which otherwise sits alone since the full nav/account controls are
  // desktop-only). No entry for the QR menu page -- it already fills that
  // spot with its own hamburger trigger.
  const pageBadge =
    pathname === "/about"
      ? { label: t("nav.about"), icon: Info }
      : pathname === "/how-it-works"
        ? { label: t("nav.howItWorks"), icon: Gauge }
        : pathname === "/restaurants"
          ? { label: t("nav.restaurants"), icon: UtensilsCrossed }
          : pathname === "/contact"
            ? { label: t("nav.contact"), icon: Headset }
            : pathname === "/cart"
              ? { label: t("nav.cart"), icon: ShoppingCart }
              : isChangePassword
                ? { label: t("userMenu.changePassword"), icon: KeyRound }
                : null;

  return (
    <header
      className={`relative z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 ${
        isHome ? "hidden md:block" : isChangePassword ? "md:hidden" : ""
      } ${
        isHome ? `md:fixed md:inset-x-0 ${isTransparent ? "md:top-4" : "md:top-0"}` : "md:sticky md:top-0"
      } ${isTransparent ? "md:bg-transparent md:border-transparent md:backdrop-blur-none" : ""}`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 gap-6">
        {/* Logo */}
        <Link
          href="/"
        >
          <Image
            src="/scaneat-logo.png"
            alt="ScanEat Logo"
            width={64}
            height={64}
            className={`rounded-full transition-shadow duration-300 ${isTransparent ? "shadow-md" : ""}`}
          />
        </Link>

        {/* Mobile-only page pill */}
        {pageBadge && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3.5 py-2 text-sm font-medium text-foreground md:hidden">
            <pageBadge.icon className="size-4 text-primary" />
            <span className="truncate">{pageBadge.label}</span>
          </span>
        )}

        {/* Desktop Nav */}
        <div className="hidden md:flex justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <p>
              <Link href="/about" className={navLinkClass}>
                {t("nav.about")}
              </Link>
            </p>
            <p>
              <Link href="/how-it-works" className={navLinkClass}>
                {t("nav.howItWorks")}
              </Link>
            </p>
            <p>
              <Link href="/restaurants" className={navLinkClass}>
                {t("nav.restaurants")}
              </Link>
            </p>
            <p>
              <Link href="/contact" className={navLinkClass}>
                {t("nav.contact")}
              </Link>
            </p>
          </div>
        </div>

        {/* Desktop Right */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher light={isTransparent} />

          {user && profile ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild className="cursor-pointer">
                <Button
                  variant="ghost"
                  className={`group h-10 gap-2 px-2 ${
                    isTransparent
                      ? "hover:bg-white/15 data-[state=open]:bg-white/15"
                      : "hover:bg-muted/60 data-[state=open]:bg-muted/60"
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-orange-400 to-red-500 text-white">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex flex-col items-start leading-tight">
                    <span className={`text-sm font-medium ${isTransparent ? "text-white" : "text-foreground"}`}>
                      {profile.full_name || t("defaultUserName")}
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-white text-xs h-4 px-1 bg-primary pb-1"
                    >
                      {getRoleLabel()}
                    </Badge>
                  </div>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuItem asChild className={menuItemClass}>
                  <Link href={getDashboardLink()} className="cursor-pointer">
                    <span className="me-1">
                      <LayoutDashboard color="#00c951" size={20} />
                    </span>
                    {t("userMenu.dashboard")}
                  </Link>
                </DropdownMenuItem>

                {profile.role === "customer" && (
                  <DropdownMenuItem asChild className={menuItemClass}>
                    <Link
                      href="/dashboard/customer/request-restaurant"
                      className="cursor-pointer"
                    >
                      <span className="me-1">
                        <ShieldUser color="#00c951" size={20} />
                      </span>
                      {t("userMenu.requestOwnerAccess")}
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem asChild className={menuItemClass}>
                  <Link
                    href="/dashboard/customer/edit-profile"
                    className="cursor-pointer"
                  >
                    <span className="me-1">
                      <UserRoundPen color="#00c951" size={20} />
                    </span>
                    {t("userMenu.editProfile")}
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleLogout}
                  className={`cursor-pointer ${menuItemClass}`}
                >
                  <span className="me-2">
                    <LogOut color="#00c951" size={20} className="rtl:-scale-x-100" />
                  </span>
                  {t("userMenu.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link href="/auth/login">{t("guest.loginSignup")}</Link>
            </Button>
          )}
        </div>

        {/* Mobile — only the QR menu page still uses this drawer; every other
            route now gets its primary nav from the bottom MobileTabBar, whose
            "More" tab covers these same links/actions. */}
        {isMenuPage && (
        <div className="md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label={t("openMenu")}
                className="relative flex items-center justify-center w-10 h-10 text-white transition-colors rounded-full shadow-theme-xs bg-gradient-to-br from-primary to-green-600 hover:opacity-90"
              >
                {isRTL ? (
                  <PanelRightOpen className="size-5" />
                ) : (
                  <PanelLeftOpen className="size-5" />
                )}
              </button>
            </SheetTrigger>

            {/* ✅ IMPORTANT: SheetContent must stay INSIDE Sheet */}
            {/* Same slide-in side, width and color scheme as the dashboard
                sidebar's mobile panel (components/dashboard/shared/DashboardSidebar.js):
                it opens from the start edge (left in LTR, right in RTL), not
                the trailing edge a Sheet defaults to. */}
            <SheetContent
              side={isRTL ? "right" : "left"}
              className="w-[290px] p-0 flex flex-col bg-white border-gray-200 text-gray-900 dark:bg-gray-900 dark:border-gray-800 dark:text-white"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>ScanEat — {t("brand.tagline")}</SheetTitle>
              </SheetHeader>

              {/* Logo header */}
              <div className="px-5 py-8">
                <Link href="/" onClick={() => setMobileOpen(false)}>
                  <Image src="/scaneat-logo.png" alt="ScanEat Logo" width={72} height={72} priority />
                </Link>
              </div>

              {/* Scrollable nav links */}
              <div className="flex-1 overflow-y-auto px-5 no-scrollbar">
                <h2 className="mb-1 border-b border-gray-200 px-3 pb-2 text-theme-sm font-medium text-gray-900 dark:border-gray-800 dark:text-white">
                  {t("nav.navigation")}
                </h2>
                <ul className="flex flex-col">
                  {[
                    { href: "/about", label: t("nav.about"), icon: Info },
                    { href: "/restaurants", label: t("nav.restaurants"), icon: UtensilsCrossed },
                    { href: "/how-it-works", label: t("nav.howItWorks"), icon: Gauge },
                    { href: "/contact", label: t("nav.contact"), icon: Headset },
                  ].map(({ href, label, icon: Icon }) => {
                    const active = isActive(href);
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
                        >
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                              active ? "bg-primary text-white" : "bg-primary/10 text-primary"
                            }`}
                          >
                            <Icon className="size-5" />
                          </span>
                          <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">{label}</span>
                          <ChevronRight className="size-4 text-gray-400 rtl:-scale-x-100" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Language switcher, theme toggle & user menu — pinned to the
                  bottom, identical markup/colors to the dashboard sidebar's
                  mobile panel. */}
              <div className="shrink-0 border-t border-gray-200 px-5 py-4 dark:border-gray-800">
                <div className="flex items-center gap-3 pb-4">
                  <LanguageSwitcher variant="icon" />
                  <button
                    type="button"
                    onClick={() => setTheme(isDark ? "light" : "dark")}
                    className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                    aria-label={t("toggleDarkMode")}
                  >
                    {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
                  </button>
                </div>

                {user && profile ? (
                  <>
                    <div className="flex items-center gap-3 rounded-xl bg-gray-100 p-3 dark:bg-white/5">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-brand-50 text-brand-600 font-semibold dark:bg-brand-500/15 dark:text-brand-400">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                          {profile.full_name || t("defaultUserName")}
                        </p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <ul className="mt-3 flex flex-col">
                      {[
                        { href: getDashboardLink(), label: t("userMenu.dashboard"), icon: LayoutDashboard },
                        { href: "/dashboard/customer/edit-profile", label: t("userMenu.editProfile"), icon: UserRoundPen },
                        ...(profile.role === "customer"
                          ? [{ href: "/dashboard/customer/request-restaurant", label: t("userMenu.requestOwnerAccess"), icon: ShieldUser }]
                          : []),
                      ].map(({ href, label, icon: Icon }) => {
                        const active = isActive(href);
                        return (
                          <li key={href}>
                            <Link
                              href={href}
                              onClick={() => setMobileOpen(false)}
                              className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
                            >
                              <span
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                  active ? "bg-primary text-white" : "bg-primary/10 text-primary"
                                }`}
                              >
                                <Icon className="size-5" />
                              </span>
                              <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">{label}</span>
                              <ChevronRight className="size-4 text-gray-400 rtl:-scale-x-100" />
                            </Link>
                          </li>
                        );
                      })}

                      <li>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                            <LogOut className="size-5 rtl:-scale-x-100" />
                          </span>
                          <span className="flex-1 text-sm font-medium text-red-600 dark:text-red-400">
                            {t("userMenu.logout")}
                          </span>
                        </button>
                      </li>
                    </ul>
                  </>
                ) : (
                  <div className="rounded-2xl bg-gray-100 p-4 dark:bg-white/5">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {t("guest.welcomeTitle")}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t("guest.welcomeSubtitle")}
                    </p>

                    <Button
                      className="w-full mt-3 rounded-xl bg-primary hover:bg-green-700"
                      asChild
                    >
                      <Link
                        href="/auth/login"
                        onClick={() => setMobileOpen(false)}
                      >
                        {t("guest.loginSignup")}
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
        )}
      </div>
    </header>
  );
}
