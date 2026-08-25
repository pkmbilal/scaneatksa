"use client";

// Shared star-rating component used by the owner Reviews tab, the customer
// review form, and the public menu page. Two modes:
//   - "display" (default): read-only, filled stars rounded to the nearest
//     whole star, optionally with the numeric value/count as text.
//   - "input": interactive 1-5 picker with hover preview, calls onChange.
// Built on lucide-react's Star with the same fill="currentColor" toggle
// FavoriteButton/RestaurantCard already use for their icons.
import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

export default function StarRating({
  value = 0,
  mode = "display",
  size = "md",
  showValue = false,
  reviewCount,
  onChange,
  className = "",
}) {
  const [hoverValue, setHoverValue] = useState(0);
  const isInput = mode === "input";
  const activeValue = isInput && hoverValue > 0 ? hoverValue : Math.round(Number(value) || 0);
  const starClass = SIZES[size] || SIZES.md;

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <div
        className="inline-flex items-center gap-0.5"
        onMouseLeave={isInput ? () => setHoverValue(0) : undefined}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= activeValue;

          if (!isInput) {
            return (
              <Star
                key={star}
                className={`${starClass} ${filled ? "fill-warning-500 text-warning-500" : "text-gray-300 dark:text-gray-700"}`}
              />
            );
          }

          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange?.(star)}
              onMouseEnter={() => setHoverValue(star)}
              className="cursor-pointer p-0.5 transition-transform hover:scale-110"
              aria-label={`${star}`}
            >
              <Star
                className={`${starClass} ${filled ? "fill-warning-500 text-warning-500" : "text-gray-300 dark:text-gray-700"}`}
              />
            </button>
          );
        })}
      </div>

      {showValue && (
        // text-current so a text-color override passed via `className` (e.g.
        // the white text needed on the menu page's dark hero banner) applies
        // here too, instead of being stuck on the default gray.
        <span className={cn("text-sm font-semibold text-current", className ? "" : "text-gray-700 dark:text-gray-300")}>
          {Number(value || 0).toFixed(1)}
          {reviewCount != null && (
            <span className="ms-1 font-normal opacity-75">({reviewCount})</span>
          )}
        </span>
      )}
    </div>
  );
}
