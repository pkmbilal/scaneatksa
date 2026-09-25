'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { localeHref } from '@/lib/seo'

// Drop-in replacement for next/link: on Arabic pages, links to public pages get
// the /ar prefix (see lib/seo.js) so users and crawlers stay in the Arabic
// version. Dashboard/auth/cart/external hrefs pass through unchanged.
export default function LocaleLink({ href, ...props }) {
  const { locale } = useLanguage()
  return <Link href={localeHref(href, locale)} {...props} />
}
