'use client'

// Horizontal, edge-to-edge scrollable pill strip for switching a dashboard
// page's `activeTab` on mobile -- the equivalent of DashboardSidebar's
// vertical nav list, which now lives permanently off-canvas on small screens
// (the drawer that used to open it was removed in favor of the app's bottom
// tab bar / UserDropdown for account actions).

export default function DashboardMobileTabs({ navItems, activeTab, onSelectTab }) {
  if (!navItems?.length) return null

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar border-b border-gray-200 px-4 py-3 dark:border-gray-800 lg:hidden">
      {navItems.map((item) => {
        const isActive = activeTab === item.key
        const Icon = item.icon
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelectTab(item.key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              isActive
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300'
            }`}
          >
            <Icon className="size-4" />
            {item.label}
            {typeof item.count === 'number' && item.count > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400'
                }`}
              >
                {item.count}
              </span>
            )}
            {item.alert && !item.count && (
              <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
            )}
          </button>
        )
      })}
    </div>
  )
}
