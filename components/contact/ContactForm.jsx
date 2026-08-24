import Link from "next/link"
import { MessageCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getTranslations } from "next-intl/server"

export default async function ContactForm({ whatsappLink }) {
  const t = await getTranslations("contact.form")

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

        <form className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
                {t("fullName")}
              </label>
              <input
                id="name"
                name="name"
                type="text"
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
                type="text"
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
