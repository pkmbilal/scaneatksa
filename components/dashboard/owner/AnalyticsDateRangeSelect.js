"use client";

// Preset date-range picker for the owner Analytics tab header. Thin wrapper
// around the existing shadcn Select (components/ui/select.jsx) -- no new
// dependency, just the 4 fixed presets from useOwnerAnalytics's RANGE_OPTIONS.
import { useTranslations } from "next-intl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RANGE_OPTIONS } from "@/components/dashboard/owner/hooks/useOwnerAnalytics";

export default function AnalyticsDateRangeSelect({ value, onChange }) {
  const t = useTranslations("dashboard.owner.analyticsTab.range");

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[160px] cursor-pointer bg-white dark:bg-gray-900" aria-label={t("label")}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {RANGE_OPTIONS.map((opt) => (
          <SelectItem key={opt} value={opt} className="cursor-pointer">
            {t(opt)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
