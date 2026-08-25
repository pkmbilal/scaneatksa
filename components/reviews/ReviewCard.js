"use client";

// Renders one review: reviewer avatar/name, star rating, comment, and the
// owner's reply if one exists. Comment/reply text is rendered as-is, never
// routed through useTranslations -- it's Supabase-sourced user content, per
// the i18n house rule in i18n/request.js. `ownerActions` is an optional
// slot so the owner dashboard can inject a Reply/Edit-reply button without
// this component needing to know about owner permissions. Uses the "menu"
// namespace (not "dashboard.owner") for its two chrome strings since this
// card renders on both the owner dashboard and the public menu page.
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import StarRating from "@/components/reviews/StarRating";

function initialsFor(name) {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase();
}

export default function ReviewCard({ review, ownerActions }) {
  const t = useTranslations("menu");
  // review_replies comes back as a single object (or null), not an array --
  // review_id is unique in review_replies, so PostgREST treats it as a
  // to-one embed.
  const reply = review?.review_replies;

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString();
    } catch {
      return iso;
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar>
            <AvatarFallback>{initialsFor(reviewer?.full_name)}</AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <p className="font-semibold text-gray-800 dark:text-white/90">
              {review?.reviewer_name || t("reviews.anonymous")}
            </p>
            <div className="mt-0.5 flex items-center gap-2">
              <StarRating value={review.rating} size="sm" />
              <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(review.created_at)}</span>
            </div>
          </div>
        </div>

        {ownerActions && <div className="shrink-0">{ownerActions}</div>}
      </div>

      {review.comment && (
        <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{review.comment}</p>
      )}

      {reply && (
        <>
          <Separator className="my-3" />
          <div className="ms-4 border-s-2 border-brand-200 ps-3 dark:border-brand-800">
            <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">
              {t("reviews.ownerReply")}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{reply.reply}</p>
          </div>
        </>
      )}
    </div>
  );
}
