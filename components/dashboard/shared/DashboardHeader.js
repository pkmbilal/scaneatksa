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

import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { Menu, X, Search, Sun, Moon } from 'lucide-react'
import { useDashboardSidebar } from '@/context/DashboardSidebarContext'
import NotificationDropdown from './NotificationDropdown'
import UserDropdown from './UserDropdown'

export default function DashboardHeader({
  user,
  profile,
  homeHref = '/dashboard',
  homeLabel = 'Dashboard',
  editProfileHref,
  notifications,
  extraActions,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useDashboardSidebar()
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
          <button
            type="button"
            className="flex items-center justify-center w-10 h-10 text-gray-500 border-gray-200 rounded-lg dark:border-gray-800 lg:h-11 lg:w-11 lg:border dark:text-gray-400"
            onClick={handleToggle}
            aria-label="Toggle sidebar"
          >
            {isMobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>

          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex items-center justify-center w-10 h-10 text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
            aria-label="Toggle header menu"
          >
            <Search className="size-5" />
          </button>

          <div className="hidden lg:block">
            <div className="relative">
              <span className="absolute -translate-y-1/2 left-4 top-1/2 pointer-events-none text-gray-500 dark:text-gray-400">
                <Search className="size-4" />
              </span>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search or type command..."
                className="h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-11 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[380px]"
              />
              <button
                type="button"
                className="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-[7px] py-[4.5px] text-xs -tracking-[0.2px] text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400"
                onClick={() => inputRef.current?.focus()}
              >
                <span>⌘</span>
                <span>K</span>
              </button>
            </div>
          </div>
        </div>

        <div
          className={`${
            isMenuOpen ? 'flex' : 'hidden'
          } items-center justify-between w-full gap-4 px-5 py-4 lg:flex shadow-theme-md lg:justify-end lg:px-0 lg:shadow-none`}
        >
          <div className="flex items-center gap-2 2xsm:gap-3">
            {extraActions}

            <button
              type="button"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              aria-label="Toggle dark mode"
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
            homeLabel={homeLabel}
            editProfileHref={editProfileHref}
          />
        </div>
      </div>
    </header>
  )
}
