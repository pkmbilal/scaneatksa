"use client";

// Overview tab content for the owner dashboard's sidebar+tabs layout.
// Reuses OwnerStats.js and RestaurantInfoCard.js unchanged.

import OwnerStats from "@/components/dashboard/owner/OwnerStats";
import RestaurantInfoCard from "@/components/dashboard/owner/RestaurantInfoCard";

export default function OverviewTab({ restaurant, menuItems }) {
  return (
    <div className="space-y-5">
      <OwnerStats menuItems={menuItems} />
      <RestaurantInfoCard restaurant={restaurant} />
    </div>
  );
}
