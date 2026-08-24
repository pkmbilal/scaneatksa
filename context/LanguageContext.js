'use client'

// Locale switch/persist state, mirroring the CartContext / DashboardSidebarContext
// conventions used elsewhere in this codebase. The actual translated strings come
// from next-intl (see i18n/request.js + <NextIntlClientProvider> in app/layout.js);
// this context only owns "which locale is active" and "how to change it".

import { createContext, useContext, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const LanguageContext = createContext(undefined)

const LOCALE_COOKIE = 'NEXT_LOCALE'
const LOCALE_STORAGE_KEY = 'scaneat:locale:v1'

export function LanguageProvider({ children, locale }) {
  const router = useRouter()

  const switchLocale = useCallback(
    (next) => {
      if (next === locale) return

      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
      try {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, next)
      } catch {
        // localStorage unavailable (private mode, etc.) - cookie is source of truth anyway
      }

      // Re-renders Server Components (root layout re-reads the cookie and picks up
      // the new locale/messages/dir) while preserving Client Component state, e.g.
      // cart contents or in-progress form fields.
      router.refresh()
    },
    [locale, router]
  )

  return (
    <LanguageContext.Provider value={{ locale, isRTL: locale === 'ar', switchLocale }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
