'use client'

// Mobile sidebar overlay. Ported from TailAdmin's layout/Backdrop.tsx.

import { useAdminSidebar } from '@/context/AdminSidebarContext'

export default function AdminBackdrop() {
  const { isMobileOpen, toggleMobileSidebar } = useAdminSidebar()

  if (!isMobileOpen) return null

  return (
    <div
      className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
      onClick={toggleMobileSidebar}
    />
  )
}
