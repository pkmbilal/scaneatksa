"use client";
// Shared change-password page reached from any role's dashboard dropdown.
// Role-agnostic: doesn't need to know which dashboard the user came from,
// since "Back to Dashboard" routes through /dashboard, which redirects to
// the correct role dashboard. Follows the same
// supabase.auth.updateUser({ password }) pattern as the email-reset-link
// flow in app/auth/reset-password/page.js (new password + confirm only, no
// current-password check).

import { supabaseBrowser } from "@/lib/supabase/client";
const supabase = supabaseBrowser();

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

export default function ChangePasswordPage() {
  const t = useTranslations("dashboard.common.changePassword");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError(t("tooShort"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("mismatch"));
      return;
    }

    setSaving(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSuccess(true);
    setSaving(false);

    setTimeout(() => {
      router.push("/dashboard");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-2xl px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
            {t("backToDashboard")}
          </Link>

          <div className="mt-4 flex items-start gap-3">
            <div className="mt-1 rounded-lg border bg-muted/40 p-2">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("subtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {success && (
          <Alert className="mb-6 border-emerald-200 bg-emerald-50 text-emerald-950">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>{t("updatedTitle")}</AlertTitle>
            <AlertDescription>{t("updatedDescription")}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t("failedTitle")}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{t("formTitle")}</CardTitle>
            <CardDescription>{t("formSubtitle")}</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* New Password */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  {t("newPasswordLabel")}
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("newPasswordPlaceholder")}
                    disabled={success}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  {t("confirmPasswordLabel")}
                </Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("confirmPasswordPlaceholder")}
                    disabled={success}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Separator />

              <Button type="submit" disabled={saving || success} className="w-full h-12 text-base font-semibold">
                {saving ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    {t("updating")}
                  </>
                ) : success ? (
                  <>
                    <CheckCircle2 className="me-2 h-4 w-4" />
                    {t("updated")}
                  </>
                ) : (
                  t("updatePassword")
                )}
              </Button>

              <Button asChild variant="secondary" className="w-full h-12 text-base font-semibold">
                <Link href="/dashboard">{t("cancel")}</Link>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
