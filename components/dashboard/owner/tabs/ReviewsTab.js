"use client";

// Owner Reviews tab: KPI row (avg rating / total / unreplied) + a list of
// ReviewCards with a Reply action. Structural sibling to
// OwnerOrdersTab/AnalyticsTab -- data/loading is owned by useOwnerReviews in
// app/dashboard/owner/page.js and passed down as props.
import { useTranslations } from "next-intl";
import { Star, MessagesSquare, MessageSquareWarning } from "lucide-react";
import StatCard from "@/components/dashboard/shared/StatCard";
import ReviewCard from "@/components/reviews/ReviewCard";
import ReplyDialog from "@/components/dashboard/owner/dialogs/ReplyDialog";

export default function ReviewsTab({ reviews, kpis, loading, onReplied }) {
  const t = useTranslations("dashboard.owner");

  if (loading) {
    return <div className="text-sm text-gray-500 dark:text-gray-400">{t("reviewsTab.loading")}</div>;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3">
        <StatCard icon={Star} label={t("reviewsTab.avgRating")} value={kpis.avgRating.toFixed(1)} tint="warning" />
        <StatCard icon={MessagesSquare} label={t("reviewsTab.totalReviews")} value={kpis.count} tint="brand" />
        <StatCard
          icon={MessageSquareWarning}
          label={t("reviewsTab.unreplied")}
          value={kpis.unrepliedCount}
          tint={kpis.unrepliedCount > 0 ? "error" : "gray"}
        />
      </div>

      {reviews.length === 0 ? (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">{t("reviewsTab.empty")}</div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              ownerActions={<ReplyDialog review={review} onReplied={onReplied} />}
            />
          ))}
        </div>
      )}
    </div>
  );
}
