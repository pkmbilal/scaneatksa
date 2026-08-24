'use client'

// Left sidebar nav shared by all role dashboards (admin/owner/customer).
// Structure/behavior ported from TailAdmin's layout/AppSidebar.tsx
// (github.com/TailAdmin/free-nextjs-admin-dashboard): same collapse/hover/
// mobile-open mechanics and menu-item styling. Simplified vs. the original —
// our nav is a flat list of dashboard sections (no sub-menus), and items
// switch the page's `activeTab` state instead of routing, since each
// dashboard still renders everything client-side.

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { LogOut, Sun, Moon, UserRoundPen, ShieldUser, KeyRound } from 'lucide-react'
import { useDashboardSidebar } from '@/context/DashboardSidebarContext'
import { useLanguage } from '@/context/LanguageContext'
import { signOut } from '@/lib/auth/client'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export default function DashboardSidebar({
  navItems,
  activeTab,
  onSelectTab,
  siteNavItems,
  user,
  profile,
  homeLabel,
  editProfileHref = '/dashboard/customer/edit-profile',
}) {
  const t = useTranslations('dashboard.common')
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleMobileSidebar } = useDashboardSidebar()
  const { isRTL } = useLanguage()
  const { setTheme, resolvedTheme } = useTheme()
  const pathname = usePathname()
  const router = useRouter()
  const isDark = resolvedTheme === 'dark'

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return user?.email?.[0]?.toUpperCase() || 'U'
  }

  const handleSignOut = async () => {
    toggleMobileSidebar()
    await signOut()
    router.push('/')
  }

  const showLabels = isExpanded || isHovered || isMobileOpen
  const showFullLogo = isExpanded || isMobileOpen

  return (
    <aside
      className={`fixed flex flex-col top-0 px-5 start-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-[999] border-e border-gray-200
        w-[290px] ${isExpanded || isHovered ? 'lg:w-[290px]' : 'lg:w-[90px]'}
        ${
          // Resolved from isRTL in JS rather than an rtl: variant class: an
          // unprefixed off-canvas class and a Tailwind rtl: class carry equal
          // specificity, so which one wins against lg:translate-x-0 below is
          // cascade-order luck (it lost in practice, hiding the sidebar at
          // every screen size in Arabic). Keeping only one off-canvas class
          // here preserves the plain mobile-first override that already works.
          isMobileOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'
        }
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`py-8 flex ${!showFullLogo ? 'lg:justify-center' : 'justify-start'}`}>
        {showFullLogo ? (
          <Image src="/logo.svg" alt="ScanEat Logo" width={140} height={38} priority />
        ) : (
          <Image src="/icon-only-logo.svg" alt="ScanEat Logo" width={32} height={32} priority />
        )}
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !showLabels ? 'lg:justify-center' : 'justify-start'
                }`}
              >
                {showLabels ? t('sidebar.menu') : '•••'}
              </h2>

              <ul className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const isActive = activeTab === item.key
                  const Icon = item.icon
                  return (
                    <li key={item.key}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTab(item.key)
                          if (isMobileOpen) toggleMobileSidebar()
                        }}
                        style={{ gap: showLabels ? '0.75rem' : '0px' }}
                        className={`menu-item group cursor-pointer transition-all duration-300 ease-in-out ${
                          isActive ? 'menu-item-active' : 'menu-item-inactive'
                        } ${!showLabels ? 'lg:justify-center' : 'lg:justify-start'}`}
                      >
                        <span className={`relative ${isActive ? 'menu-item-icon-active' : 'menu-item-icon-inactive'}`}>
                          <Icon className="size-5" />
                          {item.alert && (
                            <span className="absolute -end-0.5 -top-0.5 flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-400" />
                            </span>
                          )}
                        </span>
                        <span
                          className={`menu-item-text overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out max-w-[160px] opacity-100 ${
                            showLabels ? 'lg:max-w-[160px] lg:opacity-100' : 'lg:max-w-0 lg:opacity-0'
                          }`}
                        >
                          {item.label}
                        </span>
                        {typeof item.count === 'number' && item.count > 0 && (
                          <span
                            className={`ms-auto overflow-hidden rounded-full bg-brand-50 text-xs font-semibold text-brand-600 transition-all duration-300 ease-in-out dark:bg-brand-500/15 dark:text-brand-400 max-w-[40px] px-2 py-0.5 opacity-100 ${
                              showLabels ? 'lg:max-w-[40px] lg:px-2 lg:py-0.5 lg:opacity-100' : 'lg:max-w-0 lg:px-0 lg:py-0.5 lg:opacity-0'
                            }`}
                          >
                            {item.count}
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>

            {siteNavItems && siteNavItems.length > 0 && (
              <div>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                    !showLabels ? 'lg:justify-center' : 'justify-start'
                  }`}
                >
                  {showLabels ? t('sidebar.navigation') : '•••'}
                </h2>

                <ul className="flex flex-col gap-1">
                  {siteNavItems.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                    const Icon = item.icon
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => {
                            if (isMobileOpen) toggleMobileSidebar()
                          }}
                          style={{ gap: showLabels ? '0.75rem' : '0px' }}
                          className={`menu-item group cursor-pointer transition-all duration-300 ease-in-out ${
                            isActive ? 'menu-item-active' : 'menu-item-inactive'
                          } ${!showLabels ? 'lg:justify-center' : 'lg:justify-start'}`}
                        >
                          <span className={isActive ? 'menu-item-icon-active' : 'menu-item-icon-inactive'}>
                            <Icon className="size-5" />
                          </span>
                          <span
                            className={`menu-item-text overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out max-w-[160px] opacity-100 ${
                              showLabels ? 'lg:max-w-[160px] lg:opacity-100' : 'lg:max-w-0 lg:opacity-0'
                            }`}
                          >
                            {item.label}
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Language switcher, theme toggle & user menu — mobile-only; on lg+ these
          live in DashboardHeader's desktop row instead. */}
      {user && (
        <div className="mt-auto shrink-0 overflow-hidden border-t border-gray-200 py-4 dark:border-gray-800 lg:hidden">
          <div className="flex items-center gap-3 pb-4">
            <LanguageSwitcher variant="icon" />
            <button
              type="button"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              aria-label={t('header.toggleDarkMode')}
            >
              {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </button>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-800">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-brand-50 text-brand-600 font-semibold dark:bg-brand-500/15 dark:text-brand-400">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                {profile?.full_name || homeLabel || t('dashboardLabel')}
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
          </div>

          <ul className="flex flex-col gap-1 mt-3">
            <li>
              <Link
                href={editProfileHref}
                onClick={toggleMobileSidebar}
                className="menu-item menu-item-inactive"
              >
                <UserRoundPen className="size-5" />
                {t('userMenu.editProfile')}
              </Link>
            </li>

            {profile?.role === 'customer' && (
              <li>
                <Link
                  href="/dashboard/customer/request-restaurant"
                  onClick={toggleMobileSidebar}
                  className="menu-item menu-item-inactive"
                >
                  <ShieldUser className="size-5" />
                  {t('userMenu.requestOwnerAccess')}
                </Link>
              </li>
            )}

            <li>
              <Link
                href="/dashboard/change-password"
                onClick={toggleMobileSidebar}
                className="menu-item menu-item-inactive"
              >
                <KeyRound className="size-5" />
                {t('userMenu.changePassword')}
              </Link>
            </li>

            <li>
              <button
                type="button"
                onClick={handleSignOut}
                className="menu-item menu-item-inactive cursor-pointer"
              >
                <LogOut className="size-5 rtl:-scale-x-100" />
                {t('userMenu.signOut')}
              </button>
            </li>
          </ul>
        </div>
      )}
    </aside>
  )
}
