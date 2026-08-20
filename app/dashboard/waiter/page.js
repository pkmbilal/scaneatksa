"use client";
import { supabaseBrowser } from "@/lib/supabase/client";
const supabase = supabaseBrowser();

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";

import { getCurrentUser, getUserProfile } from "@/lib/auth/client";
import LoadingScreen from "@/components/common/LoadingScreen";

import { DashboardSidebarProvider } from "@/context/DashboardSidebarContext";
import DashboardSidebar from "@/components/dashboard/shared/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/shared/DashboardHeader";
import DashboardBackdrop from "@/components/dashboard/shared/DashboardBackdrop";
import DashboardMain from "@/components/dashboard/shared/DashboardMain";
import TabSectionHeader from "@/components/dashboard/shared/TabSectionHeader";
import OrderQueue from "@/components/dashboard/staff/OrderQueue";
import { useRestaurantOrdersRealtime } from "@/components/dashboard/shared/hooks/useRestaurantOrdersRealtime";

// Waiter's queue is orders in `preparing` or `ready`. Waiter owns both
// transitions from here: marking food ready (preparing -> ready) and
// handing it over (ready -> delivered). See lib/orderStatus.js.
export default function WaiterDashboardPage() {
  const t = useTranslations("dashboard.staff");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live queue updates -- an order entering/leaving preparing/ready -- so
  // waiter never has to refresh.
  useRestaurantOrdersRealtime(restaurant?.id, () => loadOrders(restaurant.id, { silent: true }));

  async function loadData() {
    setLoading(true);

    const { user: currentUser, error: userError } = await getCurrentUser();
    if (userError || !currentUser) {
      router.push("/auth/login");
      return;
    }
    setUser(currentUser);

    const { data: userProfile } = await getUserProfile(currentUser.id);
    setProfile(userProfile);

    if (userProfile && userProfile.role !== "waiter") {
      router.push("/dashboard");
      return;
    }

    if (userProfile?.restaurant_id) {
      const { data: r } = await supabase
        .from("restaurants")
        .select("id, name")
        .eq("id", userProfile.restaurant_id)
        .maybeSingle();
      setRestaurant(r || null);

      await loadOrders(userProfile.restaurant_id);
    }

    setLoading(false);
  }

  async function loadOrders(restaurantId, { silent = false } = {}) {
    if (!silent) setOrdersLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, created_at, channel, status, total, customer_name, customer_phone, delivery_address, notes, restaurant_tables ( table_number )"
      )
      .eq("restaurant_id", restaurantId)
      .in("status", ["preparing", "ready"])
      .order("created_at", { ascending: true });

    if (!error) setOrders(data || []);
    if (!silent) setOrdersLoading(false);
  }

  async function handleAction(orderId, nextStatus) {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess?.session?.access_token;

    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ status: nextStatus }),
    });

    const data = await res.json();
    if (res.ok && profile?.restaurant_id) await loadOrders(profile.restaurant_id);
    return res.ok ? data.order : null;
  }

  if (loading) {
    return <LoadingScreen message={t("waiter.loadingMessage")} />;
  }

  if (!profile?.restaurant_id) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-gray-500 dark:text-gray-400">
        {t("queue.noRestaurantAssigned")}
      </div>
    );
  }

  const navItems = [
    { key: "queue", label: t("waiter.title"), icon: Bell, count: orders.length, alert: orders.length > 0 },
  ];

  return (
    <DashboardSidebarProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 lg:flex">
        <DashboardSidebar navItems={navItems} activeTab="queue" onSelectTab={() => {}} />
        <DashboardBackdrop />

        <DashboardMain
          header={
            <DashboardHeader
              user={user}
              profile={profile}
              homeHref="/dashboard/waiter"
              homeLabel={t("waiter.homeLabel")}
              editProfileHref="/dashboard/waiter"
            />
          }
        >
          <TabSectionHeader
            title={t("waiter.title")}
            description={
              restaurant?.name
                ? t("waiter.descriptionWithRestaurant", { restaurantName: restaurant.name })
                : t("waiter.descriptionGeneric")
            }
          />

          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="p-6">
              <OrderQueue
                role="waiter"
                restaurantName={restaurant?.name}
                orders={orders}
                loading={ordersLoading}
                onAction={handleAction}
              />
            </div>
          </div>
        </DashboardMain>
      </div>
    </DashboardSidebarProvider>
  );
}
