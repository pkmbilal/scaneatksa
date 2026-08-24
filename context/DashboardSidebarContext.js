'use client'

// Layout-only state for a dashboard's left sidebar (expand/collapse,
// hover-to-expand, mobile open/close). Ported from TailAdmin's
// SidebarContext.tsx (github.com/TailAdmin/free-nextjs-admin-dashboard).
// Shared across all role dashboards (/dashboard/admin, /dashboard/owner,
// /dashboard/customer) — each page mounts its own provider instance.

import { createContext, useContext, useState, useEffect } from 'react'

const DashboardSidebarContext = createContext(undefined)

export function useDashboardSidebar() {
  const context = useContext(DashboardSidebarContext)
  if (!context) {
    throw new Error('useDashboardSidebar must be used within a DashboardSidebarProvider')
  }
  return context
}

export function DashboardSidebarProvider({ children }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (!mobile) setIsMobileOpen(false)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSidebar = () => setIsExpanded((prev) => !prev)
  const toggleMobileSidebar = () => setIsMobileOpen((prev) => !prev)

  return (
    <DashboardSidebarContext.Provider
      value={{
        isExpanded: isMobile ? false : isExpanded,
        isMobileOpen,
        isMobile,
        isHovered,
        toggleSidebar,
        toggleMobileSidebar,
        setIsHovered,
      }}
    >
      {children}
    </DashboardSidebarContext.Provider>
  )
}
