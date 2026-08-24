"use client";

// Owner Analytics tab: KPI row + Revenue Over Time + Channel Breakdown +
// Top Selling Items. Purely presentational -- data/loading/range state is
// owned by useOwnerAnalytics in app/dashboard/owner/page.js and passed down,
// matching how OwnerOrdersTab/StaffTab already receive their data as props
// rather than fetching themselves.
import { useTranslations } from "next-intl";
import { Wallet, Receipt, TrendingUp, Store } from "lucide-react";
import StatCard from "@/components/dashboard/shared/StatCard";
import RevenueTrendChart from "@/components/dashboard/owner/RevenueTrendChart";
import ChannelBreakdownChart from "@/components/dashboard/owner/ChannelBreakdownChart";
import TopItemsList from "@/components/dashboard/owner/TopItemsList";
import { CHANNEL_META } from "@/lib/orderStatus";

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <h4 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">{title}</h4>
      {children}
    </div>
  );
}

export default function AnalyticsTab({ analytics }) {
  const t = useTranslations("dashboard.owner");
  const { loading, error, kpis, revenueByDay, channelBreakdown, topItems } = analytics;

  if (loading) {
    return <div className="text-sm text-gray-500 dark:text-gray-400">{t("analyticsTab.loading")}</div>;
  }

  if (error) {
    return <div className="text-sm text-error-600 dark:text-error-400">{t("analyticsTab.loadFailed")}</div>;
  }

  const topChannelLabel = kpis.topChannel ? t(`analyticsTab.channelNames.${kpis.topChannel}`) : "—";
  const TopChannelIcon = kpis.topChannel ? CHANNEL_META[kpis.topChannel]?.icon || Store : Store;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          label={t("analyticsTab.totalRevenue")}
          value={t("common.price", { amount: kpis.totalRevenue.toFixed(2) })}
          tint="success"
        />
        <StatCard icon={Receipt} label={t("analyticsTab.totalOrders")} value={kpis.totalOrders} tint="brand" />
        <StatCard
          icon={TrendingUp}
          label={t("analyticsTab.avgOrderValue")}
          value={t("common.price", { amount: kpis.avgOrderValue.toFixed(2) })}
          tint="warning"
        />
        <StatCard icon={TopChannelIcon} label={t("analyticsTab.topChannel")} value={topChannelLabel} tint="gray" />
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">{t("analyticsTab.revenueDefinitionNote")}</p>

      <Section title={t("analyticsTab.revenueOverTime")}>
        <RevenueTrendChart data={revenueByDay} />
      </Section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Section title={t("analyticsTab.ordersByChannel")}>
          <ChannelBreakdownChart data={channelBreakdown} />
        </Section>

        <Section title={t("analyticsTab.topSellingItems")}>
          <TopItemsList items={topItems} />
        </Section>
      </div>
    </div>
  );
}
