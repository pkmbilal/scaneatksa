'use client'

// Pending restaurant-owner requests. Same data/handlers as the original
// app/dashboard/admin/page.js, restyled with TailAdmin card conventions.
// Approval is gated on the admin first checking the CR, certificate and Maps
// listing and marking the request verified (enforced again server-side by
// admin_approve_restaurant_request).

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CR_LOOKUP_URL } from '@/lib/restaurantVerification'

export default function PendingRequestsTab({ pendingRequests, onApprove, onReject, onVerify, onViewDocument }) {
  const t = useTranslations('dashboard.admin')
  const [copiedId, setCopiedId] = useState(null)

  const copyCr = async (request) => {
    try {
      await navigator.clipboard.writeText(request.cr_number)
      setCopiedId(request.id)
      setTimeout(() => setCopiedId((id) => (id === request.id ? null : id)), 1500)
    } catch {
      // Clipboard can be unavailable (non-secure context); the number is visible anyway.
    }
  }

  if (pendingRequests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-3">✅</div>
        <p className="text-gray-500 dark:text-gray-400">{t('pendingRequestsTab.emptyState')}</p>
      </div>
    )
  }

  const linkClass = 'text-brand-500 hover:text-brand-600 hover:underline dark:text-brand-400'

  return (
    <div className="space-y-4">
      {pendingRequests.map((request) => {
        const verified = !!request.verified_at

        return (
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

            {/* Verification checklist */}
            <div
              className={`mb-4 rounded-xl border p-4 text-sm ${
                verified
                  ? 'border-success-200 bg-success-50 dark:border-success-500/30 dark:bg-success-500/10'
                  : 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <h4 className="font-semibold text-gray-800 dark:text-white/90">
                  {t('pendingRequestsTab.verificationTitle')}
                </h4>
                {verified && (
                  <span className="text-xs px-3 py-1 rounded-full font-semibold bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-400">
                    ✓ {t('pendingRequestsTab.verifiedLabel')}
                  </span>
                )}
              </div>

              <div className="space-y-2 text-gray-500 dark:text-gray-400">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>{t('pendingRequestsTab.crLabel')}</span>
                  {request.cr_number ? (
                    <>
                      <span dir="ltr" className="font-mono font-semibold text-gray-700 dark:text-gray-300">
                        {request.cr_number}
                      </span>
                      <button type="button" onClick={() => copyCr(request)} className={linkClass}>
                        {copiedId === request.id ? t('pendingRequestsTab.copied') : t('pendingRequestsTab.copy')}
                      </button>
                      <a href={CR_LOOKUP_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
                        {t('pendingRequestsTab.lookupCr')} ↗
                      </a>
                    </>
                  ) : (
                    <span>{t('pendingRequestsTab.notProvided')}</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>{t('pendingRequestsTab.vatLabel')}</span>
                  <span dir="ltr" className="font-mono font-semibold text-gray-700 dark:text-gray-300">
                    {request.vat_number || t('pendingRequestsTab.notProvided')}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  {request.maps_url && (
                    <a href={request.maps_url} target="_blank" rel="noopener noreferrer" className={linkClass}>
                      {t('pendingRequestsTab.openMaps')} ↗
                    </a>
                  )}
                  {request.cr_document_path ? (
                    <button type="button" onClick={() => onViewDocument(request)} className={linkClass}>
                      {t('pendingRequestsTab.viewDocument')} ↗
                    </button>
                  ) : (
                    <span>{t('pendingRequestsTab.noDocument')}</span>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onVerify(request, !verified)}
                  className={
                    verified
                      ? 'rounded-lg border border-gray-300 px-3 py-1.5 font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5'
                      : 'rounded-lg bg-brand-500 px-3 py-1.5 font-semibold text-white hover:bg-brand-600'
                  }
                >
                  {verified ? t('pendingRequestsTab.unverify') : t('pendingRequestsTab.markVerified')}
                </button>
                {!verified && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('pendingRequestsTab.verifyFirstHint')}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => onApprove(request)}
                disabled={!verified}
                title={verified ? undefined : t('pendingRequestsTab.verifyFirstHint')}
                className="flex-1 bg-success-500 hover:bg-success-600 text-white py-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-success-500"
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
        )
      })}
    </div>
  )
}
