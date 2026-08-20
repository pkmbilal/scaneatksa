import Link from "next/link"
import { getTranslations } from "next-intl/server"
import FavoriteButton from "@/components/FavoriteButton"

import { Card, CardContent } from "@/components/ui/card"
import { UtensilsCrossed, MapPin, Star, Clock } from "lucide-react"

export default async function RestaurantCard({ restaurant }) {
  const t = await getTranslations('restaurants')
  const { id, slug, name, address, image_url } = restaurant
  const cityName = restaurant?.cities?.name || restaurant?.city || null

  // Optional placeholders
  const rating = restaurant?.rating ?? "4.6"
  const eta = restaurant?.delivery_time ?? "20–35 min"

  return (
    <div className="relative group">
      {/* Favorite */}
      <div className="absolute top-2 end-2 z-20">
        <FavoriteButton restaurantId={id} />
      </div>

      <Link href={`/menu/${slug}`} className="block">
        <Card className="overflow-hidden border bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 !py-2 !px-1 md:!p-0">
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

                {/* Desktop overlay only */}
                <div className="absolute inset-0 hidden sm:block bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                {/* Desktop-only rating/eta pills */}
                {/* <div className="hidden sm:flex absolute bottom-3 left-3 right-3 items-center justify-between">
                  <div className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-900 shadow">
                    <Star className="h-4 w-4" />
                    {rating}
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-900 shadow">
                    <Clock className="h-4 w-4" />
                    {eta}
                  </div>
                </div> */}
              </div>
            </div>

            {/* RIGHT (mobile): tight vertical padding */}
            <CardContent className="flex-1 p-0 sm:p-4">
              <div className="px-2 py-1 sm:p-0">
                <div className="min-w-0">
                  <h3 className="text-[15px] sm:text-lg font-extrabold tracking-tight leading-tight text-gray-900 truncate">
                    {name}
                  </h3>

                  {/* Mobile rating/eta (plain text) */}
                  <div className="sm:hidden mt-0.5 flex items-center gap-2 text-xs text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-gray-700" />
                      {rating}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-gray-700" />
                      {eta}
                    </span>
                  </div>

                  {/* Address (tight spacing) */}
                  <div className="mt-1 flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mt-0.5 text-emerald-600 shrink-0" />
                    <span className="line-clamp-1 sm:line-clamp-2 leading-snug">
                      {address || t('card.noAddress')}
                    </span>
                  </div>

                  {/* City pill (tight) */}
                  <div className="mt-1">
                    <span className="inline-flex items-center rounded-full border bg-gray-50 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                      {cityName || t('card.cityNotSet')}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      </Link>
    </div>
  )
}
