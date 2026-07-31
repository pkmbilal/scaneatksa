import SiteFooter from "@/components/home/SiteFooter"
import ContactHero from "@/components/contact/ContactHero"
import ContactHighlights from "@/components/contact/ContactHighlights"
import ContactInfo from "@/components/contact/ContactInfo"
import ContactForm from "@/components/contact/ContactForm"
import { footerData } from "@/lib/siteData"

export const metadata = {
  title: "Contact Us | ScanEat",
  description:
    "Contact ScanEat for QR menu setup, WhatsApp ordering, onboarding support, and digital menu solutions for restaurants across Saudi Arabia.",
  keywords: [
    "ScanEat contact",
    "QR menu Saudi Arabia",
    "WhatsApp ordering KSA",
    "digital menu support",
    "restaurant QR menu contact",
  ],
}

export default function ContactPage() {
  const phone = "+966531826230"
  const displayPhone = "+966 531826230"
  const whatsappNumber = "+966531826230"
  const displayWhatsapp = "+966 531826230"
  const whatsappLink = `https://wa.me/${whatsappNumber.replace(/\+/g, "")}`
  const email = "hello@codesudio.com"

  const quickItems = [
    {
      icon: "store",
      title: "Built for restaurants",
      text: "For dine-in, takeaway, and QR ordering workflows.",
    },
    {
      icon: "headphones",
      title: "Direct support",
      text: "Fast help for onboarding, demos, and setup questions.",
    },
    {
      icon: "badge",
      title: "Quick launch",
      text: "Get your digital menu live with minimal friction.",
    },
  ]

  const contactMethods = [
    {
      icon: "phone",
      label: "Call",
      value: displayPhone,
      href: `tel:${phone}`,
    },
    {
      icon: "whatsapp",
      label: "WhatsApp",
      value: displayWhatsapp,
      href: whatsappLink,
      target: "_blank",
    },
    {
      icon: "mail",
      label: "Email",
      value: email,
      href: `mailto:${email}`,
    },
    {
      icon: "clock",
      label: "Hours",
      value: "Sun to Thu · 9:00 AM to 6:00 PM",
    },
    {
      icon: "map",
      label: "Service area",
      value: "Restaurants across Saudi Arabia",
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