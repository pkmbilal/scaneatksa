"use client"

import Link from "next/link"
import { MessageCircle } from "lucide-react"
import { useTranslations } from "next-intl"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Form field name -> contact.form label key, in the order they appear in the message.
const FIELD_LABEL_KEYS = {
  name: "fullName",
  phone: "phone",
  email: "email",
  business: "business",
  message: "message",
}

export default function ContactForm({ whatsappLink }) {
  const t = useTranslations("contact.form")

  // There is no backend for this form: it hands the details to WhatsApp as a
  // pre-filled message, which is where the team already answers inquiries.
  function handleSubmit(event) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const lines = Object.entries(FIELD_LABEL_KEYS)
      .map(([field, labelKey]) => {
        const value = String(data.get(field) || "").trim()
        return value ? `${t(labelKey)}: ${value}` : null
      })
      .filter(Boolean)
    const text = [t("waIntro"), "", ...lines].join("\n")
    window.open(`${whatsappLink}?text=${encodeURIComponent(text)}`, "_blank", "noopener")
  }

  return (
    <Card className="rounded-3xl border-border bg-card shadow-sm">
      <CardContent className="p-5 md:p-7">
        <div className="mb-6">
          <p className="text-sm font-medium text-primary">{t("eyebrow")}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            {t("title")}
          </h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            {t("description")}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
                {t("fullName")}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder={t("fullNamePlaceholder")}
                className="h-11 w-full rounded-2xl border border-border bg-muted/30 px-4 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:bg-background"
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-medium">
                {t("phone")}
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder={t("phonePlaceholder")}
                className="h-11 w-full rounded-2xl border border-border bg-muted/30 px-4 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:bg-background"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
              {t("email")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder={t("emailPlaceholder")}
              className="h-11 w-full rounded-2xl border border-border bg-muted/30 px-4 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:bg-background"
            />
          </div>

          <div>
            <label
              htmlFor="business"
              className="mb-1.5 block text-sm font-medium"
            >
              {t("business")}
            </label>
            <input
              id="business"
              name="business"
              type="text"
              placeholder={t("businessPlaceholder")}
              className="h-11 w-full rounded-2xl border border-border bg-muted/30 px-4 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:bg-background"
            />
          </div>

          <div>
            <label
              htmlFor="message"
              className="mb-1.5 block text-sm font-medium"
            >
              {t("message")}
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              required
              placeholder={t("messagePlaceholder")}
              className="w-full rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:bg-background"
            />
          </div>

          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <Button
              type="submit"
              size="lg"
              className="h-11 rounded-full px-6 text-sm"
            >
              {t("send")}
            </Button>

            <Button
              asChild
              type="button"
              variant="outline"
              size="lg"
              className="h-11 rounded-full px-6 text-sm"
            >
              <Link href={whatsappLink} target="_blank">
                <MessageCircle className="me-2 h-4 w-4" />
                {t("whatsappCta")}
              </Link>
            </Button>
          </div>

          <p className="text-xs leading-6 text-muted-foreground">
            {t("disclaimer")}
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
