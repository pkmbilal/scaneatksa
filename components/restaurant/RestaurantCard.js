import Link from "@/components/LocaleLink";
import { getTranslations, getLocale } from "next-intl/server"
import FavoriteButton from "@/components/FavoriteButton"
import { cityLabel } from "@/lib/saudiCities"

import { Card, CardContent } from "@/components/ui/card"
import { UtensilsCrossed, MapPin, Star, BadgeCheck, Leaf, ShoppingBag, Bike } from "lucide-react"

const MAX_CUISINES = 2

// Every detail below renders only when its data exists -- no "not set"
// placeholders. Extras (rating, cuisines, veg, is_new) are merged on by
// enrichRestaurantsForCards in lib/restaurantCardData.js.
// `headingLevel` keeps the page outline valid: 2 when the card sits directly
// under the page H1 (the /restaurants listing), 3 inside a titled section.
export default async function RestaurantCard({ restaurant, headingLevel = 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3"
  const t = await getTranslations('restaurants')
  const { id, slug, name, address, image_url } = restaurant
  const cityName = cityLabel(restaurant?.city, await getLocale())

  // No rating column on restaurants -- it's aggregated from reviews by the
  // restaurant_rating_summary view.
  const reviewCount = restaurant?.review_count ?? 0
  const avgRating = reviewCount > 0 ? restaurant?.avg_rating ?? null : null

  const cuisines = restaurant?.cuisines ?? []
  const shownCuisines = cuisines.slice(0, MAX_CUISINES)
  const extraCuisines = cuisines.length - shownCuisines.length

  const hasChips = !!cityName || cuisines.length > 0 || restaurant?.has_veg_available
  const hasServices = restaurant?.pickup_available || restaurant?.delivery_available

  const chip = "inline-flex items-center gap-1 rounded-full border bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-700"

  return (
    <div className="relative group">
      {/* Favorite */}
      <div className="absolute top-2 end-2 z-20">
        <FavoriteButton restaurantId={id} />
      </div>

      <Link href={`/menu/${slug}`} className="block h-full">
        <Card className="h-full overflow-hidden border bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 !py-2 !px-1 md:!p-0">
          <div className="flex items-stretch sm:flex-col">
            {/* LEFT (mobile): image with tight vertical padding */}
            <div className="px-2 py-1 sm:p-0">
              <div className="relative w-28 h-28 sm:w-full sm:h-48 rounded-xl sm:rounded-none overflow-hidden bg-primary">
                {image_url ? (
                  <img
                    src={image_url}
                    alt={`${name} cover`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-white/90">
                    <UtensilsCrossed size={34} />
                  </div>
                )}

                {restaurant?.is_new && (
                  <span className="absolute top-2 start-2 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-wide text-gray-900 shadow">
                    {t('card.new')}
                  </span>
                )}
              </div>
            </div>

            {/* RIGHT (mobile): tight vertical padding */}
            <CardContent className="flex-1 min-w-0 p-0 sm:p-4">
              <div className="px-2 py-1 sm:p-0 space-y-1.5">
                <div className="flex items-center gap-1 min-w-0">
                  <Heading className="text-[15px] sm:text-lg font-extrabold tracking-tight leading-tight text-gray-900 truncate">
                    {name}
                  </Heading>
                  {restaurant?.cr_verified_at && (
                    <BadgeCheck
                      className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-emerald-600"
                      aria-label={t('card.verified')}
                      role="img"
                    >
                      <title>{t('card.verified')}</title>
                    </BadgeCheck>
                  )}
                </div>

                {avgRating != null && (
                  <div
                    className="flex items-center gap-1 text-xs sm:text-sm text-gray-700"
                    aria-label={t('card.reviews', { rating: Number(avgRating).toFixed(1), count: reviewCount })}
                  >
                    <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                    <span className="font-semibold">{Number(avgRating).toFixed(1)}</span>
                    <span className="text-gray-500">({reviewCount})</span>
                  </div>
                )}

                {address && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mt-0.5 text-emerald-600 shrink-0" aria-hidden="true" />
                    <span className="line-clamp-1 sm:line-clamp-2 leading-snug">{address}</span>
                  </div>
                )}

                {hasChips && (
                  <div className="flex flex-wrap gap-1">
                    {cityName && <span className={chip}>{cityName}</span>}
                    {shownCuisines.map((c) => (
                      <span key={c} className={chip}>{c}</span>
                    ))}
                    {extraCuisines > 0 && <span className={chip}>+{extraCuisines}</span>}
                    {restaurant?.has_veg_available && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        <Leaf className="h-3 w-3" aria-hidden="true" />
                        {t('card.vegOptions')}
                      </span>
                    )}
                  </div>
                )}

                {hasServices && (
                  <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                    {restaurant?.pickup_available && (
                      <span className="inline-flex items-center gap-1">
                        <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                        {t('card.pickup')}
                      </span>
                    )}
                    {restaurant?.delivery_available && (
                      <span className="inline-flex items-center gap-1">
                        <Bike className="h-3.5 w-3.5" aria-hidden="true" />
                        {t('card.delivery')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </div>
        </Card>
      </Link>
    </div>
  )
}
