"use client";
import { supabaseBrowser } from "@/lib/supabase/client";
const supabase = supabaseBrowser();

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

// Kitchen's queue is orders in `new` status only -- their single action
// (Start Preparing) moves an order to `preparing` and then it's the
// waiter's queue's concern. See lib/orderStatus.js for the transition rules.
export default function KitchenDashboardPage() {
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

  async function loadOrders(restaurantId) {
    setOrdersLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("id, created_at, channel, status, total, customer_name, customer_phone, notes")
      .eq("restaurant_id", restaurantId)
      .eq("status", "new")
      .order("created_at", { ascending: true });

    if (!error) setOrders(data || []);
    setOrdersLoading(false);
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

    if (res.ok && profile?.restaurant_id) await loadOrders(profile.restaurant_id);
  }

  if (loading) {
    return <LoadingScreen message="Loading your kitchen queue..." />;
  }

  if (!profile?.restaurant_id) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-gray-500 dark:text-gray-400">
        Your account isn&apos;t assigned to a restaurant yet. Ask your restaurant owner to check your staff account.
      </div>
    );
  }

  const navItems = [{ key: "queue", label: "Kitchen Queue", icon: ChefHat, count: orders.length }];

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
              homeHref="/dashboard/kitchen"
              homeLabel="Kitchen"
              editProfileHref="/dashboard/kitchen"
            />
          }
        >
          <TabSectionHeader
            title="Kitchen Queue"
            description={`New orders${restaurant?.name ? ` for ${restaurant.name}` : ""} waiting to be started.`}
          />

          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="p-6">
              <OrderQueue
                role="kitchen"
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
