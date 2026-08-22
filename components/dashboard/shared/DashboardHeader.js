'use client'

// Top bar shared by all role dashboards. Ported from TailAdmin's
// layout/AppHeader.tsx: sidebar toggle, search field (⌘K focus), dark-mode
// toggle, notifications, user menu. Dark mode is wired to the project's
// existing `next-themes` instead of porting TailAdmin's own ThemeContext
// (avoids two theme systems).
//
// The notification bell is optional — pass `notifications` to show it (e.g.
// admin wires it to pending restaurant-owner requests); omit it for
// dashboards that don't need one yet.

import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, Search, Sun, Moon, PanelLeftOpen, PanelRightOpen } from 'lucide-react'
import { useDashboardSidebar } from '@/context/DashboardSidebarContext'
import { useLanguage } from '@/context/LanguageContext'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import NotificationDropdown from './NotificationDropdown'
import UserDropdown from './UserDropdown'

export default function DashboardHeader({
  user,
  profile,
  homeHref = '/dashboard',
  homeLabel,
  editProfileHref,
  notifications,
  extraActions,
}) {
  const t = useTranslations('dashboard.common')
  const resolvedHomeLabel = homeLabel ?? t('dashboardLabel')
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useDashboardSidebar()
  const { isRTL } = useLanguage()
  const { setTheme, resolvedTheme } = useTheme()
  const inputRef = useRef(null)

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar()
    } else {
      toggleMobileSidebar()
    }
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <header className="sticky top-0 z-[998] flex w-full bg-white border-gray-200 dark:border-gray-800 dark:bg-gray-900 lg:border-b">
      <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">
        <div className="flex items-center justify-between w-full gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
          {/* Logo — mobile only; the expanded/hovered sidebar already shows it on lg+ */}
          <Link href="/" className="flex items-center lg:hidden">
            <Image src="/icon-only-logo.svg" alt="ScanEat" width={32} height={32} priority />
          </Link>

          {/* Desktop sidebar collapse/expand toggle */}
          <button
            type="button"
            className="hidden items-center justify-center text-gray-500 border-gray-200 rounded-lg dark:border-gray-800 lg:flex lg:h-11 lg:w-11 lg:border dark:text-gray-400"
            onClick={handleToggle}
            aria-label={t('header.toggleSidebar')}
          >
            <Menu className="size-5" />
          </button>

          {/* Mobile-only: notifications + slide-panel trigger */}
          <div className="flex items-center gap-2 lg:hidden">
            {notifications && (
              <NotificationDropdown
                items={notifications.items}
                title={notifications.title}
                emptyText={notifications.emptyText}
                viewAllLabel={notifications.viewAllLabel}
                onViewAll={notifications.onViewAll}
              />
            )}

            <button
              type="button"
              onClick={handleToggle}
              className="relative flex items-center justify-center w-10 h-10 text-white transition-colors rounded-full shadow-theme-xs bg-gradient-to-br from-primary to-green-600 hover:opacity-90"
              aria-label={t('header.toggleSidebar')}
            >
              {isMobileOpen ? (
                <X className="size-5" />
              ) : isRTL ? (
                <PanelRightOpen className="size-5" />
              ) : (
                <PanelLeftOpen className="size-5" />
              )}
            </button>
          </div>

          <div className="hidden lg:block">
            <div className="relative">
              <span className="absolute -translate-y-1/2 start-4 top-1/2 pointer-events-none text-gray-500 dark:text-gray-400">
                <Search className="size-4" />
              </span>
              <input
                ref={inputRef}
                type="text"
                placeholder={t('header.searchPlaceholder')}
                className="h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 ps-11 pe-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[380px]"
              />
              <button
                type="button"
                className="absolute end-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-[7px] py-[4.5px] text-xs -tracking-[0.2px] text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400"
                onClick={() => inputRef.current?.focus()}
              >
                <span>⌘</span>
                <span>K</span>
              </button>
            </div>
          </div>
        </div>

        <div className="hidden items-center justify-between w-full gap-4 px-5 py-4 lg:flex lg:justify-end lg:px-0 lg:shadow-none">
          <div className="flex items-center gap-2 2xsm:gap-3">
            {extraActions}

            <LanguageSwitcher variant="icon" />

            <button
              type="button"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              aria-label={t('header.toggleDarkMode')}
            >
              {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </button>

            {notifications && (
              <NotificationDropdown
                items={notifications.items}
                title={notifications.title}
                emptyText={notifications.emptyText}
                viewAllLabel={notifications.viewAllLabel}
                onViewAll={notifications.onViewAll}
              />
            )}
          </div>

          <UserDropdown
            user={user}
            profile={profile}
            homeHref={homeHref}
            homeLabel={resolvedHomeLabel}
            editProfileHref={editProfileHref}
          />
        </div>
      </div>
    </header>
  )
}
