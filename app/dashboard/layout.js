import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'

// The root layout keeps dashboard.* strings out of every public page's
// payload; dashboard routes get them back here. A nested provider replaces
// (doesn't merge) its parent's messages, so this passes every namespace a
// dashboard client component uses: `dashboard`, plus `menu` for the shared
// ReviewCard in the owner/customer review tabs. Add a namespace here if a
// dashboard component starts using a new one.
export default async function DashboardLayout({ children }) {
  const locale = await getLocale()
  const { dashboard, menu } = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={{ dashboard, menu }}>
      {children}
    </NextIntlClientProvider>
  )
}
