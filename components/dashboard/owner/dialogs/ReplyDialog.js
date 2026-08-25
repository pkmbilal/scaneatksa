"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { MessageSquareReply } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription as DialogDesc,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitReviewReply } from "@/lib/auth/client";

export default function ReplyDialog({ review, onReplied }) {
  const t = useTranslations("dashboard.owner");
  // review_replies is a single object (or null), not an array -- review_id
  // is unique in review_replies, so PostgREST treats it as a to-one embed.
  const existingReply = review?.review_replies?.reply || "";
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState(existingReply);
  const [submitting, setSubmitting] = useState(false);

  const handleOpenChange = (next) => {
    setOpen(next);
    if (next) setReply(existingReply);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;

    setSubmitting(true);
    const { error } = await submitReviewReply(review.id, reply.trim());
    setSubmitting(false);

    if (error) {
      toast.error(t("reviewsTab.replyDialog.error"));
      return;
    }

    toast.success(t("reviewsTab.replyDialog.success"));
    setOpen(false);
    await onReplied?.();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <MessageSquareReply className="h-4 w-4" />
          {existingReply ? t("reviewsTab.editReplyButton") : t("reviewsTab.replyButton")}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("reviewsTab.replyDialog.title")}</DialogTitle>
          <DialogDesc>{t("reviewsTab.replyDialog.description")}</DialogDesc>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder={t("reviewsTab.replyDialog.placeholder")}
            rows={4}
            required
          />

          <DialogFooter>
            <Button type="submit" disabled={submitting || !reply.trim()}>
              {submitting ? t("reviewsTab.replyDialog.submitting") : t("reviewsTab.replyDialog.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
