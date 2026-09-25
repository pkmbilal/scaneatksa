import './globals.css'
import { Fraunces, Reem_Kufi, IBM_Plex_Sans, IBM_Plex_Sans_Arabic } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { ThemeProvider } from 'next-themes'
import { CartProvider } from './CartContext'
import { LanguageProvider } from '@/context/LanguageContext'
import LayoutWithNavbar from '@/components/LayoutWithNavbar'
import { Toaster } from '@/components/ui/sonner'
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
} from '@/lib/seo'

// Bilingual type for the "Souk Modern" menu page. Applied only inside
// .menu-theme (see globals.css); making the CSS vars available app-wide is
// harmless. Fraunces/Reem Kufi are variable fonts (no `weight`); the two
// IBM Plex families need explicit weights.
const displayLatin = Fraunces({
  subsets: ['latin'],
  variable: '--font-display-latin',
  display: 'swap',
})
const displayArabic = Reem_Kufi({
  subsets: ['arabic'],
  variable: '--font-display-arabic',
  display: 'swap',
})
const bodyLatin = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body-latin',
  display: 'swap',
})
const bodyArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body-arabic',
  display: 'swap',
})

const fontVars = [
  displayLatin.variable,
  displayArabic.variable,
  bodyLatin.variable,
  bodyArabic.variable,
].join(' ')

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    siteName: SITE_NAME,
    type: 'website',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ScanEat',
  },
}

export const viewport = {
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

export default async function RootLayout({ children }) {
  const locale = await getLocale()
  const messages = await getMessages()
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <html lang={locale} dir={dir} className={fontVars} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <LanguageProvider locale={locale}>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
              <CartProvider>
                <LayoutWithNavbar>
                  {children}
                </LayoutWithNavbar>
                <Toaster />
              </CartProvider>
            </ThemeProvider>
          </LanguageProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
