"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
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
  Pizza,
  Gauge,
  Headset,
  House,
  Sun,
  Moon,
  PanelLeftOpen,
  PanelRightOpen,
} from "lucide-react";

import Image from "next/image";

export default function Navbar() {
  const t = useTranslations("common");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");

  const router = useRouter();
  const pathname = usePathname();
  const { isRTL } = useLanguage();
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // ✅ compute this early, but DON'T return yet (hooks must run first)
  const hideNavbar =
    pathname?.startsWith("/auth/") ||
    pathname === "/dashboard" ||
    pathname?.startsWith("/dashboard/admin") ||
    pathname?.startsWith("/dashboard/owner") ||
    pathname?.startsWith("/dashboard/customer");

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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 gap-6">
        {/* Logo */}
        <Link
          href="/"
        >
          <Image src="/logo.svg" alt="ScanEat Logo" width={180} height={50}/>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <p>
              <Link
                href="/about"
                className="text-md font-semibold hover:text-primary transition-colors"
              >
                {t("nav.about")}
              </Link>
            </p>
            <p>
              <Link
                href="/#how-it-works"
                className="text-md font-semibold hover:text-primary transition-colors"
              >
                {t("nav.howItWorks")}
              </Link>
            </p>
            <p>
              <Link
                href="/restaurants"
                className="text-md font-semibold hover:text-primary transition-colors"
              >
                {t("nav.restaurants")}
              </Link>
            </p>
            <p>
              <Link
                href="/contact"
                className="text-md font-semibold hover:text-primary transition-colors"
              >
                {t("nav.contact")}
              </Link>
            </p>
          </div>
        </div>

        {/* Desktop Right */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />

          {user && profile ? (
            <DropdownMenu >
              <DropdownMenuTrigger asChild className="cursor-pointer">
                <Button variant="ghost" className="h-10 gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-orange-400 to-red-500 text-white">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-sm font-medium">
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
                <DropdownMenuItem asChild>
                  <Link href={getDashboardLink()} className="cursor-pointer">
                    <span className="me-1">
                      <LayoutDashboard color="#00c951" size={20} />
                    </span>
                    {t("userMenu.dashboard")}
                  </Link>
                </DropdownMenuItem>

                {profile.role === "customer" && (
                  <DropdownMenuItem asChild>
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

                <DropdownMenuItem asChild>
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
                  className="cursor-pointer"
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

        {/* Mobile */}
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
                  <Image src="/logo.svg" alt="ScanEat Logo" width={140} height={38} priority />
                </Link>
              </div>

              {/* Scrollable nav links */}
              <div className="flex-1 overflow-y-auto px-5 no-scrollbar">
                <ul className="flex flex-col gap-1">
                  <li>
                    <Link
                      href="/about"
                      onClick={() => setMobileOpen(false)}
                      className={`menu-item ${isActive("/about") ? "menu-item-active" : "menu-item-inactive"}`}
                    >
                      <House className="size-5" />
                      {t("nav.about")}
                    </Link>
                  </li>

                  <li>
                    <Link
                      href="/restaurants"
                      onClick={() => setMobileOpen(false)}
                      className={`menu-item ${isActive("/restaurants") ? "menu-item-active" : "menu-item-inactive"}`}
                    >
                      <Pizza className="size-5" />
                      {t("nav.restaurants")}
                    </Link>
                  </li>

                  <li>
                    <Link
                      href="/#how-it-works"
                      onClick={() => setMobileOpen(false)}
                      className="menu-item menu-item-inactive"
                    >
                      <Gauge className="size-5" />
                      {t("nav.howItWorks")}
                    </Link>
                  </li>

                  <li>
                    <Link
                      href="/contact"
                      onClick={() => setMobileOpen(false)}
                      className={`menu-item ${isActive("/contact") ? "menu-item-active" : "menu-item-inactive"}`}
                    >
                      <Headset className="size-5" />
                      {t("nav.contact")}
                    </Link>
                  </li>
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
                    <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-800">
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

                    <ul className="flex flex-col gap-1 mt-3">
                      <li>
                        <Link
                          href={getDashboardLink()}
                          onClick={() => setMobileOpen(false)}
                          className={`menu-item ${isActive("/dashboard") ? "menu-item-active" : "menu-item-inactive"}`}
                        >
                          <LayoutDashboard className="size-5" />
                          {t("userMenu.dashboard")}
                        </Link>
                      </li>

                      <li>
                        <Link
                          href="/dashboard/customer/edit-profile"
                          onClick={() => setMobileOpen(false)}
                          className={`menu-item ${isActive("/dashboard/customer/edit-profile") ? "menu-item-active" : "menu-item-inactive"}`}
                        >
                          <UserRoundPen className="size-5" />
                          {t("userMenu.editProfile")}
                        </Link>
                      </li>

                      {profile.role === "customer" && (
                        <li>
                          <Link
                            href="/dashboard/request-restaurant"
                            onClick={() => setMobileOpen(false)}
                            className={`menu-item ${isActive("/dashboard/request-restaurant") ? "menu-item-active" : "menu-item-inactive"}`}
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
                  <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
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
      </div>
    </header>
  );
}
