import SiteFooter from "@/components/home/SiteFooter"
import ContactHero from "@/components/contact/ContactHero"
import ContactHighlights from "@/components/contact/ContactHighlights"
import ContactInfo from "@/components/contact/ContactInfo"
import ContactForm from "@/components/contact/ContactForm"
import { footerData } from "@/lib/siteData"
import { getTranslations } from "next-intl/server"

export async function generateMetadata() {
  const t = await getTranslations("contact.metadata")

  return {
    title: t("title"),
    description: t("description"),
    keywords: [
      "ScanEat contact",
      "QR menu Saudi Arabia",
      "WhatsApp ordering KSA",
      "digital menu support",
      "restaurant QR menu contact",
    ],
  }
}

export default async function ContactPage() {
  const t = await getTranslations("contact")

  const phone = "+966531826230"
  const displayPhone = "+966 531826230"
  const whatsappNumber = "+966531826230"
  const displayWhatsapp = "+966 531826230"
  const whatsappLink = `https://wa.me/${whatsappNumber.replace(/\+/g, "")}`
  const email = "hello@codesudio.com"

  const quickItems = t.raw("quickItems")

  const contactMethods = [
    {
      icon: "phone",
      label: t("contactMethods.call"),
      value: displayPhone,
      href: `tel:${phone}`,
    },
    {
      icon: "whatsapp",
      label: t("contactMethods.whatsapp"),
      value: displayWhatsapp,
      href: whatsappLink,
      target: "_blank",
    },
    {
      icon: "mail",
      label: t("contactMethods.email"),
      value: email,
      href: `mailto:${email}`,
    },
    {
      icon: "clock",
      label: t("contactMethods.hours"),
      value: t("contactMethods.hoursValue"),
    },
    {
      icon: "map",
      label: t("contactMethods.serviceArea"),
      value: t("contactMethods.serviceAreaValue"),
    },
  ]

  return (
    <main className="min-h-screen bg-background text-foreground">
      <ContactHero whatsappLink={whatsappLink} email={email} />
      <ContactHighlights items={quickItems} />

      <section className="container mx-auto px-4 pb-16">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <ContactInfo
            contactMethods={contactMethods}
            whatsappLink={whatsappLink}
          />
          <ContactForm whatsappLink={whatsappLink} />
        </div>
      </section>

      <SiteFooter data={footerData} />
    </main>
  )
}
