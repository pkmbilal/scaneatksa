'use client'

// Ported from TailAdmin's components/header/NotificationDropdown.tsx.
// Shared by all role dashboards — the caller supplies the list of items and
// their labels/copy (e.g. admin wires it to pending restaurant-owner
// requests; other dashboards can wire it to their own notifications, or omit
// it from DashboardHeader entirely).

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Bell } from 'lucide-react'
import { Dropdown } from './ui/Dropdown'
import { DropdownItem } from './ui/DropdownItem'

function timeAgo(dateString, t) {
  const diffMs = Date.now() - new Date(dateString).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return t('notifications.justNow')
  if (minutes < 60) return t('notifications.minutesAgo', { minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('notifications.hoursAgo', { hours })
  const days = Math.floor(hours / 24)
  return t('notifications.daysAgo', { days })
}

export default function NotificationDropdown({
  items = [],
  title,
  emptyText,
  viewAllLabel,
  onViewAll,
}) {
  const t = useTranslations('dashboard.common')
  const resolvedTitle = title ?? t('notifications.title')
  const resolvedEmptyText = emptyText ?? t('notifications.empty')
  const resolvedViewAllLabel = viewAllLabel ?? t('notifications.viewAll')
  const [isOpen, setIsOpen] = useState(false)
  const hasItems = items.length > 0

  const toggleDropdown = () => setIsOpen((prev) => !prev)
  const closeDropdown = () => setIsOpen(false)

  return (
    <div className="relative">
      <button
        type="button"
        className="dropdown-toggle relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
        aria-label={resolvedTitle}
      >
        {hasItems && (
          <span className="absolute end-1.5 top-1.5 z-10 h-2 w-2 rounded-full bg-orange-400">
            <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping" />
          </span>
        )}
        <Bell className="size-5" />
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -end-[240px] mt-[17px] flex max-h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:end-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {resolvedTitle}
          </h5>
        </div>

        {!hasItems ? (
          <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {resolvedEmptyText}
          </p>
        ) : (
          <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
            {items.slice(0, 6).map((request) => (
              <li key={request.id}>
                <DropdownItem
                  onItemClick={() => {
                    closeDropdown()
                    onViewAll?.()
                  }}
                  className="flex flex-col gap-1 rounded-lg border-b border-gray-100 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
                >
                  <span className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                    {request.restaurant_name}
                  </span>
                  <span className="text-theme-xs text-gray-500 dark:text-gray-400">
                    {request.user_profiles?.full_name || request.user_profiles?.email || t('notifications.unknownUser')}
                  </span>
                  <span className="flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400">
                    <span>{t('notifications.request')}</span>
                    <span className="w-1 h-1 bg-gray-400 rounded-full" />
                    <span>{timeAgo(request.created_at, t)}</span>
                  </span>
                </DropdownItem>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={() => {
            closeDropdown()
            onViewAll?.()
          }}
          className="block px-4 py-2 mt-3 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          {resolvedViewAllLabel}
        </button>
      </Dropdown>
    </div>
  )
}
