import './globals.css'
import { ThemeProvider } from 'next-themes'
import { CartProvider } from './CartContext'
import LayoutWithNavbar from '@/components/LayoutWithNavbar'

export const metadata = {
  title: 'QR Menu System',
  description: 'Digital menu for restaurants',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <CartProvider>
            <LayoutWithNavbar>
              {children}
            </LayoutWithNavbar>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}