'use client'

// Content column that shifts right of the sidebar; reads sidebar state from
// context so its margin follows the collapse/expand/hover state (same
// pattern as TailAdmin's own admin layout). Shared by all role dashboards.

import { useDashboardSidebar } from '@/context/DashboardSidebarContext'

export default function DashboardMain({ header, children }) {
  const { isExpanded, isHovered, isMobileOpen } = useDashboardSidebar()
  const marginLeft = isMobileOpen ? '' : isExpanded || isHovered ? 'lg:ms-[290px]' : 'lg:ms-[90px]'

  return (
    <div className={`flex-1 transition-all duration-300 ease-in-out ${marginLeft}`}>
      {header}
      <div className="p-4 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] mx-auto max-w-screen-2xl md:p-6">
        {children}
      </div>
    </div>
  )
}
