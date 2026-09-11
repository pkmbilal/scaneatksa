'use client'

// Trial / expiry notice shown across the owner dashboard. The owner is never
// locked out of the dashboard when a subscription lapses -- only the public menu
// and ordering are cut off (enforced in Postgres). This banner tells them why
// and how to renew, since there is no self-serve checkout yet.

import { useTranslations } from 'next-intl'
import { AlertTriangle, Clock, MessageCircle, Mail } from 'lucide-react'

import { contactData } from '@/lib/siteData'
import { buildWhatsAppLink } from '@/lib/whatsapp'
import { getSubscriptionState, daysUntil, DUE_SOON_DAYS } from '@/lib/subscription'

const TONE = {
  error: 'border-error-200 bg-error-50 text-error-800 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-200',
  warning:
    'border-warning-200 bg-warning-50 text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-200',
  info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200',
}

export default function SubscriptionBanner({ restaurant }) {
  const t = useTranslations('dashboard.owner')
  if (!restaurant) return null

  const state = getSubscriptionState(restaurant)
  const days = daysUntil(restaurant.subscription_expires_at)

  // Healthy paid subscription that isn't near expiry -- nothing to show. A trial
  // always shows (owner should always know a clock is running).
  if (state === 'unlimited') return null
  if (state === 'active' && (days == null || days > DUE_SOON_DAYS)) return null

  const kindWord =
    state === 'trial' || (state === 'expired' && restaurant.subscription_status === 'trial')
      ? t('subscriptionBanner.trialWord')
      : t('subscriptionBanner.subscriptionWord')

  let tone = 'info'
  let Icon = Clock
  let message

  if (state === 'suspended') {
    tone = 'error'
    Icon = AlertTriangle
    message = t('subscriptionBanner.suspended')
  } else if (state === 'expired') {
    tone = 'error'
    Icon = AlertTriangle
    message = t('subscriptionBanner.expired', { kind: kindWord })
  } else if (days != null && days <= DUE_SOON_DAYS) {
    tone = 'warning'
    Icon = AlertTriangle
    message = t('subscriptionBanner.endingSoon', { kind: kindWord, count: days })
  } else {
    tone = 'info'
    Icon = Clock
    message = t('subscriptionBanner.trial', { count: days ?? 0 })
  }

  const waLink = buildWhatsAppLink(
    contactData.whatsappNumber,
    t('subscriptionBanner.whatsappMessage', { name: restaurant.name })
  )
  const mailLink = `mailto:${contactData.email}?subject=${encodeURIComponent(
    t('subscriptionBanner.emailSubject', { name: restaurant.name })
  )}`

  return (
    <div className={`mb-6 rounded-2xl border p-4 ${TONE[tone]}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{message}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/70 px-3 py-2 text-sm font-semibold text-gray-800 transition-colors hover:bg-white dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
            >
              <MessageCircle className="h-4 w-4" />
              {t('subscriptionBanner.contactWhatsapp')}
            </a>
          )}
          <a
            href={mailLink}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/70 px-3 py-2 text-sm font-semibold text-gray-800 transition-colors hover:bg-white dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            <Mail className="h-4 w-4" />
            {t('subscriptionBanner.contactEmail')}
          </a>
        </div>
      </div>
    </div>
  )
}
