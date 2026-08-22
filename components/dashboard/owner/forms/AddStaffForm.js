"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const inputClass =
  "w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white";
const labelClass = "mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300";
const selectTriggerClass =
  "w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

export default function AddStaffForm({ onAdd, onSuccess }) {
  const t = useTranslations("dashboard.owner");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("kitchen");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError(t("addStaffForm.emailPasswordRequired"));
      return;
    }
    if (password.length < 6) {
      setError(t("addStaffForm.passwordTooShort"));
      return;
    }

    setLoading(true);
    const result = await onAdd?.({ email: email.trim(), password, fullName: fullName.trim(), role });
    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    setFullName("");
    setEmail("");
    setPassword("");
    setRole("kitchen");
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass}>{t("addStaffForm.fullNameLabel")}</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder={t("addStaffForm.fullNamePlaceholder")}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>{t("addStaffForm.emailLabel")}</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("addStaffForm.emailPlaceholder")}
          required
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>{t("addStaffForm.passwordLabel")}</label>
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("addStaffForm.passwordPlaceholder")}
          required
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>{t("addStaffForm.roleLabel")}</label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className={selectTriggerClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="kitchen">{t("staffTab.role.kitchen")}</SelectItem>
            <SelectItem value="waiter">{t("staffTab.role.waiter")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">{t("addStaffForm.hint")}</p>

      {error ? (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      ) : null}

      <DialogFooter className="gap-2 sm:gap-0">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50 cursor-pointer"
        >
          {loading ? t("addStaffForm.submitting") : t("addStaffForm.submit")}
        </button>
      </DialogFooter>
    </form>
  );
}
