"use client";

import { supabaseBrowser } from "@/lib/supabase/client";
const supabase = supabaseBrowser();

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { getCurrentUser, getUserProfile, getDashboardPath, needsMfa, signOut } from "@/lib/auth/client";
import LanguageSwitcher from "@/components/LanguageSwitcher";

// Supabase returns the QR as a raw, unescaped "data:image/svg+xml;utf-8,<svg…>\n"
// string, which next/image rejects (trailing newline, raw markup). Re-encode it.
function svgDataUri(qrCode) {
  const svg = qrCode.replace(/^data:image\/svg\+xml;[^,]*,/, "").trim();
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// Second sign-in step for admins: TOTP from an authenticator app. On first
// visit (no verified factor yet) the admin scans a QR code to enroll; after
// that they just enter the 6-digit code. Passing it upgrades the session to
// aal2, which is_admin() and requireAdmin() require.
export default function MfaPage() {
  const t = useTranslations("auth");
  const router = useRouter();

  const [mode, setMode] = useState("loading"); // loading | enroll | verify
  const [factorId, setFactorId] = useState(null);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Enrolling twice (StrictMode re-runs effects in dev) would leave a stray
  // unverified factor, so run setup once.
  const started = useRef(false);

  useEffect(() => {
    document.body.classList.add("hide-navbar");
    return () => document.body.classList.remove("hide-navbar");
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    setup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setup() {
    const { user } = await getCurrentUser();
    if (!user) {
      router.replace("/auth/login");
      return;
    }

    const { data: profile } = await getUserProfile(user.id);
    if (profile?.role !== "admin") {
      router.replace(getDashboardPath(profile?.role));
      return;
    }

    if (!(await needsMfa())) {
      router.replace("/dashboard/admin");
      return;
    }

    const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
    if (listError) {
      setError(t("mfa.loadError"));
      setMode("verify");
      return;
    }

    // `totp` only lists verified factors.
    const verified = factors?.totp?.[0];
    if (verified) {
      setFactorId(verified.id);
      setMode("verify");
      return;
    }

    // Clear enrollments abandoned before their first code was entered.
    const stale = (factors?.all || []).filter((f) => f.factor_type === "totp" && f.status === "unverified");
    for (const f of stale) {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }

    const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "ScanEat admin",
      // Without this Supabase uses the Site URL host, so the label would change per environment.
      issuer: "ScanEat",
    });
    if (enrollError || !enrolled) {
      setError(t("mfa.loadError"));
      setMode("enroll");
      return;
    }

    setFactorId(enrolled.id);
    setQrCode(svgDataUri(enrolled.totp.qr_code));
    setSecret(enrolled.totp.secret);
    setMode("enroll");
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!factorId) return;
    setError("");
    setSubmitting(true);

    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: code.trim(),
    });

    if (verifyError) {
      setError(t("mfa.invalidCode"));
      setSubmitting(false);
      return;
    }

    router.replace("/dashboard/admin");
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/auth/login");
  };

  return (
    <>
      <LanguageSwitcher className="fixed top-4 end-4 z-50" />

      <div className="min-h-screen bg-white md:bg-gradient-to-br md:from-green-50 md:to-green-100 flex items-center justify-center md:px-4">
        <div className="w-full md:max-w-md bg-white md:rounded-lg md:shadow-xl p-8">
          <div className="flex items-center justify-center flex-col mb-6 text-center">
            <ShieldCheck size={48} className="text-green-500 mb-2" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {mode === "enroll" ? t("mfa.enrollTitle") : t("mfa.verifyTitle")}
            </h1>
            <p className="text-gray-600">
              {mode === "enroll" ? t("mfa.enrollSubtitle") : t("mfa.verifySubtitle")}
            </p>
          </div>

          {mode === "loading" ? (
            <p className="text-center text-gray-500">{t("mfa.loading")}</p>
          ) : (
            <form onSubmit={handleSubmit}>
              {mode === "enroll" && qrCode && (
                <div className="mb-6 flex flex-col items-center">
                  <Image src={qrCode} alt={t("mfa.qrAlt")} width={192} height={192} unoptimized />
                  <p className="mt-3 text-sm text-gray-600">{t("mfa.manualEntry")}</p>
                  <code dir="ltr" className="mt-1 break-all rounded bg-gray-100 px-2 py-1 text-sm select-all">
                    {secret}
                  </code>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t("mfa.codeLabel")}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  dir="ltr"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center tracking-widest focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
              )}

              <button
                type="submit"
                disabled={submitting || !factorId || code.length !== 6}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-400 cursor-pointer"
              >
                {submitting ? t("mfa.verifying") : t("mfa.verifyButton")}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button type="button" onClick={handleSignOut} className="text-sm text-gray-600 hover:text-green-600">
              {t("mfa.signOut")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
