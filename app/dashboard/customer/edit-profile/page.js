"use client";
import { supabaseBrowser } from "@/lib/supabase/client";
const supabase = supabaseBrowser();

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function EditProfilePage() {
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
    if (role === "admin") return <Badge className="bg-violet-600 hover:bg-violet-600">admin</Badge>;
    if (role === "owner") return <Badge className="bg-blue-600 hover:bg-blue-600">owner</Badge>;
    return <Badge variant="secondary">customer</Badge>;
  };

  const roleHint = (role) => {
    if (role === "admin") return "Full system access";
    if (role === "owner") return "You can manage restaurants";
    return "Want to manage a restaurant? Request owner access!";
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
        router.push("/dashboard/customer");
      }, 2000);
    } catch (err) {
      setError("Something went wrong: " + err.message);
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
                <p className="text-sm text-muted-foreground">Loading your profile…</p>
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
            href="/dashboard/customer"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="mt-4 flex items-start gap-3">
            <div className="mt-1 rounded-lg border bg-muted/40 p-2">
              <UserIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Edit Profile</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Update your personal information and keep your account details current.
              </p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {success && (
          <Alert className="mb-6 border-emerald-200 bg-emerald-50 text-emerald-950">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Profile updated</AlertTitle>
            <AlertDescription>Changes saved successfully. Redirecting…</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Update failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl">Profile Details</CardTitle>
              <CardDescription>These details help restaurants contact you if needed.</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email (read-only) */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Email Address
                  </Label>
                  <Input value={user?.email || ""} disabled />
                  <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                </div>

                {/* Full name */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    Full Name
                  </Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    Phone Number
                  </Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g., 966501234567"
                    inputMode="numeric"
                  />
                  <p className="text-xs text-muted-foreground">
                    Include country code (e.g., 966 for Saudi Arabia).
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
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Saved!
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>

                <Button asChild variant="secondary" className="w-full h-12 text-base font-semibold">
                  <Link href="/dashboard/customer">Cancel</Link>
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
                  Account Type
                </CardTitle>
                <CardDescription>Your permission level</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Role</span>
                  {roleBadge(role)}
                </div>
                <p className="text-sm">{roleHint(role)}</p>
              </CardContent>
            </Card>

            {/* Account info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Account Information</CardTitle>
                <CardDescription>Basic account metadata</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Created</span>
                  </div>
                  <span>
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Updated</span>
                  </div>
                  <span>
                    {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : "—"}
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Activity className="h-4 w-4" />
                    <span>Status</span>
                  </div>

                  {profile?.is_active ? (
                    <Badge className="bg-emerald-600 hover:bg-emerald-600">Active</Badge>
                  ) : (
                    <Badge variant="destructive">Inactive</Badge>
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
