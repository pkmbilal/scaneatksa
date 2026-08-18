'use client'

import { useCallback, useEffect, useState } from 'react'
import { getUserFavorites, removeFromFavorites } from '@/lib/auth/client'
import { LayoutDashboard, Heart, ListChecks, House, Pizza, Gauge, Headset } from 'lucide-react'

import LoadingScreen from '@/components/common/LoadingScreen'
import { DashboardSidebarProvider } from '@/context/DashboardSidebarContext'
import DashboardSidebar from '@/components/dashboard/shared/DashboardSidebar'
import DashboardHeader from '@/components/dashboard/shared/DashboardHeader'
import DashboardBackdrop from '@/components/dashboard/shared/DashboardBackdrop'
import DashboardMain from '@/components/dashboard/shared/DashboardMain'
import StatCard from '@/components/dashboard/shared/StatCard'
import TabSectionHeader from '@/components/dashboard/shared/TabSectionHeader'

import OverviewTab from '@/components/dashboard/customer/tabs/OverviewTab'
import FavoritesTab from '@/components/dashboard/customer/tabs/FavoritesTab'
import RequestsTab from '@/components/dashboard/customer/tabs/RequestsTab'
import { useCustomerDashboardData } from '@/components/dashboard/customer/hooks/useCustomerDashboardData'

export default function CustomerDashboardPage() {
  const {
    user,
    profile,
    favorites,
    setFavorites,
    requests,
    loading,
  } = useCustomerDashboardData()

  const [activeTab, setActiveTab] = useState('overview')

  const refreshFavorites = useCallback(async () => {
    if (!user?.id) return
    const { data, error } = await getUserFavorites(user.id)
    if (!error) setFavorites(data || [])
  }, [user?.id, setFavorites])

  // ✅ refresh on mount + when tab focuses
  useEffect(() => {
    refreshFavorites()

    const onFocus = () => refreshFavorites()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refreshFavorites])

  // ✅ listen for favorites changes from anywhere (FavoriteButton dispatches it)
  useEffect(() => {
    const onChanged = (e) => {
      if (e?.detail?.userId && e.detail.userId !== user?.id) return
      refreshFavorites()
    }

    window.addEventListener('favorites:changed', onChanged)
    return () => window.removeEventListener('favorites:changed', onChanged)
  }, [refreshFavorites, user?.id])

  const handleRemoveFavorite = useCallback(
    async (restaurantId, restaurantName) => {
      if (!user?.id) return

      const { error } = await removeFromFavorites(user.id, restaurantId)
      if (!error) {
        await refreshFavorites()
      }
    },
    [user?.id, refreshFavorites]
  )

  if (loading) {
    return <LoadingScreen message="Loading your dashboard..." />
  }

  const navItems = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'favorites', label: 'Favorites', icon: Heart, count: favorites.length },
    { key: 'requests', label: 'My Requests', icon: ListChecks, count: requests.length },
  ]

  const siteNavItems = [
    { label: 'About', href: '/about', icon: House },
    { label: 'How It Works', href: '/#how-it-works', icon: Gauge },
    { label: 'Restaurants', href: '/restaurants', icon: Pizza },
    { label: 'Contact', href: '/contact', icon: Headset },
  ]

  const tabTitles = {
    overview: 'Overview',
    favorites: 'Favorites',
    requests: 'My Requests',
  }

  const tabDescriptions = {
    overview: 'Your account details and quick actions.',
    favorites: "Restaurants you've saved for quick access.",
    requests: 'Track the status of your restaurant ownership requests.',
  }

  return (
    <DashboardSidebarProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 lg:flex">
        <DashboardSidebar
          navItems={navItems}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          siteNavItems={siteNavItems}
        />
        <DashboardBackdrop />

        <DashboardMain
          header={
            <DashboardHeader
              user={user}
              profile={profile}
              homeHref="/dashboard/customer"
              homeLabel="My Account"
              editProfileHref="/dashboard/customer/edit-profile"
            />
          }
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 gap-4 md:gap-6 mb-6">
              <StatCard icon={Heart} label="Favorites" value={favorites.length} tint="brand" />
              <StatCard icon={ListChecks} label="Requests" value={requests.length} tint="gray" />
            </div>
          )}

          <TabSectionHeader title={tabTitles[activeTab]} description={tabDescriptions[activeTab]} />

          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="p-6">
              {activeTab === 'overview' && <OverviewTab user={user} profile={profile} />}

              {activeTab === 'favorites' && (
                <FavoritesTab favorites={favorites} onRemove={handleRemoveFavorite} />
              )}

              {activeTab === 'requests' && <RequestsTab requests={requests} />}
            </div>
          </div>
        </DashboardMain>
      </div>
    </DashboardSidebarProvider>
  )
}
