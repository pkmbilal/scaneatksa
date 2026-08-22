"use client";

import { useTranslations } from "next-intl";

const roleTint = {
  kitchen: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
  waiter: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400",
};

export default function StaffTab({ staff, staffLoading, onToggleActive }) {
  const t = useTranslations("dashboard.owner");
  const roleLabel = { kitchen: t("staffTab.role.kitchen"), waiter: t("staffTab.role.waiter") };

  return (
    <div>
      {staffLoading ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">{t("staffTab.loading")}</div>
      ) : staff.length === 0 ? (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">{t("staffTab.empty")}</div>
      ) : (
        <div className="space-y-2">
          {staff.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-800 dark:text-white/90">{s.full_name || t("staffTab.noName")}</p>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${roleTint[s.role]}`}>
                    {roleLabel[s.role] || s.role}
                  </span>
                  {!s.is_active && (
                    <span className="text-xs bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400 px-2.5 py-0.5 rounded-full font-semibold">
                      {t("staffTab.disabled")}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  {t("staffTab.addedOn", { date: new Date(s.created_at).toLocaleDateString() })}
                </p>
              </div>

              <button
                onClick={() => onToggleActive?.(s.id, s.is_active)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  s.is_active
                    ? "bg-warning-50 text-warning-700 hover:bg-warning-100 dark:bg-warning-500/15 dark:text-warning-400"
                    : "bg-success-50 text-success-700 hover:bg-success-100 dark:bg-success-500/15 dark:text-success-400"
                }`}
              >
                {s.is_active ? t("staffTab.disable") : t("staffTab.enable")}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
