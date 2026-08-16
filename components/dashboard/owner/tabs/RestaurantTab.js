"use client";

// Restaurant settings entry point for the owner dashboard's sidebar+tabs
// layout. Shows a read-only summary (reusing RestaurantInfoCard.js
// unchanged) plus quick links to the full edit page, view-menu page, and
// QR code page — replaces the buttons that used to live in the retired
// OwnerDashboardHeader.js.

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye, QrCode, Pencil } from "lucide-react";
import RestaurantInfoCard from "@/components/dashboard/owner/RestaurantInfoCard";

export default function RestaurantTab({ restaurant }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="secondary" size="sm" className="rounded-full">
          <Link href={`/menu/${restaurant?.slug}`}>
            <Eye className="h-4 w-4 mr-2" />
            View Menu
          </Link>
        </Button>

        <Button asChild variant="secondary" size="sm" className="rounded-full">
          <Link href={`/qr/${restaurant?.slug}`}>
            <QrCode className="h-4 w-4 mr-2" />
            QR Code
          </Link>
        </Button>

        <Button asChild size="sm" className="rounded-full">
          <Link href="/dashboard/owner/restaurant/edit">
            <Pencil className="h-4 w-4 mr-2" />
            Edit Restaurant
          </Link>
        </Button>
      </div>

      <RestaurantInfoCard restaurant={restaurant} />
    </div>
  );
}
