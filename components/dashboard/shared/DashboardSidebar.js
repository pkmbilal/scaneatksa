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
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useDashboardSidebar } from '@/context/DashboardSidebarContext'
import { useLanguage } from '@/context/LanguageContext'

export default function DashboardSidebar({ navItems, activeTab, onSelectTab, siteNavItems }) {
  const t = useTranslations('dashboard.common')
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useDashboardSidebar()
  const { isRTL } = useLanguage()
  const pathname = usePathname()

  const showLabels = isExpanded || isHovered || isMobileOpen

  return (
    <aside
      className={`fixed flex flex-col top-0 px-5 start-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-[999] border-e border-gray-200
        ${isExpanded || isMobileOpen ? 'w-[290px]' : isHovered ? 'w-[290px]' : 'w-[90px]'}
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
      <div className={`py-8 flex ${!showLabels ? 'lg:justify-center' : 'justify-start'}`}>
        {showLabels ? (
          <Image src="/logo.svg" alt="ScanEat Logo" width={140} height={38} priority />
        ) : (
          <Image src="/logo.svg" alt="ScanEat Logo" width={32} height={32} priority />
        )}
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
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
                        onClick={() => onSelectTab(item.key)}
                        className={`menu-item group cursor-pointer ${
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
                        {showLabels && <span className="menu-item-text">{item.label}</span>}
                        {showLabels && typeof item.count === 'number' && item.count > 0 && (
                          <span className="ms-auto rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
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
                          className={`menu-item group cursor-pointer ${
                            isActive ? 'menu-item-active' : 'menu-item-inactive'
                          } ${!showLabels ? 'lg:justify-center' : 'lg:justify-start'}`}
                        >
                          <span className={isActive ? 'menu-item-icon-active' : 'menu-item-icon-inactive'}>
                            <Icon className="size-5" />
                          </span>
                          {showLabels && <span className="menu-item-text">{item.label}</span>}
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
    </aside>
  )
}
