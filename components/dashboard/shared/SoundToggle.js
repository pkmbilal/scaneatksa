'use client'

// Header button that mutes/unmutes the order-notification chime. Pair with
// useOrderAlerts (`soundEnabled` / `toggleSound`); pass into DashboardHeader's
// `extraActions` slot.

import { useTranslations } from 'next-intl'
import { Volume2, VolumeX } from 'lucide-react'

export default function SoundToggle({ enabled, onToggle }) {
  const t = useTranslations('dashboard.common')
  const label = enabled
    ? t('notifications.sound.mute')
    : t('notifications.sound.unmute')

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      title={label}
      aria-pressed={!enabled}
      className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
    >
      {enabled ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
    </button>
  )
}
