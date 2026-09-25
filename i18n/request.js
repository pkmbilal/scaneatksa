import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'
import { LOCALE_HEADER } from '@/lib/seo'

// UI chrome only. Never load Supabase-sourced content (restaurant/menu
// names, user profile fields, order notes, table codes) through this —
// that data stays exactly as stored regardless of the active locale.

export const LOCALES = ['en', 'ar']
export const DEFAULT_LOCALE = 'en'
export const LOCALE_COOKIE = 'NEXT_LOCALE'

// Namespaces map 1:1 to files under messages/<locale>/. A namespace with a
// "/" becomes a nested key, e.g. 'dashboard/admin' -> messages.dashboard.admin.
const NAMESPACES = [
  'common',
  'auth',
  'home',
  'about',
  'contact',
  'howItWorks',
  'privacyPolicy',
  'restaurants',
  'menu',
  'cart',
  'qr',
  'dashboard/common',
  'dashboard/admin',
  'dashboard/owner',
  'dashboard/customer',
  'dashboard/staff',
]

async function loadMessages(locale) {
  const messages = {}
  await Promise.all(
    NAMESPACES.map(async (ns) => {
      const mod = await import(`../messages/${locale}/${ns}.json`)
      const parts = ns.split('/')
      let cursor = messages
      for (let i = 0; i < parts.length - 1; i++) {
        cursor[parts[i]] ??= {}
        cursor = cursor[parts[i]]
      }
      cursor[parts.at(-1)] = mod.default
    })
  )
  return messages
}

export default getRequestConfig(async () => {
  // Public pages get their locale from the URL (/ar/... -> proxy.js sets
  // LOCALE_HEADER); everything else falls back to the NEXT_LOCALE cookie.
  const urlLocale = (await headers()).get(LOCALE_HEADER)
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value
  const locale = [urlLocale, cookieLocale].find((l) => LOCALES.includes(l)) ?? DEFAULT_LOCALE

  return {
    locale,
    messages: await loadMessages(locale),
  }
})
