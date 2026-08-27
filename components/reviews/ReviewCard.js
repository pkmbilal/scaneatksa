"use client";

// Renders one review: reviewer avatar/name, star rating, comment, and the
// owner's reply if one exists. Comment/reply text is rendered as-is, never
// routed through useTranslations -- it's Supabase-sourced user content, per
// the i18n house rule in i18n/request.js. `ownerActions` is an optional
// slot so the owner dashboard can inject a Reply/Edit-reply button without
// this component needing to know about owner permissions. Uses the "menu"
// namespace (not "dashboard.owner") for its two chrome strings since this
// card renders on both the owner dashboard and the public menu page.
// `itemName` is optional -- when set, this review is scoped to one menu
// item rather than the restaurant overall, and gets a small label for it.
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import StarRating from "@/components/reviews/StarRating";

function initialsFor(name) {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase();
}

// `tone="menu"` renders the card in the "Souk Modern" palette used on the
// public menu page. Any other value keeps the original neutral styling so
// the owner dashboard's Reviews tab is unaffected.
export default function ReviewCard({ review, ownerActions, itemName, tone }) {
  const t = useTranslations("menu");
  const menuTone = tone === "menu";
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
    <div
      className={cn(
        "rounded-2xl border p-4 shadow-theme-xs",
        menuTone
          ? "border-[color:var(--m-line)] bg-[color:var(--m-parchment)]"
          : "border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar>
            <AvatarFallback>{initialsFor(review?.reviewer_name)}</AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <p
              className={cn(
                "font-semibold",
                menuTone
                  ? "text-[color:var(--m-ink)]"
                  : "text-gray-800 dark:text-white/90"
              )}
            >
              {review?.reviewer_name || t("reviews.anonymous")}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <StarRating value={review.rating} size="sm" />
              <span
                className={cn(
                  "text-xs",
                  menuTone
                    ? "text-[color:var(--m-ink-soft)]"
                    : "text-gray-500 dark:text-gray-400"
                )}
              >
                {formatDate(review.created_at)}
              </span>
              {itemName && (
                <Badge variant="outline" className="text-[10px] font-normal">
                  {t("reviews.forItem", { name: itemName })}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {ownerActions && <div className="shrink-0">{ownerActions}</div>}
      </div>

      {review.comment && (
        <p
          className={cn(
            "mt-3 whitespace-pre-wrap text-sm",
            menuTone
              ? "text-[color:var(--m-ink)]"
              : "text-gray-700 dark:text-gray-300"
          )}
        >
          {review.comment}
        </p>
      )}

      {reply && (
        <>
          <Separator className="my-3" />
          <div
            className={cn(
              "ms-4 border-s-2 ps-3",
              menuTone
                ? "border-[color:var(--m-accent-text)]"
                : "border-brand-200 dark:border-brand-800"
            )}
          >
            <p
              className={cn(
                "text-xs font-semibold",
                menuTone
                  ? "text-[color:var(--m-accent-text)]"
                  : "text-brand-600 dark:text-brand-400"
              )}
            >
              {t("reviews.ownerReply")}
            </p>
            <p
              className={cn(
                "mt-1 whitespace-pre-wrap text-sm",
                menuTone
                  ? "text-[color:var(--m-ink)]"
                  : "text-gray-700 dark:text-gray-300"
              )}
            >
              {reply.reply}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
