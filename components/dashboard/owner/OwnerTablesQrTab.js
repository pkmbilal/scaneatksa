"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { QrCode, Power, PowerOff, Trash2 } from "lucide-react";

const pillClass = "text-xs px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap";
const activeTint = "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400";
const inactiveTint = "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

export default function OwnerTablesQrTab({
  restaurant,
  tables,
  tablesLoading,
  onToggleActive,
  onDeleteTable,
}) {
  const t = useTranslations("dashboard.owner");
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(t("ownerTablesQrTab.copied"));
    } catch {
      alert(t("ownerTablesQrTab.copyFailed"));
    }
  };

  return (
    <div>
      {/* Online link (no table) */}
      <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{t("ownerTablesQrTab.onlineLinkTitle")}</p>
            <p className="truncate text-sm text-gray-500 dark:text-gray-400">
              {baseUrl}/menu/{restaurant.slug}
            </p>
          </div>
          <button
            type="button"
            onClick={() => copy(`${baseUrl}/menu/${restaurant.slug}`)}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer"
          >
            {t("ownerTablesQrTab.copyLink")}
          </button>
        </div>
      </div>

      {/* Tables list */}
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-gray-800 dark:text-white/90">{t("ownerTablesQrTab.tableQrsTitle")}</p>
          <span className={`${pillClass} ${inactiveTint}`}>{t("ownerTablesQrTab.tableCount", { count: tables.length })}</span>
        </div>

        {tablesLoading ? (
          <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">{t("ownerTablesQrTab.loadingTables")}</div>
        ) : tables.length === 0 ? (
          <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            {t.rich("ownerTablesQrTab.noTablesYet", { b: (chunks) => <b>{chunks}</b> })}
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {tables.map((table) => {
              const url = `${baseUrl}/menu/${restaurant.slug}?t=${encodeURIComponent(table.code)}`;

              // ✅ Option 1: redirect to existing QR page under /qr/[restaurantSlug]
              // and pass table code via query param (your QR page reads ?code=...)
              const qrHref = `/qr/${encodeURIComponent(restaurant.slug)}?code=${encodeURIComponent(
                table.code
              )}`;

              return (
                <div
                  key={table.id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800 dark:text-white/90">{t("ownerTablesQrTab.tableLabel", { number: table.table_number })}</p>
                      <span className={`${pillClass} ${table.is_active ? activeTint : inactiveTint}`}>
                        {table.is_active ? t("ownerTablesQrTab.active") : t("ownerTablesQrTab.inactive")}
                      </span>
                    </div>
                    <p className="truncate text-sm text-gray-500 dark:text-gray-400">{url}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={qrHref}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-success-50 px-4 py-2 text-sm font-semibold text-success-700 transition-colors hover:bg-success-100 dark:bg-success-500/15 dark:text-success-400 dark:hover:bg-success-500/25"
                    >
                      <QrCode className="h-4 w-4" />
                      {t("ownerTablesQrTab.qrCode")}
                    </Link>

                    <button
                      type="button"
                      onClick={() => copy(url)}
                      className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      {t("ownerTablesQrTab.copyLink")}
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleActive?.(table)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                        table.is_active
                          ? "bg-warning-50 text-warning-700 hover:bg-warning-100 dark:bg-warning-500/15 dark:text-warning-400 dark:hover:bg-warning-500/25"
                          : "bg-success-50 text-success-700 hover:bg-success-100 dark:bg-success-500/15 dark:text-success-400 dark:hover:bg-success-500/25"
                      }`}
                    >
                      {table.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                      {table.is_active ? t("ownerTablesQrTab.deactivate") : t("ownerTablesQrTab.activate")}
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteTable?.(table)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-error-50 px-4 py-2 text-sm font-semibold text-error-700 transition-colors hover:bg-error-100 dark:bg-error-500/15 dark:text-error-400 dark:hover:bg-error-500/25 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t("ownerTablesQrTab.delete")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        {t("ownerTablesQrTab.nextStepNote")}
      </p>
    </div>
  );
}
