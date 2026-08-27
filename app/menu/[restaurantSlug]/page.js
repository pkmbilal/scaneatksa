import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { supabaseServer } from "@/lib/supabase/server";

import MenuClient from "@/components/MenuClient";
import CartButton from "@/components/CartButton";
import FavoriteButton from "@/components/FavoriteButton";
import TableCodePersist from "@/components/TableCodePersist";
import StarRating from "@/components/reviews/StarRating";
import RestaurantReviewsSection from "@/components/reviews/RestaurantReviewsSection";
import MashrabiyaFret from "@/components/menu/MashrabiyaFret";
import { Phone, MapPin, Truck, ShoppingBag, UtensilsCrossed, Navigation } from "lucide-react";

// Meta-row chip, styled for the deep-emerald hero panel. `variant="accent"`
// is reserved for facts that are actually true right now (delivery/pickup
// availability) so the brand-green accent stays a signal, not decoration,
// next to the neutral parchment-glass chips.
function Chip({ icon: Icon, children, variant = "default" }) {
  const variants = {
    default: "border-[color:var(--m-on-emerald)]/20 bg-[color:var(--m-on-emerald)]/10 text-[color:var(--m-on-emerald)]/90",
    accent: "border-[color:var(--m-go)]/40 bg-[color:var(--m-go)]/15 text-[color:var(--m-on-emerald)]",
  };
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-md md:text-sm",
        variants[variant] || variants.default,
      ].join(" ")}
    >
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
      {children}
    </span>
  );
}

// 1-4 tier price indicator built from `price_level`. Bars instead of "$"
// signs on purpose -- this is a SAR-priced app, repeated dollar signs read
// oddly next to SAR prices.
function PriceBars({ level, label }) {
  if (!level) return null;
  return (
    <span className="inline-flex items-end gap-0.5" role="img" aria-label={label}>
      {[1, 2, 3, 4].map((bar) => (
        <span
          key={bar}
          className={`block w-1 rounded-full ${bar <= level ? "bg-[color:var(--m-brass)]" : "bg-[color:var(--m-on-emerald)]/25"}`}
          style={{ height: `${5 + bar * 3}px` }}
        />
      ))}
    </span>
  );
}

export default async function MenuPage({ params, searchParams }) {
  const supabase = supabaseServer();
  const t = await getTranslations("menu");

  // ✅ Next 16: params/searchParams may be Promises
  const p = await Promise.resolve(params);
  const sp = await Promise.resolve(searchParams ?? {});

  const restaurantSlug = decodeURIComponent(String(p?.restaurantSlug ?? "")).trim();
  const tableCode = (sp?.t ?? "").toString();

  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select(
      `
      *,
      city:cities ( id, name ),
      restaurant_cuisines (
        cuisine:cuisines ( id, name )
      )
    `
    )
    .eq("slug", restaurantSlug)
    .maybeSingle();

  if (restaurantError) console.error("restaurants error:", restaurantError);

  if (!restaurant || restaurant.is_active === false) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold">{t("notFound.title")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("notFound.subtitle")}
        </p>
        <Link href="/restaurants" className="underline mt-4 inline-block">
          {t("notFound.backLink")}
        </Link>
      </div>
    );
  }

  const { data: items, error: itemsError } = await supabase
    .from("menu_items")
    .select(`
      *,
      categories:categories ( id, name, sort_order )
    `)
    .eq("restaurant_id", restaurant.id)
    .order("category_id", { ascending: true })
    .order("is_sold_out", { ascending: true, nullsFirst: true })
    .order("name", { ascending: true });

  if (itemsError) console.error("menu_items error:", itemsError);

  const cityName = restaurant?.city?.name || "";

  // Rating summary (batched view -- see restaurant_rating_summary migration)
  // + the review list itself + per-item rating averages, all public-read via
  // RLS. Queried directly here (server component) rather than through
  // lib/auth/client.js, which is browser-only.
  const [
    { data: ratingSummary },
    { data: reviews, error: reviewsError },
    { data: itemRatings },
  ] = await Promise.all([
    supabase
      .from("restaurant_rating_summary")
      .select("avg_rating, review_count")
      .eq("restaurant_id", restaurant.id)
      .maybeSingle(),
    supabase
      .from("reviews")
      .select(
        `
        id, rating, comment, created_at, updated_at, user_id, order_id, reviewer_name,
        review_replies ( id, reply, created_at, updated_at )
      `
      )
      .eq("restaurant_id", restaurant.id)
      .is("menu_item_id", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("menu_item_rating_summary")
      .select("menu_item_id, avg_rating, review_count")
      .eq("restaurant_id", restaurant.id),
  ]);

  if (reviewsError) console.error("reviews error:", reviewsError);

  const itemRatingById = new Map((itemRatings || []).map((r) => [r.menu_item_id, r]));

  const menuItems = itemsError
    ? []
    : (items || [])
        .filter((item) => item.is_available !== false)
        .map((item) => ({ ...item, rating: itemRatingById.get(item.id) || null }));

  const cuisinePills =
    restaurant?.restaurant_cuisines?.map((rc) => rc?.cuisine?.name).filter(Boolean) || [];

  const priceTier = Math.max(0, Math.min(4, Number(restaurant.price_level) || 0));

  // Category list for MenuClient: `{ name, count }` ordered by the owner's
  // `sort_order` (falling back to name) so the grouped view follows the
  // intended menu sequence rather than plain alphabetical.
  const uncategorized = t("uncategorized");
  const categoryMap = new Map();
  for (const item of menuItems) {
    const name = item?.categories?.name || uncategorized;
    if (!categoryMap.has(name)) {
      categoryMap.set(name, {
        name,
        sortOrder: item?.categories?.sort_order ?? 9999,
        count: 0,
      });
    }
    categoryMap.get(name).count += 1;
  }
  const orderedCategories = [...categoryMap.values()].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)
  );

  return (
    <div className="menu-theme min-h-screen bg-[color:var(--m-limestone)] text-[color:var(--m-ink)]">
      <TableCodePersist restaurantSlug={restaurantSlug} />

      {/* HERO -- deep-emerald panel. When a cover photo exists it shows
          through under a light emerald tint plus a bottom-up gradient that
          only deepens where the text sits; no black scrim. */}
      <div className="relative overflow-hidden bg-[color:var(--m-emerald)] text-[color:var(--m-on-emerald)]">
        {restaurant.image_url && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${restaurant.image_url})` }}
            />
            <div className="absolute inset-0 bg-[color:var(--m-emerald)]/35" />
            <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--m-emerald)] via-[color:var(--m-emerald)]/45 to-transparent" />
          </>
        )}

        {/* Favorite -- overlaid top-end, same corner convention RestaurantCard uses */}
        <div className="absolute top-4 end-4 z-20 md:top-6 md:end-6">
          <FavoriteButton restaurantId={restaurant.id} />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-12 md:py-16 lg:py-20">
          <div className="max-w-3xl">
            <h1 className="font-display text-3xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
              {restaurant.name}
            </h1>

            <div className="mt-3">
              {ratingSummary?.avg_rating != null ? (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <StarRating
                    value={ratingSummary.avg_rating}
                    reviewCount={ratingSummary.review_count}
                    showValue
                    size="sm"
                    className="text-[color:var(--m-on-emerald)]"
                  />
                  <a
                    href="#reviews"
                    className="text-xs font-medium text-[color:var(--m-on-emerald)]/70 underline decoration-[color:var(--m-on-emerald)]/30 underline-offset-4 transition hover:text-[color:var(--m-on-emerald)] md:text-sm"
                  >
                    {t("header.seeReviews")}
                  </a>
                </div>
              ) : (
                <span className="text-sm text-[color:var(--m-on-emerald)]/70">{t("header.noReviews")}</span>
              )}
            </div>

            {/* Info card -- brass hairline on the emerald */}
            <div className="mt-6 rounded-2xl border border-[color:var(--m-brass)]/40 bg-[color:var(--m-emerald)]/25 p-5 backdrop-blur-md md:p-6">
              <div className="flex flex-wrap items-center gap-2">
                {cityName && <Chip icon={MapPin}>{cityName}</Chip>}

                {priceTier > 0 && (
                  <Chip>
                    <PriceBars level={priceTier} label={t("header.priceLevel", { level: priceTier })} />
                  </Chip>
                )}

                {restaurant.delivery_available && (
                  <Chip icon={Truck} variant="accent">{t("header.delivery")}</Chip>
                )}
                {restaurant.pickup_available && (
                  <Chip icon={ShoppingBag} variant="accent">{t("header.pickup")}</Chip>
                )}

                {cuisinePills.slice(0, 8).map((c) => (
                  <Chip key={c} icon={UtensilsCrossed}>{c}</Chip>
                ))}
                {cuisinePills.length === 0 && (
                  <Chip icon={UtensilsCrossed}>{t("header.multiCuisine")}</Chip>
                )}
              </div>

              {(restaurant.address || restaurant.phone) && (
                <div className="mt-4 space-y-2 border-t border-[color:var(--m-brass)]/25 pt-4">
                  {restaurant.address && (
                    <p className="flex items-start gap-2 text-sm leading-snug text-[color:var(--m-on-emerald)]/85 md:text-base">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--m-on-emerald)]/55" aria-hidden="true" />
                      <span>{restaurant.address}</span>
                    </p>
                  )}

                  {restaurant.phone && (
                    <p className="flex items-center gap-2 text-sm text-[color:var(--m-on-emerald)]/90 md:text-base">
                      <Phone className="h-4 w-4 shrink-0 text-[color:var(--m-on-emerald)]/55" aria-hidden="true" />
                      {/* dir="ltr" keeps digits/+ from bidi-scrambling under the Arabic locale */}
                      <span dir="ltr">{restaurant.phone}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {restaurant.phone && (
                <a
                  href={`tel:${restaurant.phone}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--m-go)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/25 transition hover:brightness-95 md:text-base"
                >
                  <Phone size={16} />
                  {t("header.call")}
                </a>
              )}

              {restaurant.address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--m-on-emerald)]/30 bg-[color:var(--m-on-emerald)]/10 px-5 py-2.5 text-sm font-semibold text-[color:var(--m-on-emerald)] transition hover:bg-[color:var(--m-on-emerald)]/20 md:text-base"
                >
                  <Navigation size={16} />
                  {t("header.directions")}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <MenuClient
          items={menuItems}
          categories={orderedCategories}
          restaurant={restaurant}
        />
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <MashrabiyaFret variant="band" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <RestaurantReviewsSection
          reviews={reviewsError ? [] : reviews}
          ratingSummary={ratingSummary}
        />
      </div>

      <CartButton restaurant={restaurant} tableCode={tableCode} />
    </div>
  );
}
