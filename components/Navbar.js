"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { getCurrentUser, getUserProfile, signOut } from "@/lib/auth/client";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
  Menu,
  LayoutDashboard,
  UserRoundPen,
  LogOut,
  ShieldUser,
  Pizza,
  Gauge,
  Headset,
  House,
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
    const { user: currentUser } = await getCurrentUser();

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

  const mobileLinkClass = (active = false) =>
    `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
      active ? "bg-primary/10 text-primary" : "hover:bg-accent"
    }`;

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
              <Button variant="ghost" size="icon" aria-label={t("openMenu")}>
                <Menu className="!h-6 !w-6" color="#00c951" />
              </Button>
            </SheetTrigger>

            {/* ✅ IMPORTANT: SheetContent must stay INSIDE Sheet */}
            <SheetContent
              side={isRTL ? "left" : "right"}
              className="w-[320px] sm:w-[380px] p-0 flex flex-col"
            >
              {/* Top Header (delivery app style) */}
              <div className="px-4 pt-4">
                <SheetHeader className="space-y-0">
                  <SheetTitle className="flex items-center gap-2">
                    <span className="text-2xl">
                      <Pizza size={32} color="#00c951" />
                    </span>
                    <div className="leading-tight">
                      <p className="font-bold text-base ">ScanEat</p>
                      <p className="text-xs text-muted-foreground">{t("brand.tagline")}</p>
                    </div>
                  </SheetTitle>
                </SheetHeader>
              </div>

              {/* Scroll area */}
              <div className="flex-1 overflow-auto px-4 pb-4">
                <div className="mb-4">
                  <LanguageSwitcher className="w-full justify-center" />
                </div>

                {/* User card */}
                {user && profile ? (
                  <div className="rounded-xl border p-4 mb-4 bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-green-500 text-white text-sm">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate text-sm">
                          {profile.full_name || t("defaultUserName")}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>

                        <div className="mt-2">
                          <Badge className="bg-primary text-white text-xs rounded-full px-2 py-0.5">
                            {getRoleLabel()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border p-4 mb-4 bg-muted/30">
                    <p className="text-sm font-semibold">{t("guest.welcomeTitle")}</p>
                    <p className="text-xs text-muted-foreground mt-1">
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

                {/* Links */}
                <div className="space-y-1">
                  {user && profile && (
                    <>
                      {/* <Separator className="my-3" /> */}

                      <Link
                        href={getDashboardLink()}
                        onClick={() => setMobileOpen(false)}
                        className={mobileLinkClass(isActive("/dashboard"))}
                      >
                        <LayoutDashboard className="h-5 w-5 text-primary" />
                        {t("userMenu.dashboard")}
                      </Link>

                      <Link
                        href="/dashboard/customer/edit-profile"
                        onClick={() => setMobileOpen(false)}
                        className={mobileLinkClass(
                          isActive("/dashboard/customer/edit-profile"),
                        )}
                      >
                        <UserRoundPen className="h-5 w-5 text-primary" />
                        {t("userMenu.editProfile")}
                      </Link>

                      {profile.role === "customer" && (
                        <Link
                          href="/dashboard/request-restaurant"
                          onClick={() => setMobileOpen(false)}
                          className={mobileLinkClass(
                            isActive("/dashboard/request-restaurant"),
                          )}
                        >
                          <ShieldUser className="h-5 w-5 text-primary" />
                          {t("userMenu.requestOwnerAccess")}
                        </Link>
                      )}
                    </>
                  )}
                  <Link
                    href="/about"
                    onClick={() => setMobileOpen(false)}
                    className={mobileLinkClass(isActive("/about"))}
                  >
                    <House className="h-5 w-5 text-primary" />
                    {t("nav.about")}
                  </Link>

                  <Link
                    href="/restaurants"
                    onClick={() => setMobileOpen(false)}
                    className={mobileLinkClass(isActive("/restaurants"))}
                  >
                    <Pizza className="h-5 w-5 text-primary" />
                    {t("nav.restaurants")}
                  </Link>

                  <Link
                    href="/#how-it-works"
                    onClick={() => setMobileOpen(false)}
                    className={mobileLinkClass(false)}
                  >
                    <span className="text-lg">
                      <Gauge color="#00c951" size={20} />
                    </span>
                    {t("nav.howItWorks")}
                  </Link>

                  <Link
                    href="/contact"
                    onClick={() => setMobileOpen(false)}
                    className={mobileLinkClass(isActive("/restaurants"))}
                  >
                    <Headset className="h-5 w-5 text-primary" />
                    {t("nav.contact")}
                  </Link>
                </div>
              </div>

              {/* Bottom action */}
              {user && profile && (
                <div className="p-3 border-t mb-4">
                  <Button
                    variant="destructive"
                    className="w-full rounded-xl bg-primary"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 me-2 rtl:-scale-x-100" />
                    {t("userMenu.logout")}
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
