"use client";
import { supabaseBrowser } from "@/lib/supabase/client";
const supabase = supabaseBrowser();

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getCurrentUser,
  getUserProfile,
  getUserRestaurant,
} from "@/lib/auth/client";

export default function EditMenuItemPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = params.itemId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [item, setItem] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    image_url: "",
    is_available: true,
    is_veg: true, // ✅ NEW
  });

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  async function init() {
    setLoading(true);
    setError("");

    // 1) Auth
    const { user: currentUser, error: userError } = await getCurrentUser();
    if (userError || !currentUser) {
      router.push("/auth/login");
      return;
    }

    const { data: profile } = await getUserProfile(currentUser.id);
    if (!profile || profile.role !== "owner") {
      router.push("/dashboard");
      return;
    }

    // 2) Restaurant (owner’s restaurant)
    const { data: userRestaurant, error: restErr } = await getUserRestaurant(
      currentUser.id,
    );
    if (restErr || !userRestaurant) {
      setError("No restaurant found for this owner.");
      setLoading(false);
      return;
    }
    setRestaurant(userRestaurant);

    // 3) Load categories
    const { data: catData, error: catErr } = await supabase
      .from("categories")
      .select("*")
      .eq("restaurant_id", userRestaurant.id)
      .order("name", { ascending: true });

    if (!catErr) setCategories(catData || []);

    // 4) Load the item
    const { data: itemData, error: itemErr } = await supabase
      .from("menu_items")
      .select("*")
      .eq("id", itemId)
      .single();

    if (itemErr || !itemData) {
      setError("Menu item not found.");
      setLoading(false);
      return;
    }

    // ✅ SECURITY CHECK: make sure this item belongs to this owner’s restaurant
    if (itemData.restaurant_id !== userRestaurant.id) {
      setError("You are not allowed to edit this item.");
      setLoading(false);
      return;
    }

    setItem(itemData);

    // Fill form
    setFormData({
      name: itemData.name || "",
      description: itemData.description || "",
      price: itemData.price ?? "",
      category_id: itemData.category_id || "",
      image_url: itemData.image_url || "",
      is_available: itemData.is_available ?? true,
      is_veg: itemData.is_veg ?? true, // ✅ NEW (default to true if null)
    });

    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const priceNum = Number.parseFloat(formData.price);
    if (Number.isNaN(priceNum)) {
      setError("Please enter a valid price.");
      setSaving(false);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: priceNum,
      category_id: formData.category_id || null,
      image_url: formData.image_url?.trim() || null,
      is_available: !!formData.is_available,
      is_veg: !!formData.is_veg, // ✅ NEW
    };

    const { error: updateErr } = await supabase
      .from("menu_items")
      .update(payload)
      .eq("id", itemId)
      .eq("restaurant_id", restaurant.id); // extra safety

    if (updateErr) {
      setError(updateErr.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    router.push("/dashboard/owner");
    router.refresh?.();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading item...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 max-w-md w-full dark:border-gray-800 dark:bg-white/[0.03]">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white/90 mb-2">
            Edit Menu Item
          </h1>
          <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>
          <Link href="/dashboard/owner" className="text-brand-600 dark:text-brand-400 font-semibold">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
                Edit Menu Item
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{item?.name}</p>
            </div>
            <Link
              href="/dashboard/owner"
              className="text-sm font-semibold text-brand-600 dark:text-brand-400"
            >
              ← Back
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Item Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:border-gray-700 dark:bg-white/[0.03] dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                rows="3"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:border-gray-700 dark:bg-white/[0.03] dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Price (SAR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:border-gray-700 dark:bg-white/[0.03] dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={formData.category_id || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, category_id: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white text-gray-900 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white"
                >
                  <option value="">Uncategorized</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Image URL
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) =>
                  setFormData({ ...formData, image_url: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:border-gray-700 dark:bg-white/[0.03] dark:text-white"
              />
              {formData.image_url && (
                <div className="mt-3">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full max-h-64 object-cover rounded-lg border border-gray-200 dark:border-gray-800"
                  />
                </div>
              )}
            </div>

            {/* ✅ Availability */}
            <div className="flex items-center gap-3">
              <input
                id="is_available"
                type="checkbox"
                checked={formData.is_available}
                onChange={(e) =>
                  setFormData({ ...formData, is_available: e.target.checked })
                }
                className="w-5 h-5"
              />
              <label
                htmlFor="is_available"
                className="text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Available for ordering
              </label>
            </div>

            {/* ✅ NEW: Veg toggle */}
            <div className="flex items-center gap-3">
              <input
                id="is_veg"
                type="checkbox"
                checked={formData.is_veg}
                onChange={(e) =>
                  setFormData({ ...formData, is_veg: e.target.checked })
                }
                className="w-5 h-5"
              />
              <label
                htmlFor="is_veg"
                className="text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Veg item
              </label>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formData.is_veg ? "🥗 Veg" : "🍗 Non-veg"}
              </span>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-brand-500 hover:bg-brand-600 text-white py-3 rounded-lg font-semibold disabled:bg-gray-400 transition-colors cursor-pointer"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <Link
                href="/dashboard/owner"
                className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold transition-colors text-center dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
