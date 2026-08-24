"use client";

// Hand-rolled inline SVG bar chart -- revenue per day for the selected
// range. No charting library: package.json has none today, and this is a
// single series over at most 90 daily buckets, well within hand-rolled
// territory (see the analytics plan's charting-approach rationale). Single
// hue (brand), so per the dataviz method a single-series chart needs no
// legend box -- the section title already names what's plotted.
//
// Time always flows left-to-right regardless of page direction: charts are
// a near-universal LTR convention (like numerals), so the SVG coordinate
// system is fixed LTR even under dir="rtl" -- only the surrounding text
// layout follows the page direction.
import { useId, useState } from "react";
import { useTranslations } from "next-intl";

const WIDTH = 640;
const HEIGHT = 220;
const PAD_LEFT = 8;
const PAD_RIGHT = 8;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;
const BAR_MAX_THICKNESS = 24;

export default function RevenueTrendChart({ data }) {
  const t = useTranslations("dashboard.owner");
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState(null);

  const hasData = data && data.length > 0;
  const maxRevenue = hasData ? Math.max(...data.map((d) => d.revenue), 0) : 0;

  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const slot = hasData ? plotWidth / data.length : 0;
  const barWidth = Math.min(BAR_MAX_THICKNESS, slot * 0.6);

  // Show every day label when there are few buckets; thin them out otherwise
  // so labels don't collide.
  const labelStride = !hasData ? 1 : Math.max(1, Math.ceil(data.length / 8));

  if (!hasData || maxRevenue === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        {t("analyticsTab.noRevenueYet")}
      </div>
    );
  }

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label={t("analyticsTab.revenueOverTime")}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" className="[stop-color:var(--color-brand-500)]" stopOpacity="0.9" />
            <stop offset="100%" className="[stop-color:var(--color-brand-500)]" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* baseline */}
        <line
          x1={PAD_LEFT}
          y1={PAD_TOP + plotHeight}
          x2={WIDTH - PAD_RIGHT}
          y2={PAD_TOP + plotHeight}
          className="stroke-gray-200 dark:stroke-gray-800"
          strokeWidth="1"
        />

        {data.map((d, i) => {
          const cx = PAD_LEFT + slot * i + slot / 2;
          const barHeight = maxRevenue > 0 ? (d.revenue / maxRevenue) * plotHeight : 0;
          const y = PAD_TOP + plotHeight - barHeight;
          const showLabel = i % labelStride === 0 || i === data.length - 1;
          const isHovered = hoverIndex === i;

          return (
            <g key={d.date.toISOString()}>
              {/* wider invisible hit target, bigger than the visible bar */}
              <rect
                x={cx - slot / 2}
                y={PAD_TOP}
                width={slot}
                height={plotHeight}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex((h) => (h === i ? null : h))}
              />
              <rect
                x={cx - barWidth / 2}
                y={barHeight > 0 ? y : PAD_TOP + plotHeight - 1}
                width={barWidth}
                height={Math.max(barHeight, 1)}
                rx={4}
                fill={isHovered ? "var(--color-brand-600)" : `url(#${gradientId})`}
                pointerEvents="none"
              />
              {showLabel && (
                <text
                  x={cx}
                  y={HEIGHT - 8}
                  textAnchor="middle"
                  className="fill-gray-500 dark:fill-gray-400"
                  fontSize="10"
                >
                  {d.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hoverIndex !== null && data[hoverIndex] && (
        <div
          className="pointer-events-none absolute top-0 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs shadow-theme-md dark:border-gray-800 dark:bg-gray-900"
          style={{
            left: `${((PAD_LEFT + slot * hoverIndex + slot / 2) / WIDTH) * 100}%`,
            transform: "translate(-50%, -4px)",
          }}
        >
          <div className="font-semibold text-gray-800 dark:text-white/90">
            {data[hoverIndex].date.toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </div>
          <div className="text-gray-500 dark:text-gray-400">
            {t("analyticsTab.revenueTooltip", {
              amount: data[hoverIndex].revenue.toFixed(2),
              orders: data[hoverIndex].orderCount,
            })}
          </div>
        </div>
      )}
    </div>
  );
}
