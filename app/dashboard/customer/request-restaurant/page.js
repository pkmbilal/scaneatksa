"use client";
import { supabaseBrowser } from "@/lib/supabase/client";
const supabase = supabaseBrowser();

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { citiesForLocale, cityLabel } from "@/lib/saudiCities";
import { uploadDocumentToR2, UploadValidationError } from "@/lib/r2/upload";
import {
  CR_RE,
  VAT_RE,
  MAPS_RE,
  DOC_TYPES,
  MAX_DOC_BYTES,
  normalizeDigits,
} from "@/lib/restaurantVerification";

import {
  getCurrentUser,
  getUserProfile,
  submitRestaurantRequest,
  getUserRequests,
} from "@/lib/auth/client";

// shadcn/ui
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// lucide
import {
  ArrowLeft,
  Store,
  MapPin,
  Phone,
  MapPinned,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ClipboardList,
  ShieldCheck,
  Loader2,
  BadgeCheck,
  Receipt,
  Map as MapIcon,
  FileUp,
  MailWarning,
} from "lucide-react";

const EMPTY_FORM = {
  restaurantName: "",
  city: "",
  phone: "",
  address: "",
  description: "",
  crNumber: "",
  vatNumber: "",
  mapsUrl: "",
};

// Maps DB/guard-trigger errors from submitRestaurantRequest to message keys.
function submitErrorKey(error) {
  const text = `${error?.message || ""} ${error?.details || ""}`;
  if (text.includes("email_not_verified")) return "emailNotVerified";
  if (text.includes("restaurant_requests_one_pending_per_user")) return "alreadyPending";
  if (text.includes("restaurant_requests_cr_number_active")) return "crAlreadyUsed";
  if (text.includes("cr_number_format")) return "invalidCr";
  if (text.includes("vat_number_format")) return "invalidVat";
  if (text.includes("maps_url_format")) return "invalidMaps";
  return null;
}

export default function RequestRestaurantPage() {
  const t = useTranslations("dashboard.customer");
  const locale = useLocale();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [existingRequests, setExistingRequests] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [crFile, setCrFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const cities = citiesForLocale(locale);

  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      const { user: currentUser, error: userError } = await getCurrentUser();
      if (userError || !currentUser) {
        router.push("/auth/login");
        return;
      }
      setUser(currentUser);

      const { data: userProfile } = await getUserProfile(currentUser.id);
      setProfile(userProfile);

      if (userProfile && userProfile.role !== "customer") {
        router.push("/dashboard");
        return;
      }

      const { data: requests } = await getUserRequests(currentUser.id);
      setExistingRequests(requests || []);

      setLoading(false);
    }

    loadData();
  }, [router]);

  const hasPendingRequest = useMemo(
    () => existingRequests.some((req) => req.status === "pending"),
    [existingRequests],
  );

  const emailUnverified = !!user && !user.email_confirmed_at;
  const formLocked = hasPendingRequest || emailUnverified;

  const statusBadge = (status) => {
    if (status === "pending") return <Badge variant="secondary">{t("requestStatus.pending")}</Badge>;
    if (status === "approved") return <Badge className="bg-emerald-600 hover:bg-emerald-600">{t("requestStatus.approved")}</Badge>;
    return <Badge variant="destructive">{t("requestStatus.rejected")}</Badge>;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const fail = (key) => {
      setError(t(`requestRestaurantPage.errors.${key}`));
      setSubmitting(false);
      setUploadProgress(null);
    };

    const crNumber = normalizeDigits(formData.crNumber);
    const vatNumber = normalizeDigits(formData.vatNumber);
    const mapsUrl = formData.mapsUrl.trim();

    if (formData.phone.trim().length < 10) return fail("invalidPhone");
    if (!CR_RE.test(crNumber)) return fail("invalidCr");
    if (vatNumber && !VAT_RE.test(vatNumber)) return fail("invalidVat");
    if (!MAPS_RE.test(mapsUrl)) return fail("invalidMaps");
    if (!crFile) return fail("missingDocument");
    if (!DOC_TYPES.includes(crFile.type)) return fail("docInvalidType");
    if (crFile.size > MAX_DOC_BYTES) return fail("docTooLarge");

    setSubmitting(true);

    try {
      let crDocumentPath;
      try {
        setUploadProgress(0);
        crDocumentPath = await uploadDocumentToR2(crFile, { onProgress: setUploadProgress });
      } catch (uploadErr) {
        if (uploadErr instanceof UploadValidationError) {
          return fail(uploadErr.message === "tooLarge" ? "docTooLarge" : "docInvalidType");
        }
        console.error("CR upload failed:", uploadErr);
        // Append the underlying reason (HTTP status, server message) unless
        // it's just a bare internal code.
        const detail = uploadErr?.message;
        fail("uploadFailed");
        if (detail && detail !== "uploadFailed" && detail !== "presignFailed") {
          setError(`${t("requestRestaurantPage.errors.uploadFailed")} (${detail})`);
        }
        return;
      }
      setUploadProgress(null);

      const { error: submitError } = await submitRestaurantRequest(user.id, {
        name: formData.restaurantName,
        city: formData.city,
        phone: formData.phone,
        address: formData.address,
        description: formData.description,
        crNumber,
        vatNumber: vatNumber || null,
        mapsUrl,
        crDocumentPath,
      });

      if (submitError) {
        const key = submitErrorKey(submitError);
        if (key) return fail(key);
        setError(submitError.message);
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setFormData(EMPTY_FORM);
      setCrFile(null);
      setFileInputKey((k) => k + 1);

      const { data: requests } = await getUserRequests(user.id);
      setExistingRequests(requests || []);

      setSubmitting(false);

      setTimeout(() => {
        router.push("/dashboard/customer");
      }, 3000);
    } catch (err) {
      setError(t("requestRestaurantPage.errors.unexpected", { message: err.message }));
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <Card className="border-muted/60">
            <CardContent className="py-14">
              <div className="flex flex-col items-center gap-3 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{t("requestRestaurantPage.loadingData")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-5xl px-4 py-8 md:py-10">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/customer"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
            {t("requestRestaurantPage.backToDashboard")}
          </Link>

          <div className="mt-4 flex items-start gap-3">
            <div className="hidden md:block mt-1 rounded-lg border bg-muted/40 p-2">
              <Store className="h-5 w-5 " />
            </div>
            <div className="text-start">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                {t("requestRestaurantPage.heading")}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("requestRestaurantPage.subheading")}
              </p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {success && (
          <Alert className="mb-6 border-emerald-200 bg-emerald-50 text-emerald-950">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>{t("requestRestaurantPage.successTitle")}</AlertTitle>
            <AlertDescription>
              {t("requestRestaurantPage.successDescription")}
            </AlertDescription>
          </Alert>
        )}

        {emailUnverified && !success && (
          <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-950">
            <MailWarning className="h-4 w-4" />
            <AlertTitle>{t("requestRestaurantPage.emailNotVerifiedTitle")}</AlertTitle>
            <AlertDescription>
              {t("requestRestaurantPage.emailNotVerifiedDescription")}
            </AlertDescription>
          </Alert>
        )}

        {hasPendingRequest && !success && (
          <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-950">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t("requestRestaurantPage.pendingTitle")}</AlertTitle>
            <AlertDescription>
              {t("requestRestaurantPage.pendingDescription")}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl">{t("requestRestaurantPage.formTitle")}</CardTitle>
              <CardDescription>
                {t("requestRestaurantPage.formDescription")}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    {t("requestRestaurantPage.fields.restaurantName")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={formData.restaurantName}
                    onChange={(e) =>
                      setFormData({ ...formData, restaurantName: e.target.value })
                    }
                    placeholder={t("requestRestaurantPage.fields.restaurantNamePlaceholder")}
                    required
                    disabled={formLocked}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("requestRestaurantPage.fields.restaurantNameHelp")}
                  </p>
                </div>

                {/* City */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {t("requestRestaurantPage.fields.city")} <span className="text-destructive">*</span>
                  </Label>

                  <Select
                    value={formData.city}
                    onValueChange={(v) => setFormData({ ...formData, city: v })}
                    disabled={formLocked}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("requestRestaurantPage.fields.cityPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((c) => (
                        <SelectItem key={c.slug} value={c.slug}>
                          {cityLabel(c.slug, locale)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <p className="text-xs text-muted-foreground">
                    {t("requestRestaurantPage.fields.cityHelp")}
                  </p>
                </div>

                {/* WhatsApp */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {t("requestRestaurantPage.fields.whatsapp")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder={t("requestRestaurantPage.fields.whatsappPlaceholder")}
                    required
                    disabled={formLocked}
                    inputMode="numeric"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("requestRestaurantPage.fields.whatsappHelp")}
                  </p>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPinned className="h-4 w-4 text-muted-foreground" />
                    {t("requestRestaurantPage.fields.address")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder={t("requestRestaurantPage.fields.addressPlaceholder")}
                    required
                    disabled={formLocked}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("requestRestaurantPage.fields.addressHelp")}
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {t("requestRestaurantPage.fields.description")}
                  </Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder={t("requestRestaurantPage.fields.descriptionPlaceholder")}
                    rows={4}
                    disabled={formLocked}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("requestRestaurantPage.fields.descriptionHelp")}
                  </p>
                </div>

                {/* Business verification */}
                <Separator />
                <div className="space-y-1">
                  <h3 className="flex items-center gap-2 text-base font-semibold">
                    <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                    {t("requestRestaurantPage.verificationSection")}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t("requestRestaurantPage.verificationSectionHelp")}
                  </p>
                </div>

                {/* CR number */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                    {t("requestRestaurantPage.fields.crNumber")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={formData.crNumber}
                    onChange={(e) => setFormData({ ...formData, crNumber: e.target.value })}
                    placeholder={t("requestRestaurantPage.fields.crNumberPlaceholder")}
                    required
                    disabled={formLocked}
                    inputMode="numeric"
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("requestRestaurantPage.fields.crNumberHelp")}
                  </p>
                </div>

                {/* VAT number */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    {t("requestRestaurantPage.fields.vatNumber")}
                  </Label>
                  <Input
                    value={formData.vatNumber}
                    onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                    placeholder={t("requestRestaurantPage.fields.vatNumberPlaceholder")}
                    disabled={formLocked}
                    inputMode="numeric"
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("requestRestaurantPage.fields.vatNumberHelp")}
                  </p>
                </div>

                {/* Google Maps link */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapIcon className="h-4 w-4 text-muted-foreground" />
                    {t("requestRestaurantPage.fields.mapsUrl")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="url"
                    value={formData.mapsUrl}
                    onChange={(e) => setFormData({ ...formData, mapsUrl: e.target.value })}
                    placeholder={t("requestRestaurantPage.fields.mapsUrlPlaceholder")}
                    required
                    disabled={formLocked}
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("requestRestaurantPage.fields.mapsUrlHelp")}
                  </p>
                </div>

                {/* CR certificate */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileUp className="h-4 w-4 text-muted-foreground" />
                    {t("requestRestaurantPage.fields.crDocument")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    key={fileInputKey}
                    type="file"
                    accept={DOC_TYPES.join(",")}
                    onChange={(e) => setCrFile(e.target.files?.[0] || null)}
                    required
                    disabled={formLocked}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("requestRestaurantPage.fields.crDocumentHelp")}
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{t("requestRestaurantPage.errors.genericTitle")}</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Separator />

                {/* BIG FULL-WIDTH BUTTON */}
                <Button
                  type="submit"
                  disabled={submitting || formLocked}
                  className="w-full h-12 text-base font-semibold"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="me-2 h-4 w-4 animate-spin" />
                      {uploadProgress !== null
                        ? t("requestRestaurantPage.submit.uploading", { percent: uploadProgress })
                        : t("requestRestaurantPage.submit.submitting")}
                    </>
                  ) : hasPendingRequest ? (
                    <>
                      <Clock className="me-2 h-4 w-4" />
                      {t("requestRestaurantPage.submit.alreadyPending")}
                    </>
                  ) : (
                    <>
                      <ClipboardList className="me-2 h-4 w-4" />
                      {t("requestRestaurantPage.submit.submit")}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  {t("requestRestaurantPage.sidebar.nextSteps.title")}
                </CardTitle>
                <CardDescription>{t("requestRestaurantPage.sidebar.nextSteps.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex gap-2">
                  <span className="text-muted-foreground">1.</span>
                  <span>{t("requestRestaurantPage.sidebar.nextSteps.step1")}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground">2.</span>
                  <span>{t("requestRestaurantPage.sidebar.nextSteps.step2")}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground">3.</span>
                  <span>{t("requestRestaurantPage.sidebar.nextSteps.step3")}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground">4.</span>
                  <span>{t("requestRestaurantPage.sidebar.nextSteps.step4")}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("requestRestaurantPage.sidebar.requirements.title")}</CardTitle>
                <CardDescription>{t("requestRestaurantPage.sidebar.requirements.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {t("requestRestaurantPage.sidebar.requirements.item1")}
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {t("requestRestaurantPage.sidebar.requirements.item2")}
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {t("requestRestaurantPage.sidebar.requirements.item3")}
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {t("requestRestaurantPage.sidebar.requirements.item4")}
                </div>
              </CardContent>
            </Card>

            {existingRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("requestRestaurantPage.sidebar.previousRequests.title")}</CardTitle>
                  <CardDescription>{t("requestRestaurantPage.sidebar.previousRequests.subtitle")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {existingRequests.map((req) => (
                    <div key={req.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{req.restaurant_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(req.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {statusBadge(req.status)}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
