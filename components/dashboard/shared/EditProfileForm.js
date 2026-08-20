"use client";
// Shared edit-profile form used by all role dashboards (customer/owner/admin
// edit-profile pages). Extracted from the original customer-only
// app/dashboard/customer/edit-profile/page.js so the logic isn't duplicated
// per role. `backHref` points back at the caller's own dashboard route (used
// for the "Back to Dashboard" link, the cancel button, and the post-save
// redirect).

import { supabaseBrowser } from "@/lib/supabase/client";
const supabase = supabaseBrowser();

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { getCurrentUser, getUserProfile } from "@/lib/auth/client";

// shadcn/ui
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// lucide
import {
  ArrowLeft,
  Mail,
  User as UserIcon,
  Phone,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Calendar,
  Activity,
} from "lucide-react";

export default function EditProfileForm({ backHref = "/dashboard/customer" }) {
  const t = useTranslations("dashboard.common.editProfile");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const router = useRouter();

  useEffect(() => {
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function loadUserData() {
    const { user: currentUser, error: userError } = await getCurrentUser();

    if (userError || !currentUser) {
      router.push("/auth/login");
      return;
    }

    setUser(currentUser);

    const { data: userProfile } = await getUserProfile(currentUser.id);

    if (userProfile) {
      setProfile(userProfile);
      setFormData({
        full_name: userProfile.full_name || "",
        phone: userProfile.phone || "",
      });
    }

    setLoading(false);
  }

  const roleBadge = (role) => {
    if (role === "admin") return <Badge className="bg-violet-600 hover:bg-violet-600">{t("roleLabels.admin")}</Badge>;
    if (role === "owner") return <Badge className="bg-blue-600 hover:bg-blue-600">{t("roleLabels.owner")}</Badge>;
    return <Badge variant="secondary">{t("roleLabels.customer")}</Badge>;
  };

  const roleHint = (role) => {
    if (role === "admin") return t("roleHints.admin");
    if (role === "owner") return t("roleHints.owner");
    return t("roleHints.customer");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);

    try {
      const { data, error: updateError } = await supabase
        .from("user_profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single();

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }

      setSuccess(true);
      setProfile(data);

      setTimeout(() => {
        router.push(backHref);
      }, 2000);
    } catch (err) {
      setError(t("genericError", { message: err.message }));
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <Card className="border-muted/60">
            <CardContent className="py-14">
              <div className="flex flex-col items-center gap-3 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{t("loading")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const role = profile?.role || "customer";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
            {t("backToDashboard")}
          </Link>

          <div className="mt-4 flex items-start gap-3">
            <div className="mt-1 rounded-lg border bg-muted/40 p-2">
              <UserIcon className="h-5 w-5" />
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

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl">{t("detailsTitle")}</CardTitle>
              <CardDescription>{t("detailsDescription")}</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email (read-only) */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {t("emailLabel")}
                  </Label>
                  <Input value={user?.email || ""} disabled />
                  <p className="text-xs text-muted-foreground">{t("emailHint")}</p>
                </div>

                {/* Full name */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    {t("fullNameLabel")}
                  </Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder={t("fullNamePlaceholder")}
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {t("phoneLabel")}
                  </Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder={t("phonePlaceholder")}
                    inputMode="numeric"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("phoneHint")}
                  </p>
                </div>

                <Separator />

                {/* BIG full-width button */}
                <Button
                  type="submit"
                  disabled={saving || success}
                  className="w-full h-12 text-base font-semibold"
                >
                  {saving ? (
                    <>
                      <Loader2 className="me-2 h-4 w-4 animate-spin" />
                      {t("saving")}
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle2 className="me-2 h-4 w-4" />
                      {t("saved")}
                    </>
                  ) : (
                    t("saveChanges")
                  )}
                </Button>

                <Button asChild variant="secondary" className="w-full h-12 text-base font-semibold">
                  <Link href={backHref}>{t("cancel")}</Link>
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Role card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  {t("accountType")}
                </CardTitle>
                <CardDescription>{t("accountTypeSubtitle")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("role")}</span>
                  {roleBadge(role)}
                </div>
                <p className="text-sm">{roleHint(role)}</p>
              </CardContent>
            </Card>

            {/* Account info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("accountInfo")}</CardTitle>
                <CardDescription>{t("accountInfoSubtitle")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{t("created")}</span>
                  </div>
                  <span>
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{t("updated")}</span>
                  </div>
                  <span>
                    {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : "—"}
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Activity className="h-4 w-4" />
                    <span>{t("status")}</span>
                  </div>

                  {profile?.is_active ? (
                    <Badge className="bg-emerald-600 hover:bg-emerald-600">{t("active")}</Badge>
                  ) : (
                    <Badge variant="destructive">{t("inactive")}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
