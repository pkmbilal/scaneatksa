'use client'

// Mobile sidebar overlay, shared by all role dashboards. Ported from
// TailAdmin's layout/Backdrop.tsx.

import { useDashboardSidebar } from '@/context/DashboardSidebarContext'

export default function DashboardBackdrop() {
  const { isMobileOpen, toggleMobileSidebar } = useDashboardSidebar()

  if (!isMobileOpen) return null

  return (
    <div
      className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
      onClick={toggleMobileSidebar}
    />
  )
}
