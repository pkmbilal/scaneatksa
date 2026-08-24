'use client'

// Cuisines CRUD. Same data/handlers as the original page.js. Reuses the same
// editable-pill UI as CitiesTab (identical shape: name + rename/toggle/delete).

import { useTranslations } from 'next-intl'
import { Pill } from './CitiesTab'

export default function CuisinesTab({
  cuisines,
  cuisineName,
  setCuisineName,
  cuisineLoading,
  cuisineError,
  onAddCuisine,
  onRename,
  onToggle,
  onDelete,
}) {
  const t = useTranslations('dashboard.admin')

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-3">{t('cuisinesTab.addHeading')}</h3>

        <form onSubmit={onAddCuisine} className="flex flex-col sm:flex-row gap-3">
          <input
            value={cuisineName}
            onChange={(e) => setCuisineName(e.target.value)}
            placeholder={t('cuisinesTab.namePlaceholder')}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 focus:border-brand-300"
          />

          <button
            type="submit"
            disabled={cuisineLoading}
            className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-lg font-semibold disabled:bg-gray-400"
          >
            {cuisineLoading ? t('cuisinesTab.addingButton') : t('cuisinesTab.addButton')}
          </button>
        </form>

        {cuisineError && (
          <div className="mt-3 bg-error-50 border border-error-200 text-error-700 dark:bg-error-500/10 dark:border-error-800 dark:text-error-400 px-4 py-3 rounded-lg">
            {cuisineError}
          </div>
        )}
      </div>

      {cuisines.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          {t('cuisinesTab.emptyState')}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {cuisines.map((c) => (
            <Pill key={c.id} item={c} onRename={onRename} onToggle={onToggle} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
