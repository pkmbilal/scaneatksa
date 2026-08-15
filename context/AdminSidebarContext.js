'use client'

// Layout-only state for the admin dashboard's left sidebar (expand/collapse,
// hover-to-expand, mobile open/close). Ported from TailAdmin's
// SidebarContext.tsx (github.com/TailAdmin/free-nextjs-admin-dashboard).
// Scoped to /dashboard/admin — provider is only mounted on that page.

import { createContext, useContext, useState, useEffect } from 'react'

const AdminSidebarContext = createContext(undefined)

export function useAdminSidebar() {
  const context = useContext(AdminSidebarContext)
  if (!context) {
    throw new Error('useAdminSidebar must be used within an AdminSidebarProvider')
  }
  return context
}

export function AdminSidebarProvider({ children }) {
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
    <AdminSidebarContext.Provider
      value={{
        isExpanded: isMobile ? false : isExpanded,
        isMobileOpen,
        isHovered,
        toggleSidebar,
        toggleMobileSidebar,
        setIsHovered,
      }}
    >
      {children}
    </AdminSidebarContext.Provider>
  )
}
