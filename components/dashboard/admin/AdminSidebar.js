'use client'

// Left sidebar nav for the admin dashboard. Structure/behavior ported from
// TailAdmin's layout/AppSidebar.tsx (github.com/TailAdmin/free-nextjs-admin-dashboard):
// same collapse/hover/mobile-open mechanics and menu-item styling. Simplified
// vs. the original — our nav is a flat list of dashboard sections (no
// sub-menus), and items switch the existing `activeTab` state instead of
// routing, since the underlying page still renders everything client-side.

import Image from 'next/image'
import { useAdminSidebar } from '@/context/AdminSidebarContext'

export default function AdminSidebar({ navItems, activeTab, onSelectTab }) {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useAdminSidebar()

  const showLabels = isExpanded || isHovered || isMobileOpen

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-[999] border-r border-gray-200
        ${isExpanded || isMobileOpen ? 'w-[290px]' : isHovered ? 'w-[290px]' : 'w-[90px]'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
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
                {showLabels ? 'Menu' : '•••'}
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
                        <span className={isActive ? 'menu-item-icon-active' : 'menu-item-icon-inactive'}>
                          <Icon className="size-5" />
                        </span>
                        {showLabels && <span className="menu-item-text">{item.label}</span>}
                        {showLabels && typeof item.count === 'number' && item.count > 0 && (
                          <span className="ml-auto rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                            {item.count}
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </nav>
      </div>
    </aside>
  )
}
