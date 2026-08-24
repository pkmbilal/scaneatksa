'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Mail, Phone, Settings, User2 } from 'lucide-react'

const roleTint = {
  admin: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
  owner: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  customer: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

export default function ProfileCard({ user, profile }) {
  const t = useTranslations('dashboard.customer')
  const role = profile?.role || 'customer'
  const roleLabel = t.has(`profileCard.roles.${role}`) ? t(`profileCard.roles.${role}`) : role

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-white/90">
          <User2 className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          {t('profileCard.title')}
        </h3>

        <span
          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${roleTint[role] || roleTint.customer}`}
        >
          {roleLabel}
        </span>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
            <User2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('profileCard.nameLabel')}</p>
            <p className="truncate font-semibold text-gray-800 dark:text-white/90">
              {profile?.full_name || t('profileCard.notSet')}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
            <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('profileCard.emailLabel')}</p>
            <p className="truncate font-semibold text-gray-800 dark:text-white/90">{user?.email || t('profileCard.emailFallback')}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
            <Phone className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('profileCard.phoneLabel')}</p>
            <p className="truncate font-semibold text-gray-800 dark:text-white/90">
              {profile?.phone || t('profileCard.notSet')}
            </p>
          </div>
        </div>
      </div>

      <hr className="my-4 border-gray-200 dark:border-gray-800" />

      <Link
        href="/dashboard/customer/edit-profile"
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <Settings className="h-4 w-4" />
        {t('profileCard.editProfile')}
      </Link>
    </div>
  )
}
