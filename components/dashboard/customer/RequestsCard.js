'use client'

import { useTranslations } from 'next-intl'
import { Clock, CheckCircle2, XCircle } from 'lucide-react'

const statusTint = {
  pending: 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400',
  approved: 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400',
  rejected: 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400',
}

const statusIcon = {
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
}

function StatusBadge({ status }) {
  const t = useTranslations('dashboard.customer')
  const Icon = statusIcon[status] || statusIcon.pending

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap ${
        statusTint[status] || statusTint.pending
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {status === 'pending' ? t('requestStatus.pending') : status === 'approved' ? t('requestStatus.approved') : t('requestStatus.rejected')}
    </span>
  )
}

export default function RequestsCard({ requests }) {
  const t = useTranslations('dashboard.customer')

  if (!requests || requests.length === 0) return null

  const scrollClass = requests.length > 4 ? 'max-h-[320px] overflow-auto pe-3' : ''

  return (
    <div>
      <div className={`space-y-3 ${scrollClass}`}>
        {requests.map((request) => (
          <div
            key={request.id}
            className="rounded-xl border border-gray-200 p-4 transition-colors hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-800 dark:text-white/90">
                  {request.restaurant_name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{request.phone}</p>
              </div>
              <StatusBadge status={request.status} />
            </div>

            {request.description && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{request.description}</p>
            )}

            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              {t('requestsCard.submitted')}: {new Date(request.created_at).toLocaleDateString()}
            </p>

            {request.status === 'rejected' && request.rejection_reason && (
              <div className="mt-3 rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400">
                <span className="font-semibold">{t('requestsCard.reason')}: </span>
                {request.rejection_reason}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
