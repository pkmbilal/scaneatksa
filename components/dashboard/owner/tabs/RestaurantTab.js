"use client";

// Restaurant settings entry point for the owner dashboard's sidebar+tabs
// layout. Shows a read-only summary (reusing RestaurantInfoCard.js
// unchanged) plus quick links to the full edit page, view-menu page, and
// QR code page — replaces the buttons that used to live in the retired
// OwnerDashboardHeader.js.

import Link from "next/link";
import { Eye, QrCode, Pencil } from "lucide-react";
import RestaurantInfoCard from "@/components/dashboard/owner/RestaurantInfoCard";

export default function RestaurantTab({ restaurant }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/menu/${restaurant?.slug}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-500/15 dark:text-blue-400 dark:hover:bg-blue-500/25"
        >
          <Eye className="h-4 w-4" />
          View Menu
        </Link>

        <Link
          href={`/qr/${restaurant?.slug}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-success-50 px-4 py-2 text-sm font-semibold text-success-700 transition-colors hover:bg-success-100 dark:bg-success-500/15 dark:text-success-400 dark:hover:bg-success-500/25"
        >
          <QrCode className="h-4 w-4" />
          QR Code
        </Link>

        <Link
          href="/dashboard/owner/restaurant/edit"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          <Pencil className="h-4 w-4" />
          Edit Restaurant
        </Link>
      </div>

      <RestaurantInfoCard restaurant={restaurant} />
    </div>
  );
}
