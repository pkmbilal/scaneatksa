"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { signIn } from "@/lib/auth/client";
import { mapAuthError } from "@/lib/auth/errors";
import LanguageSwitcher from "@/components/LanguageSwitcher";

import { Pizza, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const t = useTranslations("auth");

  // Hide navbar on this page
  useEffect(() => {
    document.body.classList.add("hide-navbar");
    return () => document.body.classList.remove("hide-navbar");
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: signInError } = await signIn(email, password);

      if (signInError) {
        const msg = (signInError.message || "").toLowerCase();

        // ✅ If user hasn't confirmed email yet, send them to OTP screen
        if (
          msg.includes("email not confirmed") ||
          msg.includes("not confirmed") ||
          msg.includes("confirm") ||
          msg.includes("verification")
        ) {
          setLoading(false);
          router.push(`/auth/verify?email=${encodeURIComponent(email)}`);
          return;
        }

        setError(mapAuthError(signInError.message, t));
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError(t("login.unexpectedError", { message: err.message }));
      setLoading(false);
    }
  };

  return (
    <>
      <LanguageSwitcher className="fixed top-4 end-4 z-50" />

      {/* MOBILE wrapper */}
      <div className="md:hidden min-h-screen bg-white flex items-center justify-center px-0">
        <div className="w-full min-h-screen p-8 flex flex-col justify-center">
          <div className="flex items-center justify-center flex-col mb-6">
            <div className="text-5xl mb-2">
              <Pizza size={48} color="#00c951" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {t("login.welcomeBack")}
            </h1>
            <p className="text-gray-600">{t("login.signInSubtitle")}</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("login.emailLabel")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("login.emailPlaceholder")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            {/* Password */}
            <div className="mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                {t("login.passwordLabel")}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("login.passwordPlaceholder")}
                  className="w-full px-4 py-3 mb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pe-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-3.5 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end mb-4">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                {t("login.forgotPassword")}
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-400 cursor-pointer"
            >
              {loading ? t("login.signingIn") : t("login.signIn")}
            </button>
          </form>

          {/* Signup Button */}
          <div className="mt-6 text-center">
            <span className="text-gray-600 text-sm mb-3 me-1">
              {t("login.noAccount")}
            </span>
            <Link href="/auth/signup" className="text-green-600">
              {t("login.signup")}
            </Link>
          </div>
        </div>
      </div>

      {/* DESKTOP wrapper (green gradient bg) */}
      <div className="hidden md:flex min-h-screen bg-gradient-to-br from-green-50 to-green-100 items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="flex items-center justify-center flex-col mb-6">
            <div className="text-5xl mb-2">
              <Pizza size={48} color="#00c951" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {t("login.welcomeBack")}
            </h1>
            <p className="text-gray-600">{t("login.signInSubtitle")}</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("login.emailLabel")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("login.emailPlaceholder")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            {/* Password */}
            <div className="mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                {t("login.passwordLabel")}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("login.passwordPlaceholder")}
                  className="w-full px-4 py-3 mb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pe-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-3.5 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end mb-4">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                {t("login.forgotPassword")}
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-400 cursor-pointer"
            >
              {loading ? t("login.signingIn") : t("login.signIn")}
            </button>
          </form>

          {/* Signup Button */}
          <div className="mt-6 text-center">
            <span className="text-gray-600 text-sm mb-3 me-1">
              {t("login.noAccount")}
            </span>
            <Link href="/auth/signup" className="text-green-600">
              {t("login.signup")}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
