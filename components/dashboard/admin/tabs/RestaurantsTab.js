'use client'

// Restaurants list. Same data/handlers as the original page.js.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { supabaseBrowser } from '@/lib/supabase/client'

const supabase = supabaseBrowser()

export default function RestaurantsTab({ allRestaurants, onToggle, onDelete }) {
  const t = useTranslations('dashboard.admin')

  if (allRestaurants.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-3">🏪</div>
        <p className="text-gray-500 dark:text-gray-400">{t('restaurantsTab.emptyState')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {allRestaurants.map((restaurant) => (
        <RestaurantCard
          key={restaurant.id}
          restaurant={restaurant}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

function RestaurantCard({ restaurant, onToggle, onDelete }) {
  const t = useTranslations('dashboard.admin')
  const [menuItemCount, setMenuItemCount] = useState(0)

  useEffect(() => {
    loadMenuItemCount()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant.id])

  async function loadMenuItemCount() {
    const { count } = await supabase
      .from('menu_items')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurant.id)

    setMenuItemCount(count || 0)
  }

  return (
    <div className="rounded-2xl border border-gray-200 p-6 hover:border-gray-300 transition-colors dark:border-gray-800 dark:hover:border-gray-700">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-bold text-gray-800 dark:text-white/90 text-xl">{restaurant.name}</h3>
            {!restaurant.is_active ? (
              <span className="text-xs bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400 px-2 py-1 rounded-full font-semibold">
                {t('restaurantsTab.disabledBadge')}
              </span>
            ) : (
              <span className="text-xs bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400 px-2 py-1 rounded-full font-semibold">
                {t('restaurantsTab.activeBadge')}
              </span>
            )}
          </div>

          <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
            <p className="flex items-center gap-2">
              <span className="font-semibold text-gray-700 dark:text-gray-300">{t('restaurantsTab.urlLabel')}</span>
              <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs">
                /menu/{restaurant.slug}
              </code>
              <Link
                href={`/menu/${restaurant.slug}`}
                target="_blank"
                className="text-brand-600 hover:text-brand-700 dark:text-brand-400 text-xs"
              >
                {t('restaurantsTab.viewLink')}
              </Link>
            </p>

            {restaurant.owner_email && (
              <p className="flex items-center gap-2">
                <span className="font-semibold text-gray-700 dark:text-gray-300">{t('restaurantsTab.ownerLabel')}</span>
                <span>{restaurant.owner_email}</span>
              </p>
            )}

            {restaurant.phone && (
              <p className="flex items-center gap-2">
                <span className="font-semibold text-gray-700 dark:text-gray-300">{t('restaurantsTab.phoneLabel')}</span>
                <span>{restaurant.phone}</span>
              </p>
            )}

            {restaurant.address && (
              <p className="flex items-center gap-2">
                <span className="font-semibold text-gray-700 dark:text-gray-300">{t('restaurantsTab.addressLabel')}</span>
                <span>{restaurant.address}</span>
              </p>
            )}

            <p className="flex items-center gap-2">
              <span className="font-semibold text-gray-700 dark:text-gray-300">{t('restaurantsTab.menuItemsLabel')}</span>
              <span className="bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 px-2 py-0.5 rounded-full text-xs font-semibold">
                {menuItemCount}
              </span>
            </p>

            <p className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-gray-700 dark:text-gray-300">{t('restaurantsTab.createdLabel')}</span>
              <span>{new Date(restaurant.created_at).toLocaleDateString()}</span>
            </p>

            {restaurant.approved_at && (
              <p className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-gray-700 dark:text-gray-300">{t('restaurantsTab.approvedLabel')}</span>
                <span>{new Date(restaurant.approved_at).toLocaleDateString()}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap pt-4 border-t border-gray-100 dark:border-gray-800">
        <Link
          href={`/menu/${restaurant.slug}`}
          target="_blank"
          className="px-4 py-2 bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 rounded-lg font-semibold text-sm hover:bg-blue-100 transition-colors"
        >
          {t('restaurantsTab.viewMenuButton')}
        </Link>

        <Link
          href={`/qr/${restaurant.slug}`}
          target="_blank"
          className="px-4 py-2 bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400 rounded-lg font-semibold text-sm hover:bg-success-100 transition-colors"
        >
          {t('restaurantsTab.qrCodeButton')}
        </Link>

        <button
          onClick={() => onToggle(restaurant)}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
            restaurant.is_active
              ? 'bg-warning-50 text-warning-700 hover:bg-warning-100 dark:bg-warning-500/15 dark:text-warning-400'
              : 'bg-success-50 text-success-700 hover:bg-success-100 dark:bg-success-500/15 dark:text-success-400'
          }`}
        >
          {restaurant.is_active ? t('restaurantsTab.disableButton') : t('restaurantsTab.enableButton')}
        </button>

        <button
          onClick={() => onDelete(restaurant)}
          className="px-4 py-2 bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400 rounded-lg font-semibold text-sm hover:bg-error-100 transition-colors"
        >
          {t('restaurantsTab.deleteButton')}
        </button>
      </div>
    </div>
  )
}
