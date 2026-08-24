"use client";

// Horizontal bar-per-channel breakdown (dine-in / delivery / pickup) for the
// owner Analytics tab. Reuses CHANNEL_META's icon + color for each channel
// so this visually matches the channel badges already shown on
// OwnerOrdersTab, instead of inventing new chart colors. Each bar carries
// its own channel name + icon directly (not a separate legend box), which
// already satisfies "identity never by color alone" for this 3-category set.
import { useTranslations } from "next-intl";
import { CHANNEL_META } from "@/lib/orderStatus";

const CHANNEL_BAR_FILL = {
  dine_in: "bg-brand-500",
  delivery: "bg-orange-500",
  pickup: "bg-success-500",
};

export default function ChannelBreakdownChart({ data }) {
  const t = useTranslations("dashboard.owner");
  const total = (data || []).reduce((sum, d) => sum + d.orderCount, 0);

  if (total === 0) {
    return (
      <div className="flex h-[160px] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        {t("analyticsTab.noOrdersYet")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(data || []).map((d) => {
        const meta = CHANNEL_META[d.channel] || CHANNEL_META.dine_in;
        const Icon = meta.icon;
        const pct = total > 0 ? (d.orderCount / total) * 100 : 0;
        const label = t(`analyticsTab.channelNames.${d.channel}`);

        return (
          <div key={d.channel} className="flex items-center gap-3">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.badge}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-medium text-gray-700 dark:text-gray-300">{label}</span>
                <span className="shrink-0 text-gray-500 dark:text-gray-400">
                  {t("analyticsTab.channelCount", { count: d.orderCount })}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className={`h-full rounded-full ${CHANNEL_BAR_FILL[d.channel] || "bg-gray-400"}`}
                  style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
