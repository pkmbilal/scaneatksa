import createNextIntlPlugin from 'next-intl/plugin'
import { securityHeaders } from './lib/securityHeaders.mjs'

const withNextIntl = createNextIntlPlugin('./i18n/request.js')

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,

  // Security headers on every route -- see lib/securityHeaders.mjs.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders({
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          dev: process.env.NODE_ENV !== 'production',
        }),
      },
    ]
  },
}

export default withNextIntl(nextConfig)
