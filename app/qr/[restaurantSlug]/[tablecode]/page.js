import { redirect } from 'next/navigation'

// Legacy /qr/<slug>/<code> links -> the customer menu in dine-in mode, the
// same URL the generated table QR codes point at.
export default async function Page({ params }) {
  const { restaurantSlug, tablecode } = await params
  const slug = encodeURIComponent(restaurantSlug)

  redirect(
    tablecode ? `/menu/${slug}?t=${encodeURIComponent(tablecode)}` : `/menu/${slug}`
  )
}
