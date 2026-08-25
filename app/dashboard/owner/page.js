"use client";
import { supabaseBrowser } from "@/lib/supabase/client";
const supabase = supabaseBrowser();

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";

import {
  getCurrentUser,
  getUserProfile,
  getUserRestaurant,
} from "@/lib/auth/client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import LoadingScreen from "@/components/common/LoadingScreen";

import {
  LayoutDashboard,
  UtensilsCrossed,
  Tags,
  QrCode,
  Receipt,
  Users,
  Store,
  TriangleAlert,
  CheckCircle,
  House,
  Pizza,
  Gauge,
  Headset,
  Pencil,
  RefreshCw,
  BarChart3,
  Star,
} from "lucide-react";

import { DashboardSidebarProvider } from "@/context/DashboardSidebarContext";
import DashboardSidebar from "@/components/dashboard/shared/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/shared/DashboardHeader";
import DashboardBackdrop from "@/components/dashboard/shared/DashboardBackdrop";
import DashboardMain from "@/components/dashboard/shared/DashboardMain";
import StatCard from "@/components/dashboard/shared/StatCard";
import TabSectionHeader from "@/components/dashboard/shared/TabSectionHeader";
import { useRestaurantOrdersRealtime } from "@/components/dashboard/shared/hooks/useRestaurantOrdersRealtime";

import OverviewTab from "@/components/dashboard/owner/tabs/OverviewTab";
import MenuItemsTab from "@/components/dashboard/owner/tabs/MenuItemsTab";
import CategoriesTab from "@/components/dashboard/owner/tabs/CategoriesTab";
import RestaurantTab from "@/components/dashboard/owner/tabs/RestaurantTab";
import OwnerTablesQrTab from "@/components/dashboard/owner/OwnerTablesQrTab";
import OwnerOrdersTab from "@/components/dashboard/owner/OwnerOrdersTab";
import StaffTab from "@/components/dashboard/owner/tabs/StaffTab";
import AnalyticsTab from "@/components/dashboard/owner/tabs/AnalyticsTab";
import AnalyticsDateRangeSelect from "@/components/dashboard/owner/AnalyticsDateRangeSelect";
import { useOwnerAnalytics } from "@/components/dashboard/owner/hooks/useOwnerAnalytics";
import ReviewsTab from "@/components/dashboard/owner/tabs/ReviewsTab";
import { useOwnerReviews } from "@/components/dashboard/owner/hooks/useOwnerReviews";
import AddItemDialog from "@/components/dashboard/owner/dialogs/AddItemDialog";
import AddCategoryDialog from "@/components/dashboard/owner/dialogs/AddCategoryDialog";
import AddTableDialog from "@/components/dashboard/owner/dialogs/AddTableDialog";
import AddStaffDialog from "@/components/dashboard/owner/dialogs/AddStaffDialog";

// ✅ Shadcn Dialogs
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function OwnerDashboardPage() {
  const t = useTranslations("dashboard.owner");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [restaurant, setRestaurant] = useState(null);

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);

  // ✅ tables + orders
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [staff, setStaff] = useState([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();

  // ✅ Dialog States
  const [deleteItemOpen, setDeleteItemOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [deleteCategoryOpen, setDeleteCategoryOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const [deleteTableOpen, setDeleteTableOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState(null);

  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [infoDialogConfig, setInfoDialogConfig] = useState({ title: "", description: "", isError: false });

  useEffect(() => {
    loadOwnerData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live order updates -- new orders placed, or status changes made by
  // kitchen/waiter -- so the owner never has to refresh to see them.
  useRestaurantOrdersRealtime(restaurant?.id, () => loadOrders(restaurant.id, { silent: true }));

  // Analytics data/aggregation -- fetched only while the Analytics tab is
  // active, and re-fetched when the selected date range changes.
  const analytics = useOwnerAnalytics(restaurant?.id, { enabled: activeTab === "analytics" });

  // Reviews data -- fetched only while the Reviews tab is active, same lazy
  // pattern as analytics.
  const reviews = useOwnerReviews(restaurant?.id, { enabled: activeTab === "reviews" });

  async function loadOwnerData() {
    setLoading(true);

    const { user: currentUser, error: userError } = await getCurrentUser();
    if (userError || !currentUser) {
      router.push("/auth/login");
      return;
    }
    setUser(currentUser);

    const { data: userProfile } = await getUserProfile(currentUser.id);
    setProfile(userProfile);

    if (userProfile && userProfile.role !== "owner") {
      router.push("/dashboard");
      return;
    }

    const { data: userRestaurant, error: restaurantError } =
      await getUserRestaurant(currentUser.id);

    if (restaurantError || !userRestaurant) {
      setLoading(false);
      return;
    }

    setRestaurant(userRestaurant);

    await Promise.all([
      loadCategories(userRestaurant.id),
      loadMenuItems(userRestaurant.id),
      loadTables(userRestaurant.id),
      loadOrders(userRestaurant.id),
      loadStaff(),
    ]);

    setLoading(false);
  }

  async function loadMenuItems(restaurantId) {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("category_id", { ascending: true });

    if (!error) setMenuItems(data || []);
  }

  async function loadCategories(restaurantId) {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("name", { ascending: true });

    if (!error) setCategories(data || []);
  }

  async function loadTables(restaurantId) {
    setTablesLoading(true);
    const { data, error } = await supabase
      .from("restaurant_tables")
      .select("id, table_number, code, is_active, created_at")
      .eq("restaurant_id", restaurantId)
      .order("table_number", { ascending: true });

    if (!error) setTables(data || []);
    setTablesLoading(false);
  }

  async function loadOrders(restaurantId, { silent = false } = {}) {
    if (!silent) setOrdersLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        created_at,
        channel,
        status,
        total,
        customer_name,
        customer_phone,
        delivery_address,
        notes,
        restaurant_tables ( table_number )
      `
      )
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error) setOrders(data || []);
    if (!silent) setOrdersLoading(false);
  }

  async function updateOrderStatus(orderId, nextStatus) {
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
    if (!res.ok) {
      setInfoDialogConfig({
        title: t("page.errors.updateOrderFailedTitle"),
        description: data?.error || t("page.errors.tryAgain"),
        isError: true,
      });
      setInfoDialogOpen(true);
      return null;
    }

    if (restaurant?.id) await loadOrders(restaurant.id);
    return data.order;
  }

  async function loadStaff() {
    setStaffLoading(true);
    const { data: sess } = await supabase.auth.getSession();
    const token = sess?.session?.access_token;

    const res = await fetch("/api/staff", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const data = await res.json();
    if (res.ok) setStaff(data.staff || []);
    setStaffLoading(false);
  }

  async function addStaffMember(payload) {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess?.session?.access_token;

    const res = await fetch("/api/staff", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) return { error: data?.error || "Could not create staff account." };

    await loadStaff();
    return { ok: true };
  }

  async function toggleStaffActive(staffId, currentActive) {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess?.session?.access_token;

    const res = await fetch(`/api/staff/${staffId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ is_active: !currentActive }),
    });

    if (res.ok) await loadStaff();
  }

  const categoryMap = useMemo(() => {
    return Object.fromEntries((categories || []).map((c) => [c.id, c.name]));
  }, [categories]);

  const toggleAvailability = async (itemId, currentStatus) => {
    const { error } = await supabase
      .from("menu_items")
      .update({ is_available: !currentStatus })
      .eq("id", itemId);

    if (!error && restaurant?.id) loadMenuItems(restaurant.id);
  };

  const toggleSoldOut = async (itemId, currentStatus) => {
    const { error } = await supabase
      .from("menu_items")
      .update({ is_sold_out: !currentStatus })
      .eq("id", itemId);

    if (!error && restaurant?.id) loadMenuItems(restaurant.id);
  };

  // ✅ Trigger Delete Item Dialog
  const deleteItem = (itemId) => {
    setItemToDelete(itemId);
    setDeleteItemOpen(true);
  };

  // ✅ Confirm Delete Item
  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", itemToDelete);
    if (!error && restaurant?.id) loadMenuItems(restaurant.id);
    setDeleteItemOpen(false);
    setItemToDelete(null);
  };

  const renameCategory = async (categoryId, newName) => {
    const clean = newName.trim();
    if (!clean) return { ok: false, message: t("page.errors.categoryNameEmpty") };

    const { error } = await supabase
      .from("categories")
      .update({ name: clean })
      .eq("id", categoryId);

    if (error) {
      const msg = error.message?.toLowerCase().includes("duplicate")
        ? t("page.errors.categoryDuplicate")
        : error.message;
      return { ok: false, message: msg };
    }

    await loadCategories(restaurant.id);
    return { ok: true };
  };

  // ✅ Trigger Delete Category Dialog
  const deleteCategory = (categoryId) => {
    setCategoryToDelete(categoryId);
    setDeleteCategoryOpen(true);
  };

  // ✅ Confirm Delete Category
  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    const { error } = await supabase.from("categories").delete().eq("id", categoryToDelete);
    if (error) {
      setInfoDialogConfig({
        title: t("common.error"),
        description: t("page.errors.deleteCategoryFailed", { message: error.message }),
        isError: true,
      });
      setInfoDialogOpen(true);
    } else {
      await loadCategories(restaurant.id);
      await loadMenuItems(restaurant.id);
    }
    setDeleteCategoryOpen(false);
    setCategoryToDelete(null);
  };

  const toggleTableActive = async (table) => {
    const { error } = await supabase
      .from("restaurant_tables")
      .update({ is_active: !table.is_active })
      .eq("id", table.id);

    if (!error && restaurant?.id) {
      await loadTables(restaurant.id);
    } else if (error) {
      setInfoDialogConfig({
        title: t("common.error"),
        description: error.message || t("page.errors.updateTableFailed"),
        isError: true,
      });
      setInfoDialogOpen(true);
    }
  };

  // ✅ Trigger Delete Table Dialog
  const deleteTable = (table) => {
    setTableToDelete(table);
    setDeleteTableOpen(true);
  };

  // ✅ Confirm Delete Table
  const confirmDeleteTable = async () => {
    if (!tableToDelete || !restaurant?.id) return;

    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token;

      const res = await fetch(`/api/restaurants/${restaurant.id}/tables/${tableToDelete.id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await res.json();
      if (!res.ok) {
        setInfoDialogConfig({
          title: t("common.error"),
          description: json?.error || t("page.errors.deleteTableFailed"),
          isError: true,
        });
        setInfoDialogOpen(true);
      } else {
        await loadTables(restaurant.id);
      }
    } catch (e) {
      setInfoDialogConfig({
        title: t("common.error"),
        description: e?.message || t("page.errors.deleteTableServerError"),
        isError: true,
      });
      setInfoDialogOpen(true);
    } finally {
      setDeleteTableOpen(false);
      setTableToDelete(null);
    }
  };

  if (loading) {
    return <LoadingScreen message={t("page.loading")} />;
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>{t("page.noRestaurant.title")}</CardTitle>
            <CardDescription>{t("page.noRestaurant.description")}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const newOrdersCount = orders.filter((o) => o.status === "new").length;

  const navItems = [
    { key: "overview", label: t("page.nav.overview"), icon: LayoutDashboard },
    { key: "items", label: t("page.nav.items"), icon: UtensilsCrossed },
    { key: "categories", label: t("page.nav.categories"), icon: Tags },
    { key: "tables", label: t("page.nav.tables"), icon: QrCode },
    { key: "orders", label: t("page.nav.orders"), icon: Receipt, count: newOrdersCount, alert: newOrdersCount > 0 },
    { key: "analytics", label: t("page.nav.analytics"), icon: BarChart3 },
    {
      key: "reviews",
      label: t("page.nav.reviews"),
      icon: Star,
      count: reviews.kpis.unrepliedCount,
      alert: reviews.kpis.unrepliedCount > 0,
    },
    { key: "staff", label: t("page.nav.staff"), icon: Users, count: staff.length },
    { key: "restaurant", label: t("page.nav.restaurant"), icon: Store },
  ];

  const siteNavItems = [
    { label: t("page.siteNav.about"), href: "/about", icon: House },
    { label: t("page.siteNav.howItWorks"), href: "/#how-it-works", icon: Gauge },
    { label: t("page.siteNav.restaurants"), href: "/restaurants", icon: Pizza },
    { label: t("page.siteNav.contact"), href: "/contact", icon: Headset },
  ];

  const tabTitles = {
    overview: t("page.nav.overview"),
    items: t("page.nav.items"),
    categories: t("page.nav.categories"),
    tables: t("page.nav.tables"),
    orders: t("page.nav.orders"),
    analytics: t("page.nav.analytics"),
    reviews: t("page.nav.reviews"),
    staff: t("page.nav.staff"),
    restaurant: t("page.nav.restaurant"),
  };

  const tabDescriptions = {
    overview: t("page.tabDescriptions.overview"),
    items: t("page.tabDescriptions.items"),
    categories: t("page.tabDescriptions.categories"),
    tables: t("page.tabDescriptions.tables"),
    orders: t("page.tabDescriptions.orders"),
    analytics: t("page.tabDescriptions.analytics"),
    reviews: t("page.tabDescriptions.reviews"),
    staff: t("page.tabDescriptions.staff"),
    restaurant: t("page.tabDescriptions.restaurant"),
  };

  const menuActions = {
    toggleAvailability,
    toggleSoldOut,
    deleteItem,
    renameCategory,
    deleteCategory,
    reloadItems: () => loadMenuItems(restaurant.id),
    reloadCategories: () => loadCategories(restaurant.id),
  };

  const headerActions = {
    items: (
      <AddItemDialog restaurantId={restaurant.id} categories={categories} onAdded={menuActions.reloadItems} />
    ),
    categories: (
      <AddCategoryDialog restaurantId={restaurant.id} onAdded={menuActions.reloadCategories} />
    ),
    tables: (
      <AddTableDialog restaurantId={restaurant.id} onAdded={() => loadTables(restaurant.id)} />
    ),
    orders: (
      <button
        type="button"
        onClick={() => loadOrders(restaurant.id)}
        disabled={ordersLoading}
        className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer"
      >
        <RefreshCw className="h-4 w-4" />
        {ordersLoading ? t("page.actions.refreshingOrders") : t("page.actions.refreshOrders")}
      </button>
    ),
    analytics: (
      <div className="flex items-center gap-2">
        <AnalyticsDateRangeSelect value={analytics.range} onChange={analytics.setRange} />
        <button
          type="button"
          onClick={analytics.refresh}
          disabled={analytics.loading}
          aria-label={t("page.actions.refreshAnalytics")}
          title={t("page.actions.refreshAnalytics")}
          className="inline-flex items-center justify-center rounded-lg bg-gray-100 p-2 text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
    ),
    reviews: (
      <button
        type="button"
        onClick={reviews.refresh}
        disabled={reviews.loading}
        aria-label={t("page.actions.refreshReviews")}
        title={t("page.actions.refreshReviews")}
        className="inline-flex items-center justify-center rounded-lg bg-gray-100 p-2 text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer"
      >
        <RefreshCw className="h-4 w-4" />
      </button>
    ),
    staff: <AddStaffDialog onAdd={addStaffMember} />,
    restaurant: (
      <Link
        href="/dashboard/owner/restaurant/edit"
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
      >
        <Pencil className="h-4 w-4" />
        {t("page.actions.editRestaurant")}
      </Link>
    ),
  };

  return (
    <DashboardSidebarProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 lg:flex">
        <DashboardSidebar
          navItems={navItems}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          siteNavItems={siteNavItems}
          user={user}
          profile={profile}
          homeLabel={t("page.homeLabel")}
          editProfileHref="/dashboard/owner/edit-profile"
        />
        <DashboardBackdrop />

        <DashboardMain
          header={
            <DashboardHeader
              user={user}
              profile={profile}
              homeHref="/dashboard/owner"
              homeLabel={t("page.homeLabel")}
              editProfileHref="/dashboard/owner/edit-profile"
            />
          }
        >
          {activeTab === "overview" && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:gap-6 mb-6">
              <StatCard icon={UtensilsCrossed} label={t("page.stats.menuItems")} value={menuItems.length} tint="brand" />
              <StatCard icon={Tags} label={t("page.stats.categories")} value={categories.length} tint="gray" />
              <StatCard icon={QrCode} label={t("page.stats.tables")} value={tables.length} tint="success" />
              <StatCard icon={Receipt} label={t("page.stats.orders")} value={orders.length} tint="warning" />
            </div>
          )}

          <TabSectionHeader
            title={tabTitles[activeTab]}
            description={tabDescriptions[activeTab]}
            action={headerActions[activeTab]}
          />

          {activeTab === "orders" ? (
            <OwnerOrdersTab
              restaurant={restaurant}
              orders={orders}
              ordersLoading={ordersLoading}
              onStatusChange={updateOrderStatus}
            />
          ) : activeTab === "analytics" ? (
            <AnalyticsTab analytics={analytics} />
          ) : activeTab === "reviews" ? (
            <ReviewsTab
              reviews={reviews.reviews}
              kpis={reviews.kpis}
              loading={reviews.loading}
              onReplied={reviews.refresh}
            />
          ) : activeTab === "staff" ? (
            <StaffTab staff={staff} staffLoading={staffLoading} onToggleActive={toggleStaffActive} />
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="p-6">
                {activeTab === "overview" && <OverviewTab restaurant={restaurant} />}

                {activeTab === "items" && (
                  <MenuItemsTab menuItems={menuItems} categoryMap={categoryMap} actions={menuActions} />
                )}

                {activeTab === "categories" && <CategoriesTab categories={categories} actions={menuActions} />}

                {activeTab === "tables" && (
                  <OwnerTablesQrTab
                    restaurant={restaurant}
                    tables={tables}
                    tablesLoading={tablesLoading}
                    onToggleActive={toggleTableActive}
                    onDeleteTable={deleteTable}
                  />
                )}

                {activeTab === "restaurant" && <RestaurantTab restaurant={restaurant} />}
              </div>
            </div>
          )}
        </DashboardMain>
      </div>

      {/* ✅ Delete Item Dialog */}
      <AlertDialog open={deleteItemOpen} onOpenChange={setDeleteItemOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <TriangleAlert className="h-5 w-5" />
              {t("page.deleteItemDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("page.deleteItemDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteItem} className="bg-destructive hover:bg-destructive/90">
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ✅ Delete Category Dialog */}
      <AlertDialog open={deleteCategoryOpen} onOpenChange={setDeleteCategoryOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <TriangleAlert className="h-5 w-5" />
              {t("page.deleteCategoryDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("page.deleteCategoryDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCategory} className="bg-destructive hover:bg-destructive/90">
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ✅ Delete Table Dialog */}
      <AlertDialog open={deleteTableOpen} onOpenChange={setDeleteTableOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <TriangleAlert className="h-5 w-5" />
              {tableToDelete
                ? t("page.deleteTableDialog.titleWithNumber", { number: tableToDelete.table_number })
                : t("page.deleteTableDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("page.deleteTableDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTable} className="bg-destructive hover:bg-destructive/90">
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ✅ Info/Error Dialog */}
      <AlertDialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={`flex items-center gap-2 ${infoDialogConfig.isError ? "text-destructive" : "text-green-600"}`}>
              {infoDialogConfig.isError ? <TriangleAlert className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
              {infoDialogConfig.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {infoDialogConfig.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setInfoDialogOpen(false)}>
              {t("common.okay")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardSidebarProvider>
  );
}
