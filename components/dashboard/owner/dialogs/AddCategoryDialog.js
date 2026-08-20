"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription as DialogDesc,
  DialogTrigger,
} from "@/components/ui/dialog";

import AddCategoryForm from "@/components/dashboard/owner/forms/AddCategoryForm";

export default function AddCategoryDialog({ restaurantId, onAdded }) {
  const t = useTranslations("dashboard.owner");
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          {t("addCategoryDialog.trigger")}
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("addCategoryDialog.title")}</DialogTitle>
          <DialogDesc>{t("addCategoryDialog.description")}</DialogDesc>
        </DialogHeader>

        <AddCategoryForm
          restaurantId={restaurantId}
          onSuccess={async () => {
            setOpen(false);
            await onAdded?.();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
