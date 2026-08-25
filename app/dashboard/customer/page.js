'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { getUserFavorites, removeFromFavorites } from '@/lib/auth/client'
import { LayoutDashboard, Heart, ListChecks, Receipt, House, Pizza, Gauge, Headset } from 'lucide-react'

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
import OrdersTab from '@/components/dashboard/customer/tabs/OrdersTab'
import { useCustomerDashboardData } from '@/components/dashboard/customer/hooks/useCustomerDashboardData'

export default function CustomerDashboardPage() {
  const t = useTranslations('dashboard.customer')
  const {
    user,
    profile,
    favorites,
    setFavorites,
    requests,
    orders,
    reviews,
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
    return <LoadingScreen message={t('page.loading')} />
  }

  const navItems = [
    { key: 'overview', label: t('page.nav.overview'), icon: LayoutDashboard },
    { key: 'orders', label: t('page.nav.orders'), icon: Receipt, count: orders.length },
    { key: 'favorites', label: t('page.nav.favorites'), icon: Heart, count: favorites.length },
    { key: 'requests', label: t('page.nav.requests'), icon: ListChecks, count: requests.length },
  ]

  const siteNavItems = [
    { label: t('page.siteNav.about'), href: '/about', icon: House },
    { label: t('page.siteNav.howItWorks'), href: '/#how-it-works', icon: Gauge },
    { label: t('page.siteNav.restaurants'), href: '/restaurants', icon: Pizza },
    { label: t('page.siteNav.contact'), href: '/contact', icon: Headset },
  ]

  const tabTitles = {
    overview: t('page.tabTitles.overview'),
    orders: t('page.tabTitles.orders'),
    favorites: t('page.tabTitles.favorites'),
    requests: t('page.tabTitles.requests'),
  }

  const tabDescriptions = {
    overview: t('page.tabDescriptions.overview'),
    orders: t('page.tabDescriptions.orders'),
    favorites: t('page.tabDescriptions.favorites'),
    requests: t('page.tabDescriptions.requests'),
  }

  return (
    <DashboardSidebarProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 lg:flex">
        <DashboardSidebar
          navItems={navItems}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          siteNavItems={siteNavItems}
          user={user}
          profile={profile}
          homeLabel={t('page.homeLabel')}
          editProfileHref="/dashboard/customer/edit-profile"
        />
        <DashboardBackdrop />

        <DashboardMain
          header={
            <DashboardHeader
              user={user}
              profile={profile}
              homeHref="/dashboard/customer"
              homeLabel={t('page.homeLabel')}
              editProfileHref="/dashboard/customer/edit-profile"
            />
          }
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 mb-6">
              <StatCard icon={Receipt} label={t('page.stats.orders')} value={orders.length} tint="brand" />
              <StatCard icon={Heart} label={t('page.stats.favorites')} value={favorites.length} tint="brand" />
              <StatCard icon={ListChecks} label={t('page.stats.requests')} value={requests.length} tint="gray" />
            </div>
          )}

          <TabSectionHeader title={tabTitles[activeTab]} description={tabDescriptions[activeTab]} />

          {activeTab === 'orders' ? (
            <OrdersTab orders={orders} reviews={reviews} userId={user?.id} />
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="p-6">
                {activeTab === 'overview' && <OverviewTab user={user} profile={profile} />}

                {activeTab === 'favorites' && (
                  <FavoritesTab favorites={favorites} onRemove={handleRemoveFavorite} />
                )}

                {activeTab === 'requests' && <RequestsTab requests={requests} />}
              </div>
            </div>
          )}
        </DashboardMain>
      </div>
    </DashboardSidebarProvider>
  )
}
