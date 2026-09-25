import { getTranslations, getLocale } from "next-intl/server";
import { SAUDI_CITIES, cityLabel } from "@/lib/saudiCities";
import { DEFAULT_OG_IMAGE, localeHref, localizedAlternates, ogLocale } from "@/lib/seo";
import { supabaseServer } from "@/lib/supabase/server";
import RestaurantCard from '@/components/restaurant/RestaurantCard'
import RestaurantsFilters from '@/components/restaurant/RestaurantsFilters'

// Filtered/search views are near-duplicates of the main listing, so only the
// bare listing and single-city views are indexable; everything else is
// noindex,follow so Google still reaches the restaurant links.
export async function generateMetadata({ searchParams }) {
  const t = await getTranslations("restaurants.metadata");
  const params = await Promise.resolve(searchParams ?? {});

  const city = (params?.city ?? "").toString();
  const otherFilters = ["q", "cuisine", "veg"].some((k) => params?.[k]);
  const typeFilter = params?.type && params.type !== "restaurants";
  const locale = await getLocale();
  const knownCity = SAUDI_CITIES.some((c) => c.slug === city);
  const cityName = knownCity ? cityLabel(city, locale) : "";

  if (cityName && !otherFilters && !typeFilter) {
    const title = t("cityTitle", { city: cityName });
    const description = t("cityDescription", { city: cityName });
    const url = `/restaurants?city=${encodeURIComponent(city)}`;
    return {
      title,
      description,
      alternates: localizedAlternates(url, locale),
      openGraph: {
        title,
        description,
        url: localeHref(url, locale),
        locale: ogLocale(locale),
        images: [DEFAULT_OG_IMAGE],
      },
    };
  }

  return {
    title: t("title"),
    description: t("description"),
    alternates: localizedAlternates("/restaurants", locale),
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: localeHref("/restaurants", locale),
      locale: ogLocale(locale),
      images: [DEFAULT_OG_IMAGE],
    },
    ...(city || otherFilters || typeFilter
      ? { robots: { index: false, follow: true } }
      : {}),
  };
}

export default async function RestaurantsPage({ searchParams }) {
  const supabase = supabaseServer();
  const t = await getTranslations('restaurants')
  const params = await Promise.resolve(searchParams ?? {})

  const type = (params?.type ?? 'restaurants').toString()
  const q = (params?.q ?? '').toString().trim()
  const city = (params?.city ?? '').toString()
  const cuisine = (params?.cuisine ?? '').toString()
  const veg = (params?.veg ?? '').toString() // '1' => pure veg only (option A)

  // Load dropdowns (cities are a bundled static list -- see lib/saudiCities.js)
  const { data: cuisines } = await supabase
    .from('cuisines')
    .select('id,name')
    .eq('is_active', true)
    .order('name', { ascending: true })

  const intersect = (a, b) => {
    const setB = new Set(b)
    return a.filter((x) => setB.has(x))
  }

  let constrainedRestaurantIds = null

  // Cuisine filter -> restaurant ids
  if (cuisine) {
    const { data: rc, error: rcErr } = await supabase
      .from('restaurant_cuisines')
      .select('restaurant_id')
      .eq('cuisine_id', cuisine)

    constrainedRestaurantIds = rcErr ? [] : (rc || []).map((x) => x.restaurant_id)
  }

  // Food search -> restaurant ids
  if (type === 'food' && q) {
    const safeQ = q.replace(/,/g, ' ')
    const { data: mi, error: miErr } = await supabase
      .from('menu_items')
      .select('restaurant_id')
      .eq('is_available', true)
      .or(`name.ilike.%${safeQ}%,description.ilike.%${safeQ}%`)

    const idsFromFood = miErr ? [] : Array.from(new Set((mi || []).map((x) => x.restaurant_id)))

    constrainedRestaurantIds =
      constrainedRestaurantIds === null ? idsFromFood : intersect(constrainedRestaurantIds, idsFromFood)
  }

  // ✅ Veg toggle (Option A): PURE VEG restaurants only
  // Meaning: restaurant must have at least 1 veg available AND 0 non-veg available
  if (veg === '1') {
    const { data: flags, error: flagsErr } = await supabase
      .from('restaurant_menu_flags') // VIEW
      .select('restaurant_id')
      .eq('has_veg_available', true)
      .eq('has_nonveg_available', false)

    const idsFromVeg = flagsErr ? [] : (flags || []).map((x) => x.restaurant_id)

    constrainedRestaurantIds =
      constrainedRestaurantIds === null ? idsFromVeg : intersect(constrainedRestaurantIds, idsFromVeg)
  }

  // Build restaurants query
  let restaurantsQuery = supabase
    .from('restaurants')
    .select(
      `
      id,
      slug,
      name,
      address,
      image_url,
      is_active,
      city
    `
    )
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (city) restaurantsQuery = restaurantsQuery.eq('city', city)
  if (type === 'restaurants' && q) restaurantsQuery = restaurantsQuery.ilike('name', `%${q}%`)

  if (constrainedRestaurantIds !== null) {
    restaurantsQuery =
      constrainedRestaurantIds.length === 0
        ? restaurantsQuery.in('id', ['00000000-0000-0000-0000-000000000000'])
        : restaurantsQuery.in('id', constrainedRestaurantIds)
  }

  const { data: restaurants, error } = await restaurantsQuery
  if (error) console.log('Restaurants fetch error:', error)

  // Batched average-rating/review-count lookup (restaurant_rating_summary is
  // a view over reviews, mirrors the restaurant_menu_flags batching above)
  // -- one .in(restaurant_id, ids) query instead of one per card.
  let restaurantsWithRatings = restaurants || []
  if (restaurantsWithRatings.length > 0) {
    const { data: ratingSummaries } = await supabase
      .from('restaurant_rating_summary')
      .select('restaurant_id, avg_rating, review_count')
      .in(
        'restaurant_id',
        restaurantsWithRatings.map((r) => r.id)
      )

    const ratingsById = new Map((ratingSummaries || []).map((r) => [r.restaurant_id, r]))
    restaurantsWithRatings = restaurantsWithRatings.map((r) => ({
      ...r,
      avg_rating: ratingsById.get(r.id)?.avg_rating ?? null,
      review_count: ratingsById.get(r.id)?.review_count ?? 0,
    }))
  }

  return (
    <section className="pt-4 pb-4 md:py-10 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-4 md:mb-8">
          <h1 className="text-2xl text-center md:text-5xl font-bold text-gray-900 md:mb-3">{t('page.title')}</h1>
          <p className="md:text-lg text-center text-gray-600">{t('page.subtitle')}</p>
        </div>

        <div className="mb-4 md:mb-8">
          <RestaurantsFilters cuisines={cuisines || []} />
        </div>

        {restaurantsWithRatings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {restaurantsWithRatings.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border">
            <div className="text-6xl mb-4">🔎</div>
            <p className="text-xl text-gray-700 font-semibold">{t('empty.title')}</p>
            <p className="text-sm text-gray-500 mt-2">{t('empty.subtitle')}</p>
          </div>
        )}
      </div>
    </section>
  )
}
