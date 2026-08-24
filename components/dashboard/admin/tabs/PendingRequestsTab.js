'use client'

// Pending restaurant-owner requests. Same data/handlers as the original
// app/dashboard/admin/page.js, restyled with TailAdmin card conventions.

import { useTranslations } from 'next-intl'

export default function PendingRequestsTab({ pendingRequests, onApprove, onReject }) {
  const t = useTranslations('dashboard.admin')

  if (pendingRequests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-3">✅</div>
        <p className="text-gray-500 dark:text-gray-400">{t('pendingRequestsTab.emptyState')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {pendingRequests.map((request) => (
        <div
          key={request.id}
          className="rounded-2xl border border-gray-200 p-6 hover:border-brand-300 transition-colors dark:border-gray-800 dark:hover:border-brand-700"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white/90 mb-1">
                {request.restaurant_name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {t('pendingRequestsTab.requestedByLabel')}{' '}
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {request.user_profiles?.full_name || t('pendingRequestsTab.unknownUser')}
                </span>{' '}
                ({request.user_profiles?.email})
              </p>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div>
                  <span>{t('pendingRequestsTab.phoneLabel')}</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300 ms-2">{request.phone}</span>
                </div>
                <div>
                  <span>{t('pendingRequestsTab.submittedLabel')}</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300 ms-2">
                    {new Date(request.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {request.address && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{t('pendingRequestsTab.addressLabel')}</span> {request.address}
                </p>
              )}

              {request.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{t('pendingRequestsTab.descriptionLabel')}</span>{' '}
                  {request.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => onApprove(request)}
              className="flex-1 bg-success-500 hover:bg-success-600 text-white py-2 rounded-lg font-semibold transition-colors"
            >
              {t('pendingRequestsTab.approveButton')}
            </button>
            <button
              onClick={() => onReject(request)}
              className="flex-1 bg-error-500 hover:bg-error-600 text-white py-2 rounded-lg font-semibold transition-colors"
            >
              {t('pendingRequestsTab.rejectButton')}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
