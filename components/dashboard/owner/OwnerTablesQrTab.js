"use client";

import Link from "next/link";
import { QrCode } from "lucide-react";

const pillClass = "text-xs px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap";
const activeTint = "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400";
const inactiveTint = "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

export default function OwnerTablesQrTab({
  restaurant,
  tables,
  tablesLoading,
  tableCount,
  setTableCount,
  generatingTables,
  onGenerateTables,
  onRefreshTables,
}) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied ✅");
    } catch {
      alert("Copy failed (browser blocked clipboard).");
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Number of tables
          </label>
          <input
            type="number"
            min={1}
            max={200}
            value={tableCount}
            onChange={(e) => setTableCount(e.target.value)}
            placeholder="e.g. 10"
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            This creates missing tables (1..N). Existing ones won&rsquo;t be duplicated.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onGenerateTables}
            disabled={generatingTables}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50 cursor-pointer"
          >
            {generatingTables ? "Generating..." : "Generate Tables"}
          </button>
          <button
            type="button"
            onClick={onRefreshTables}
            disabled={tablesLoading}
            className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Online link (no table) */}
      <div className="mt-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-white/90">Online ordering link</p>
            <p className="truncate text-sm text-gray-500 dark:text-gray-400">
              {baseUrl}/menu/{restaurant.slug}
            </p>
          </div>
          <button
            type="button"
            onClick={() => copy(`${baseUrl}/menu/${restaurant.slug}`)}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer"
          >
            Copy link
          </button>
        </div>
      </div>

      {/* Tables list */}
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-gray-800 dark:text-white/90">Table QRs</p>
          <span className={`${pillClass} ${inactiveTint}`}>{tables.length} tables</span>
        </div>

        {tablesLoading ? (
          <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading tables…</div>
        ) : tables.length === 0 ? (
          <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            No tables yet. Click <b>Generate Tables</b>.
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {tables.map((t) => {
              const url = `${baseUrl}/menu/${restaurant.slug}?t=${encodeURIComponent(t.code)}`;

              // ✅ Option 1: redirect to existing QR page under /qr/[restaurantSlug]
              // and pass table code via query param (your QR page reads ?code=...)
              const qrHref = `/qr/${encodeURIComponent(restaurant.slug)}?code=${encodeURIComponent(
                t.code
              )}`;

              return (
                <div
                  key={t.id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800 dark:text-white/90">Table {t.table_number}</p>
                      <span className={`${pillClass} ${t.is_active ? activeTint : inactiveTint}`}>
                        {t.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="truncate text-sm text-gray-500 dark:text-gray-400">{url}</p>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={qrHref}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-success-50 px-4 py-2 text-sm font-semibold text-success-700 transition-colors hover:bg-success-100 dark:bg-success-500/15 dark:text-success-400 dark:hover:bg-success-500/25"
                    >
                      <QrCode className="h-4 w-4" />
                      QR Code
                    </Link>

                    <button
                      type="button"
                      onClick={() => copy(url)}
                      className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      Copy link
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Next step: add a &ldquo;Download QR Pack (PDF)&rdquo; button to print all tables in one click.
      </p>
    </div>
  );
}
