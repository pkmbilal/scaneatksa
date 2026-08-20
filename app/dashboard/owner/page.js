"use client";
import { supabaseBrowser } from "@/lib/supabase/client";
const supabase = supabaseBrowser();

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
import AddItemDialog from "@/components/dashboard/owner/dialogs/AddItemDialog";
import AddCategoryDialog from "@/components/dashboard/owner/dialogs/AddCategoryDialog";
import AddTableDialog from "@/components/dashboard/owner/dialogs/AddTableDialog";

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
        title: "Couldn't update order",
        description: data?.error || "Please try again.",
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
    if (!clean) return { ok: false, message: "Name cannot be empty" };

    const { error } = await supabase
      .from("categories")
      .update({ name: clean })
      .eq("id", categoryId);

    if (error) {
      const msg = error.message?.toLowerCase().includes("duplicate")
        ? "This category already exists."
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
        title: "Error",
        description: "Failed to delete category: " + error.message,
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
        title: "Error",
        description: error.message || "Failed to update table.",
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
          title: "Error",
          description: json?.error || "Failed to delete table.",
          isError: true,
        });
        setInfoDialogOpen(true);
      } else {
        await loadTables(restaurant.id);
      }
    } catch (e) {
      setInfoDialogConfig({
        title: "Error",
        description: e?.message || "Server error deleting table.",
        isError: true,
      });
      setInfoDialogOpen(true);
    } finally {
      setDeleteTableOpen(false);
      setTableToDelete(null);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading owner dashboard..." />;
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>No Restaurant Found</CardTitle>
            <CardDescription>Please contact admin for assistance.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const newOrdersCount = orders.filter((o) => o.status === "new").length;

  const navItems = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "items", label: "Menu Items", icon: UtensilsCrossed },
    { key: "categories", label: "Categories", icon: Tags },
    { key: "tables", label: "Tables & QR", icon: QrCode },
    { key: "orders", label: "Orders", icon: Receipt, count: newOrdersCount, alert: newOrdersCount > 0 },
    { key: "staff", label: "Staff", icon: Users, count: staff.length },
    { key: "restaurant", label: "Restaurant", icon: Store },
  ];

  const siteNavItems = [
    { label: "About", href: "/about", icon: House },
    { label: "How It Works", href: "/#how-it-works", icon: Gauge },
    { label: "Restaurants", href: "/restaurants", icon: Pizza },
    { label: "Contact", href: "/contact", icon: Headset },
  ];

  const tabTitles = {
    overview: "Overview",
    items: "Menu Items",
    categories: "Categories",
    tables: "Tables & QR",
    orders: "Orders",
    staff: "Staff",
    restaurant: "Restaurant",
  };

  const tabDescriptions = {
    overview: "A quick snapshot of your restaurant's menu, tables, and orders.",
    items: "Manage the dishes on your menu, prices, and availability.",
    categories: "Organize your menu items into categories.",
    tables: "Generate QR codes so orders automatically tag the right table.",
    orders: "Dine-in orders show a table number. Online orders show pickup or delivery.",
    staff: "Create kitchen and waiter accounts for your restaurant.",
    restaurant: "Manage your restaurant's public details and settings.",
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
        {ordersLoading ? "Refreshing..." : "Refresh Orders"}
      </button>
    ),
    restaurant: (
      <Link
        href="/dashboard/owner/restaurant/edit"
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
      >
        <Pencil className="h-4 w-4" />
        Edit Restaurant
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
        />
        <DashboardBackdrop />

        <DashboardMain
          header={
            <DashboardHeader
              user={user}
              profile={profile}
              homeHref="/dashboard/owner"
              homeLabel="Owner Dashboard"
              editProfileHref="/dashboard/owner/edit-profile"
            />
          }
        >
          {activeTab === "overview" && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:gap-6 mb-6">
              <StatCard icon={UtensilsCrossed} label="Menu Items" value={menuItems.length} tint="brand" />
              <StatCard icon={Tags} label="Categories" value={categories.length} tint="gray" />
              <StatCard icon={QrCode} label="Tables" value={tables.length} tint="success" />
              <StatCard icon={Receipt} label="Orders" value={orders.length} tint="warning" />
            </div>
          )}

          <TabSectionHeader
            title={tabTitles[activeTab]}
            description={tabDescriptions[activeTab]}
            action={headerActions[activeTab]}
          />

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

              {activeTab === "orders" && (
                <OwnerOrdersTab
                  restaurant={restaurant}
                  orders={orders}
                  ordersLoading={ordersLoading}
                  onStatusChange={updateOrderStatus}
                />
              )}

              {activeTab === "staff" && (
                <StaffTab
                  staff={staff}
                  staffLoading={staffLoading}
                  onAdd={addStaffMember}
                  onToggleActive={toggleStaffActive}
                />
              )}

              {activeTab === "restaurant" && <RestaurantTab restaurant={restaurant} />}
            </div>
          </div>
        </DashboardMain>
      </div>

      {/* ✅ Delete Item Dialog */}
      <AlertDialog open={deleteItemOpen} onOpenChange={setDeleteItemOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <TriangleAlert className="h-5 w-5" />
              Delete Item
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteItem} className="bg-destructive hover:bg-destructive/90">
              Delete
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
              Delete Category
            </AlertDialogTitle>
            <AlertDialogDescription>
              Delete this category? Items under it will become Uncategorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCategory} className="bg-destructive hover:bg-destructive/90">
              Delete
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
              Delete Table{tableToDelete ? ` ${tableToDelete.table_number}` : ""}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This can&rsquo;t be undone. If this table has past orders, deletion will be blocked — deactivate
              it instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTable} className="bg-destructive hover:bg-destructive/90">
              Delete
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
              Okay
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardSidebarProvider>
  );
}
