"use client";

// Preset date-range picker for the owner Orders tab header. Thin wrapper around
// the shadcn Select (components/ui/select.jsx) -- same shape as
// AnalyticsDateRangeSelect, but with its own preset list (adds "all" and
// "yesterday") and its own i18n scope.
import { useTranslations } from "next-intl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ORDERS_RANGE_OPTIONS } from "@/components/dashboard/owner/lib/ordersDateRange";

export default function OrdersDateFilterSelect({ value, onChange }) {
  const t = useTranslations("dashboard.owner.ownerOrdersTab.range");

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[150px] cursor-pointer bg-white dark:bg-gray-900" aria-label={t("label")}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ORDERS_RANGE_OPTIONS.map((opt) => (
          <SelectItem key={opt} value={opt} className="cursor-pointer">
            {t(opt)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
