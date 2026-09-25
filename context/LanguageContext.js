'use client'

// Locale switch/persist state, mirroring the CartContext / DashboardSidebarContext
// conventions used elsewhere in this codebase. The actual translated strings come
// from next-intl (see i18n/request.js + <NextIntlClientProvider> in app/layout.js);
// this context only owns "which locale is active" and "how to change it".

import { createContext, useContext, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { isLocalizedPath, localeHref, stripLocalePrefix } from '@/lib/seo'

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

      // Public pages carry the locale in the URL (/ar/...), so switching means
      // moving to the other URL. A full load is required: /about and /ar/about
      // rewrite to the same route, so a client-side push would reuse the root
      // layout (html lang/dir, messages). Cart and table code live in
      // localStorage and survive it.
      const { pathname, search, hash } = window.location
      const basePath = stripLocalePrefix(pathname)
      if (isLocalizedPath(basePath)) {
        window.location.assign(localeHref(basePath, next) + search + hash)
        return
      }

      // Everywhere else: re-render Server Components (root layout re-reads the
      // cookie and picks up the new locale/messages/dir) while preserving Client
      // Component state, e.g. cart contents or in-progress form fields.
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
