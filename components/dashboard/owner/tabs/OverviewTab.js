"use client";

// Overview tab content for the owner dashboard's sidebar+tabs layout.
// Reuses RestaurantInfoCard.js unchanged. The menu-item breakdown
// (Available/Unavailable/Sold Out) lives on the Items tab instead, since
// it's menu-item-specific detail rather than restaurant-wide summary.

import RestaurantInfoCard from "@/components/dashboard/owner/RestaurantInfoCard";

export default function OverviewTab({ restaurant }) {
  return (
    <div className="space-y-5">
      <RestaurantInfoCard restaurant={restaurant} />
    </div>
  );
}
