import Link from "next/link"
import {
  Phone,
  MessageCircle,
  Mail,
  Clock3,
  MapPin,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getTranslations } from "next-intl/server"

function getIcon(icon) {
  switch (icon) {
    case "phone":
      return Phone
    case "whatsapp":
      return MessageCircle
    case "mail":
      return Mail
    case "clock":
      return Clock3
    case "map":
      return MapPin
    default:
      return Phone
  }
}

export default async function ContactInfo({ contactMethods, whatsappLink }) {
  const t = await getTranslations("contact.info")

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-border bg-card shadow-sm">
        <CardContent className="p-5 md:p-6">
          <div className="mb-5">
            <p className="text-sm font-medium text-primary">{t("eyebrow")}</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              {t("title")}
            </h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {t("description")}
            </p>
          </div>

          <div className="space-y-3">
            {contactMethods.map((item) => {
              const Icon = getIcon(item.icon)

              const content = (
                <>
                  <div className="rounded-xl bg-background p-2 shadow-sm">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="break-all text-sm text-muted-foreground">
                      {item.value}
                    </p>
                  </div>
                </>
              )

              return item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  target={item.target}
                  className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/40 p-3 transition hover:border-primary/20 hover:bg-muted/60"
                >
                  {content}
                </Link>
              ) : (
                <div
                  key={item.label}
                  className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/40 p-3"
                >
                  {content}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="rounded-3xl border border-primary/15 bg-primary px-5 py-6 text-primary-foreground shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-primary-foreground/75">
          {t("fasterResponse")}
        </p>
        <h3 className="mt-2 text-xl font-semibold">{t("preferWhatsapp")}</h3>
        <p className="mt-2 text-sm leading-7 text-primary-foreground/85">
          {t("whatsappText")}
        </p>
        <Button
          asChild
          size="lg"
          className="mt-5 h-10 rounded-full bg-background px-5 text-primary hover:bg-background/90"
        >
          <Link href={whatsappLink} target="_blank">
            <MessageCircle className="me-2 h-4 w-4" />
            {t("startWhatsappChat")}
          </Link>
        </Button>
      </div>
    </div>
  )
}
