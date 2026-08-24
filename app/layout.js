import './globals.css'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { ThemeProvider } from 'next-themes'
import { CartProvider } from './CartContext'
import { LanguageProvider } from '@/context/LanguageContext'
import LayoutWithNavbar from '@/components/LayoutWithNavbar'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'QR Menu System',
  description: 'Digital menu for restaurants',
}

export const viewport = {
  viewportFit: 'cover',
}

export default async function RootLayout({ children }) {
  const locale = await getLocale()
  const messages = await getMessages()
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
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
