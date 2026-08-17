"use client";

import { Layers, Ban, BadgeCheck } from "lucide-react";
import StatCard from "@/components/dashboard/shared/StatCard";

export default function OwnerStats({ menuItems }) {
  const availableCount = (menuItems || []).filter((i) => i.is_available).length;
  const unavailableCount = (menuItems || []).filter((i) => !i.is_available).length;
  const soldOutCount = (menuItems || []).filter((i) => i.is_sold_out).length;

  return (
    <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3">
      <StatCard icon={BadgeCheck} label="Available" value={availableCount} tint="success" />
      <StatCard icon={Ban} label="Unavailable" value={unavailableCount} tint="error" />
      <StatCard icon={Layers} label="Sold Out" value={soldOutCount} tint="warning" />
    </div>
  );
}
