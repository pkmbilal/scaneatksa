"use client";
import { supabaseBrowser } from "@/lib/supabase/client";
const supabase = supabaseBrowser();

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChefHat } from "lucide-react";

import { getCurrentUser, getUserProfile } from "@/lib/auth/client";
import LoadingScreen from "@/components/common/LoadingScreen";

import { DashboardSidebarProvider } from "@/context/DashboardSidebarContext";
import DashboardSidebar from "@/components/dashboard/shared/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/shared/DashboardHeader";
import DashboardBackdrop from "@/components/dashboard/shared/DashboardBackdrop";
import DashboardMain from "@/components/dashboard/shared/DashboardMain";
import TabSectionHeader from "@/components/dashboard/shared/TabSectionHeader";
import OrderQueue from "@/components/dashboard/staff/OrderQueue";
import SoundToggle from "@/components/dashboard/shared/SoundToggle";
import { useRestaurantOrdersRealtime } from "@/components/dashboard/shared/hooks/useRestaurantOrdersRealtime";
import { useOrderAlerts } from "@/components/dashboard/shared/hooks/useOrderAlerts";
import { classifyOrderEvent } from "@/lib/orderNotifications";

// Kitchen's queue is orders in `new` or `preparing` status -- kitchen starts
// an order (`new` -> `preparing`) and then marks it ready (`preparing` ->
// `ready`), at which point it's the waiter's queue's concern. See
// lib/orderStatus.js for the transition rules.
export default function KitchenDashboardPage() {
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

  const alerts = useOrderAlerts();

  // Live queue updates -- a new order landing in `new`, or one leaving it --
  // so kitchen never has to refresh. The same subscription feeds the toast +
  // chime notification layer.
  useRestaurantOrdersRealtime(
    restaurant?.id,
    () => loadOrders(restaurant.id, { silent: true }),
    (payload) =>
      alerts.push(
        classifyOrderEvent({
          role: "kitchen",
          eventType: payload.eventType,
          next: payload.new,
          prev: payload.old,
        })
      )
  );

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

    if (userProfile && userProfile.role !== "kitchen") {
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
      .select("id, created_at, channel, status, total, customer_name, customer_phone, notes")
      .eq("restaurant_id", restaurantId)
      .in("status", ["new", "preparing"])
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
    return <LoadingScreen message={t("kitchen.loadingMessage")} />;
  }

  if (!profile?.restaurant_id) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-gray-500 dark:text-gray-400">
        {t("queue.noRestaurantAssigned")}
      </div>
    );
  }

  const navItems = [
    { key: "queue", label: t("kitchen.title"), icon: ChefHat, count: orders.length, alert: orders.length > 0 },
  ];

  return (
    <DashboardSidebarProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 lg:flex">
        <DashboardSidebar
          navItems={navItems}
          activeTab="queue"
          onSelectTab={() => {}}
          user={user}
          profile={profile}
          homeLabel={t("kitchen.homeLabel")}
          editProfileHref="/dashboard/kitchen"
        />
        <DashboardBackdrop />

        <DashboardMain
          header={
            <DashboardHeader
              user={user}
              profile={profile}
              homeHref="/dashboard/kitchen"
              homeLabel={t("kitchen.homeLabel")}
              editProfileHref="/dashboard/kitchen"
              notifications={{
                items: alerts.items,
                unreadCount: alerts.unreadCount,
                onViewAll: alerts.markAllRead,
              }}
              extraActions={
                <SoundToggle enabled={alerts.soundEnabled} onToggle={alerts.toggleSound} />
              }
            />
          }
        >
          <TabSectionHeader
            title={t("kitchen.title")}
            description={
              restaurant?.name
                ? t("kitchen.descriptionWithRestaurant", { restaurantName: restaurant.name })
                : t("kitchen.descriptionGeneric")
            }
          />

          <OrderQueue
            role="kitchen"
            restaurantName={restaurant?.name}
            orders={orders}
            loading={ordersLoading}
            onAction={handleAction}
          />
        </DashboardMain>
      </div>
    </DashboardSidebarProvider>
  );
}
