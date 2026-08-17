"use client";
import { supabaseBrowser } from "@/lib/supabase/client";
const supabase = supabaseBrowser();

import { useState } from "react";

import { DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const inputClass =
  "w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white";
const labelClass = "mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300";
const selectTriggerClass =
  "w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

export default function AddItemForm({ restaurantId, categories, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    image_url: "",
    is_available: true,
    is_veg: true,
    is_sold_out: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const priceNum = Number.parseFloat(form.price);
    if (Number.isNaN(priceNum)) {
      setError("Please enter a valid price.");
      setLoading(false);
      return;
    }

    const { error: dbError } = await supabase.from("menu_items").insert([
      {
        restaurant_id: restaurantId,
        name: form.name.trim(),
        description: form.description.trim(),
        price: priceNum,
        category_id: form.category_id || null,
        image_url: form.image_url?.trim() || null,
        is_available: !!form.is_available,
        is_veg: !!form.is_veg,
        is_sold_out: !!form.is_sold_out,
      },
    ]);

    if (dbError) {
      setError(dbError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    onSuccess?.();
  };

  const categorySelect = (
    <div>
      <label className={labelClass}>Category</label>
      <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
        <SelectTrigger className={selectTriggerClass}>
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {categories.length === 0 ? (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Add a category first to create items.</p>
      ) : null}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <label className={labelClass}>Item Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g., Chicken Mandi"
            required
            className={inputClass}
          />
        </div>

        {/* Mobile Only Block */}
        <div className="grid grid-cols-2 gap-2 md:hidden">
          <div className="col-span-1">
            <label className={labelClass}>Price (SAR)</label>
            <input
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="12.00"
              required
              className={inputClass}
            />
          </div>

          <div className="col-span-1">{categorySelect}</div>
        </div>

        {/* Price */}
        <div className="hidden md:block">
          <label className={labelClass}>Price (SAR)</label>
          <input
            type="number"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="12.00"
            required
            className={inputClass}
          />
        </div>

        <div className="hidden md:block md:col-span-1">{categorySelect}</div>

        <div className="col-span-1 md:col-span-2">
          <label className={labelClass}>Description</label>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Short description…"
            required
            className={inputClass}
          />
        </div>

        <div className="md:col-span-3">
          <label className={labelClass}>Image URL (optional)</label>
          <input
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            placeholder="https://…"
            className={inputClass}
          />
        </div>
      </div>

      <hr className="border-gray-200 dark:border-gray-800" />

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center justify-between gap-2 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">Available</p>
            <p className="hidden text-xs text-gray-500 dark:text-gray-400 sm:block">Shown to customers</p>
          </div>
          <Switch checked={form.is_available} onCheckedChange={(v) => setForm({ ...form, is_available: v })} />
        </div>

        <div className="flex flex-col items-center justify-between gap-2 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">Veg</p>
            <p className="hidden text-xs text-gray-500 dark:text-gray-400 sm:block">
              {form.is_veg ? "Veg item" : "Non-veg item"}
            </p>
          </div>
          <Switch checked={form.is_veg} onCheckedChange={(v) => setForm({ ...form, is_veg: v })} />
        </div>

        <div className="flex flex-col items-center justify-between gap-2 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">Sold Out</p>
            <p className="hidden text-xs text-gray-500 dark:text-gray-400 sm:block">Disables add button</p>
          </div>
          <Switch checked={form.is_sold_out} onCheckedChange={(v) => setForm({ ...form, is_sold_out: v })} />
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      ) : null}

      <DialogFooter>
        <button
          type="submit"
          disabled={loading || categories.length === 0}
          className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Adding…" : "Add Item"}
        </button>
      </DialogFooter>
    </form>
  );
}
