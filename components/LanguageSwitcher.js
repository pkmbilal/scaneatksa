'use client'

import { useLanguage } from '@/context/LanguageContext'
import { Languages } from 'lucide-react'

// Two visual variants:
// - 'pill'  (default): icon + label, used on the public Navbar and login page.
// - 'icon': matches the dark-mode toggle button in DashboardHeader exactly
//   (same size/classes), so the two toggles read as a matched pair.
// `light` (pill variant only): white/translucent styling for use on a
// transparent header floating over a photo, instead of the default
// light-background-assuming gray styling.
export default function LanguageSwitcher({ variant = 'pill', light = false, className = '' }) {
  const { locale, switchLocale } = useLanguage()
  const next = locale === 'en' ? 'ar' : 'en'
  const label = locale === 'en' ? 'العربية' : 'English'

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={() => switchLocale(next)}
        className={`relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white text-xs font-semibold ${className}`}
        aria-label="Switch language"
      >
        {locale === 'en' ? 'AR' : 'EN'}
      </button>
    )
  }

  const pillClass = light
    ? 'inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 h-9 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20'
    : 'inline-flex items-center gap-1.5 rounded-full border px-3 h-9 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors'

  return (
    <button
      type="button"
      onClick={() => switchLocale(next)}
      className={`${pillClass} ${className}`}
      aria-label="Switch language"
    >
      <Languages className="size-4" />
      <span>{label}</span>
    </button>
  )
}
