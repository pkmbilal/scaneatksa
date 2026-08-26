import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { supabaseServer } from "@/lib/supabase/server";

import MenuClient from "@/components/MenuClient";
import CartButton from "@/components/CartButton";
import FavoriteButton from "@/components/FavoriteButton";
import TableCodePersist from "@/components/TableCodePersist";
import StarRating from "@/components/reviews/StarRating";
import RestaurantReviewsSection from "@/components/reviews/RestaurantReviewsSection";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, MapPin, Truck, ShoppingBag, UtensilsCrossed, Navigation } from "lucide-react";

// Meta-row chip. `variant="accent"` is reserved for facts that are actually
// true right now (delivery/pickup availability) so the brand-green accent
// stays a signal, not decoration, next to the neutral glass chips.
function Chip({ icon: Icon, children, variant = "default" }) {
  const variants = {
    default: "border-white/15 bg-white/10 text-white/90",
    accent: "border-emerald-300/40 bg-emerald-500/20 text-emerald-50",
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

// There's no restaurant logo field, only the single cover `image_url`, so we
// build a brand-toned initial badge instead -- same initials pattern
// ReviewCard already uses for reviewer avatars, just with a brand fill.
function initialFor(name) {
  return (name || "").trim().charAt(0).toUpperCase() || "R";
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
          className={`block w-1 rounded-full ${bar <= level ? "bg-emerald-400" : "bg-white/25"}`}
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
      categories:categories ( id, name )
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

  return (
    <div className="min-h-screen">
      <TableCodePersist restaurantSlug={restaurantSlug} />

      {/* HEADER */}
      <div className="relative overflow-hidden text-white">
        {restaurant.image_url ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${restaurant.image_url})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-green-600 to-emerald-900">
            <div className="absolute -top-16 start-1/4 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-blob" />
            <div className="absolute bottom-0 end-0 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl animate-blob animation-delay-2000" />
          </div>
        )}

        {/* Scrim tuned for legibility against arbitrary uploaded photos */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/25" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />

        {/* Favorite -- overlaid top-end on the cover, same corner convention RestaurantCard uses on the listing page */}
        <div className="absolute top-4 end-4 z-20 md:top-6 md:end-6">
          <FavoriteButton restaurantId={restaurant.id} />
        </div>

        <div className="relative">
          <div className="max-w-7xl mx-auto px-4 py-10 md:py-16 lg:py-20">
            <div className="max-w-3xl">
              <div className="rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl px-5 py-6 shadow-2xl shadow-black/40 md:px-8 md:py-8">
                {/* Identity */}
                <div className="flex items-center gap-4">
                  <Avatar className="size-14 border-2 border-white/25 shadow-lg md:size-16">
                    <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-green-600 text-lg font-bold text-white md:text-2xl">
                      {initialFor(restaurant.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <h1 className="text-2xl font-bold leading-tight tracking-tight md:text-4xl lg:text-5xl">
                      {restaurant.name}
                    </h1>

                    <div className="mt-1.5">
                      {ratingSummary?.avg_rating != null ? (
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <StarRating
                            value={ratingSummary.avg_rating}
                            reviewCount={ratingSummary.review_count}
                            showValue
                            size="sm"
                            className="text-white"
                          />
                          <a
                            href="#reviews"
                            className="text-xs font-medium text-white/70 underline decoration-white/30 underline-offset-2 transition hover:text-white md:text-sm"
                          >
                            {t("header.seeReviews")}
                          </a>
                        </div>
                      ) : (
                        <span className="text-sm text-white/70">{t("header.noReviews")}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Meta chips */}
                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-5">
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

                {/* Contact */}
                {(restaurant.address || restaurant.phone) && (
                  <div className="mt-5 space-y-2 border-t border-white/10 pt-5">
                    {restaurant.address && (
                      <p className="flex items-start gap-2 text-sm leading-snug text-white/85 md:text-base">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/60" aria-hidden="true" />
                        <span>{restaurant.address}</span>
                      </p>
                    )}

                    {restaurant.phone && (
                      <p className="flex items-center gap-2 text-sm text-white/90 md:text-base">
                        <Phone className="h-4 w-4 shrink-0 text-white/60" aria-hidden="true" />
                        {/* dir="ltr" keeps digits/+ from bidi-scrambling under the Arabic locale */}
                        <span dir="ltr">{restaurant.phone}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {restaurant.phone && (
                    <a
                      href={`tel:${restaurant.phone}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#00c951] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 transition hover:bg-green-600 md:text-base"
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
                      className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 md:text-base"
                    >
                      <Navigation size={16} />
                      {t("header.directions")}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <MenuClient
          items={menuItems}
          categories={[...new Set(menuItems.map((item) => item?.categories?.name || t("uncategorized")))].sort()}
          restaurant={restaurant}
        />

        <RestaurantReviewsSection reviews={reviewsError ? [] : reviews} />
      </div>

      <CartButton restaurant={restaurant} tableCode={tableCode} />
    </div>
  );
}
