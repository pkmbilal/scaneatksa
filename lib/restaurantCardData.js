// Columns RestaurantCard needs from the restaurants table. Explicit (never
// `*`) so public pages don't ship cr_number / subscription_* to the client.
export const RESTAURANT_CARD_COLUMNS =
  'id, slug, name, address, image_url, city, created_at, cr_verified_at, pickup_available, delivery_available'

// Restaurants listed within this window get a "New" badge.
const NEW_RESTAURANT_DAYS = 30

// Merges the per-card extras (rating, cuisines, veg flag, is_new) onto
// restaurant rows with one batched .in(restaurant_id, ids) query per source
// instead of one per card. A failed lookup just leaves that detail off -- the
// card hides it.
export async function enrichRestaurantsForCards(supabase, restaurants) {
  const rows = restaurants || []
  if (rows.length === 0) return rows

  const ids = rows.map((r) => r.id)
  const [ratings, cuisines, flags] = await Promise.all([
    supabase
      .from('restaurant_rating_summary')
      .select('restaurant_id, avg_rating, review_count')
      .in('restaurant_id', ids),
    supabase
      .from('restaurant_cuisines')
      .select('restaurant_id, cuisines ( name, is_active )')
      .in('restaurant_id', ids),
    supabase
      .from('restaurant_menu_flags') // VIEW
      .select('restaurant_id, has_veg_available')
      .in('restaurant_id', ids),
  ])

  const ratingsById = new Map((ratings.data || []).map((r) => [r.restaurant_id, r]))
  const vegById = new Map((flags.data || []).map((f) => [f.restaurant_id, !!f.has_veg_available]))
  const cuisinesById = new Map()
  for (const rc of cuisines.data || []) {
    if (!rc.cuisines?.name || rc.cuisines.is_active === false) continue
    const list = cuisinesById.get(rc.restaurant_id) || []
    list.push(rc.cuisines.name)
    cuisinesById.set(rc.restaurant_id, list)
  }

  const newSince = Date.now() - NEW_RESTAURANT_DAYS * 24 * 60 * 60 * 1000
  return rows.map((r) => ({
    ...r,
    avg_rating: ratingsById.get(r.id)?.avg_rating ?? null,
    review_count: ratingsById.get(r.id)?.review_count ?? 0,
    cuisines: (cuisinesById.get(r.id) || []).sort(),
    has_veg_available: vegById.get(r.id) ?? false,
    is_new: !!r.created_at && new Date(r.created_at).getTime() >= newSince,
  }))
}
