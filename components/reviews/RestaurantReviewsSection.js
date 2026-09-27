// Public menu-page reviews list. Purely presentational -- reviews and the
// rating summary are fetched server-side in app/menu/[restaurantSlug]/page.js
// and passed down, matching that page's fetch-everything-up-top style. No
// owner actions here -- replies are read-only on this page. Styled for the
// "Souk Modern" theme; `tone="menu"` opts each ReviewCard into that palette.
import { getTranslations } from "next-intl/server";
import ReviewCard from "@/components/reviews/ReviewCard";
import StarRating from "@/components/reviews/StarRating";

// How many reviews app/menu/[restaurantSlug]/page.js fetches for this list.
export const REVIEWS_LIMIT = 20;

export default async function RestaurantReviewsSection({ reviews, ratingSummary }) {
  const t = await getTranslations("menu");
  const hasSummary =
    ratingSummary?.avg_rating != null && ratingSummary?.review_count > 0;

  return (
    <section id="reviews">
      <h2 className="font-display text-2xl font-semibold text-[color:var(--m-ink)] md:text-3xl">
        {t("header.reviewsSection.title")}
      </h2>

      {hasSummary && (
        <div className="mt-3 flex items-center gap-3">
          <span className="font-display text-4xl font-semibold leading-none text-[color:var(--m-ink)]">
            {Number(ratingSummary.avg_rating).toFixed(1)}
          </span>
          <div className="space-y-1">
            <StarRating value={ratingSummary.avg_rating} size="sm" />
            <p className="text-xs text-[color:var(--m-ink-soft)]">
              {t("header.reviewsSection.summary", { count: ratingSummary.review_count })}
            </p>
          </div>
        </div>
      )}

      {!reviews?.length ? (
        <p className="mt-4 text-sm text-[color:var(--m-ink-soft)]">
          {t("header.reviewsSection.empty")}
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} tone="menu" />
          ))}
          {/* The page fetches only the newest REVIEWS_LIMIT (review_count
              also includes per-dish reviews, so it can't tell us whether any
              were cut off) -- note it once the limit is actually hit. */}
          {reviews.length >= REVIEWS_LIMIT && (
            <p className="text-xs text-[color:var(--m-ink-soft)]">
              {t("header.reviewsSection.showingLatest", { shown: reviews.length })}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
