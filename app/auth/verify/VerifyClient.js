"use client";

import { supabaseBrowser } from "@/lib/supabase/client";
const supabase = supabaseBrowser();

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { Pizza, BadgeCheck } from "lucide-react";

// shadcn
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function VerifyClient() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const [successOpen, setSuccessOpen] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // ✅ safe guard: searchParams can be empty on first render
  const emailFromUrl = useMemo(() => searchParams?.get("email") || "", [searchParams]);

  // Hide navbar on this page (client-only)
  useEffect(() => {
    document.body.classList.add("hide-navbar");
    return () => document.body.classList.remove("hide-navbar");
  }, []);

  useEffect(() => {
    if (emailFromUrl) setEmail(emailFromUrl);
  }, [emailFromUrl]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => {
      setResendCooldown((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setLoading(false);
      setSuccessOpen(true);
    } catch (err) {
      setError(t("verify.unexpectedError", { message: err?.message || "Unknown error" }));
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setError("");
    setInfo("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setInfo(t("verify.otpResentInfo"));
      setResendCooldown(60);
      setLoading(false);
    } catch (err) {
      setError(t("verify.unexpectedError", { message: err?.message || "Unknown error" }));
      setLoading(false);
    }
  };

  const goDashboard = () => router.push("/dashboard");

  const resendLabel =
    resendCooldown > 0
      ? t("verify.resendOtpCooldown", { seconds: resendCooldown })
      : t("verify.resendOtp");

  return (
    <>
      <LanguageSwitcher className="fixed top-4 end-4 z-50" />

      {/* ✅ Success Dialog */}
      <Dialog
        open={successOpen}
        onOpenChange={(open) => {
          setSuccessOpen(open);
          if (!open) router.push("/auth/login");
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-green-50">
                <BadgeCheck className="h-5 w-5 text-green-600" />
              </span>
              {t("verify.successDialog.title")}
            </DialogTitle>
            <DialogDescription className="mt-2">
              {t("verify.successDialog.description")}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSuccessOpen(false)}>
              {t("verify.successDialog.close")}
            </Button>
            <Button className="bg-primary hover:bg-green-600" onClick={goDashboard}>
              {t("verify.successDialog.continue")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MOBILE wrapper */}
      <div className="md:hidden min-h-screen bg-white flex items-center justify-center px-0">
        <div className="w-full min-h-screen p-8 flex flex-col justify-center">
          <div className="flex items-center justify-center flex-col mb-6">
            <div className="text-5xl mb-2">
              <Pizza size={48} color="#00c951" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{t("verify.title")}</h1>
            <p className="text-gray-600 text-center">
              {t("verify.subtitle")}
            </p>
          </div>

          <form onSubmit={handleVerify}>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("verify.emailLabel")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("verify.emailPlaceholder")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("verify.otpLabel")}
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder={t("verify.otpPlaceholder")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            {info && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                {info}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-400 cursor-pointer"
            >
              {loading ? t("verify.verifying") : t("verify.verifyButton")}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={loading || !email || resendCooldown > 0}
              className="w-full mt-3 border border-gray-300 hover:bg-gray-50 py-3 rounded-lg font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? t("verify.sendingOtp") : resendLabel}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-gray-600 text-sm mb-3 me-1">{t("verify.alreadyVerified")}</span>
            <Link href="/auth/login" className="text-green-600">
              {t("verify.signIn")}
            </Link>
          </div>
        </div>
      </div>

      {/* DESKTOP wrapper */}
      <div className="hidden md:flex min-h-screen bg-gradient-to-br from-green-50 to-green-100 items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="flex items-center justify-center flex-col mb-6">
            <div className="text-5xl mb-2">
              <Pizza size={48} color="#00c951" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{t("verify.title")}</h1>
            <p className="text-gray-600 text-center">
              {t("verify.subtitle")}
            </p>
          </div>

          <form onSubmit={handleVerify}>
            {/* same form */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("verify.emailLabel")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("verify.emailPlaceholder")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("verify.otpLabel")}
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder={t("verify.otpPlaceholder")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            {info && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                {info}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-400 cursor-pointer"
            >
              {loading ? t("verify.verifying") : t("verify.verifyButton")}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={loading || !email || resendCooldown > 0}
              className="w-full mt-3 border border-gray-300 hover:bg-gray-50 py-3 rounded-lg font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? t("verify.sendingOtp") : resendLabel}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-gray-600 text-sm mb-3 me-1">{t("verify.alreadyVerified")}</span>
            <Link href="/auth/login" className="text-green-600">
              {t("verify.signIn")}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
