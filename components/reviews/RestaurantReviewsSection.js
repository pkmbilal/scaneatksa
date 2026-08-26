// Public menu-page reviews list. Purely presentational -- reviews are
// fetched server-side in app/menu/[restaurantSlug]/page.js (a server
// component) and passed down as a prop, matching that page's existing style
// of fetching everything up top rather than adding another server/client
// boundary. No owner actions here -- replies are read-only on this page.
import { getTranslations } from "next-intl/server";
import ReviewCard from "@/components/reviews/ReviewCard";

export default async function RestaurantReviewsSection({ reviews }) {
  const t = await getTranslations("menu");

  return (
    <section id="reviews" className="mt-10">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white/90">{t("header.reviewsSection.title")}</h2>

      {!reviews?.length ? (
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{t("header.reviewsSection.empty")}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </section>
  );
}
