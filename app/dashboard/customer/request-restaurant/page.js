"use client";
import { supabaseBrowser } from "@/lib/supabase/client";
const supabase = supabaseBrowser();

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
} from "lucide-react";

export default function RequestRestaurantPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [existingRequests, setExistingRequests] = useState([]);
  const [formData, setFormData] = useState({
    restaurantName: "",
    city_id: "",
    phone: "",
    address: "",
    description: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cities, setCities] = useState([]);

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

      const { data: citiesData, error: citiesError } = await supabase
        .from("cities")
        .select("id, name")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (!citiesError) setCities(citiesData || []);

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

  const statusBadge = (status) => {
    if (status === "pending") return <Badge variant="secondary">pending</Badge>;
    if (status === "approved") return <Badge className="bg-emerald-600 hover:bg-emerald-600">approved</Badge>;
    return <Badge variant="destructive">rejected</Badge>;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (formData.phone.trim().length < 10) {
      setError("Please enter a valid phone number (include country code, no spaces).");
      setSubmitting(false);
      return;
    }

    try {
      const { error: submitError } = await submitRestaurantRequest(user.id, {
        name: formData.restaurantName,
        city_id: formData.city_id,
        phone: formData.phone,
        address: formData.address,
        description: formData.description,
      });

      if (submitError) {
        setError(submitError.message);
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setFormData({
        restaurantName: "",
        city_id: "",
        phone: "",
        address: "",
        description: "",
      });

      const { data: requests } = await getUserRequests(user.id);
      setExistingRequests(requests || []);

      setSubmitting(false);

      setTimeout(() => {
        router.push("/dashboard/customer");
      }, 3000);
    } catch (err) {
      setError("Something went wrong: " + err.message);
      setSubmitting(false);
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
                <p className="text-sm text-muted-foreground">Loading your data…</p>
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
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="mt-4 flex items-start gap-3">
            <div className="hidden md:block mt-1 rounded-lg border bg-muted/40 p-2">
              <Store className="h-5 w-5 " />
            </div>
            <div className="text-left">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Request to Become Owner
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Submit your restaurant details for admin review. Once approved, you’ll be able to manage your menu and orders.
              </p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {success && (
          <Alert className="mb-6 border-emerald-200 bg-emerald-50 text-emerald-950">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Request submitted successfully</AlertTitle>
            <AlertDescription>
              Your request is pending admin approval. Redirecting to your dashboard…
            </AlertDescription>
          </Alert>
        )}

        {hasPendingRequest && !success && (
          <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-950">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Pending request</AlertTitle>
            <AlertDescription>
              You already have a pending request. Please wait for admin review before submitting another one.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl">Restaurant Information</CardTitle>
              <CardDescription>
                Provide accurate details so the admin team can verify your business quickly.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    Restaurant Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={formData.restaurantName}
                    onChange={(e) =>
                      setFormData({ ...formData, restaurantName: e.target.value })
                    }
                    placeholder="e.g., Pizza Palace"
                    required
                    disabled={hasPendingRequest}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use the official business name.
                  </p>
                </div>

                {/* City */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    City <span className="text-destructive">*</span>
                  </Label>

                  <Select
                    value={formData.city_id}
                    onValueChange={(v) => setFormData({ ...formData, city_id: v })}
                    disabled={hasPendingRequest}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a city" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <p className="text-xs text-muted-foreground">
                    Choose the city where your restaurant is located.
                  </p>
                </div>

                {/* WhatsApp */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    WhatsApp Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="966501234567"
                    required
                    disabled={hasPendingRequest}
                    inputMode="numeric"
                  />
                  <p className="text-xs text-muted-foreground">
                    Include country code (e.g., 966 for Saudi Arabia). No “+” or spaces.
                  </p>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPinned className="h-4 w-4 text-muted-foreground" />
                    Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street, District, City"
                    required
                    disabled={hasPendingRequest}
                  />
                  <p className="text-xs text-muted-foreground">
                    Full physical location of your restaurant.
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Description
                  </Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Cuisine type, branches, why you want to join…"
                    rows={4}
                    disabled={hasPendingRequest}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional — helps us understand your business better.
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Something went wrong</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Separator />

                {/* BIG FULL-WIDTH BUTTON */}
                <Button
                  type="submit"
                  disabled={submitting || hasPendingRequest}
                  className="w-full h-12 text-base font-semibold"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting…
                    </>
                  ) : hasPendingRequest ? (
                    <>
                      <Clock className="mr-2 h-4 w-4" />
                      Request Already Pending
                    </>
                  ) : (
                    <>
                      <ClipboardList className="mr-2 h-4 w-4" />
                      Submit Request
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
                  What happens next
                </CardTitle>
                <CardDescription>Typical review flow</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex gap-2">
                  <span className="text-muted-foreground">1.</span>
                  <span>Your request is sent to the admin team</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground">2.</span>
                  <span>Admin reviews restaurant details</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground">3.</span>
                  <span>You’ll be notified of approval/rejection</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground">4.</span>
                  <span>Once approved, you can manage your menu</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Requirements</CardTitle>
                <CardDescription>Minimum needed to approve</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Valid restaurant name
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Active WhatsApp number
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Physical restaurant location
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Keep menu updated
                </div>
              </CardContent>
            </Card>

            {existingRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Your previous requests</CardTitle>
                  <CardDescription>History & status</CardDescription>
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
