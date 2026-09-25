import { getTranslations, getLocale } from "next-intl/server";

import HowItWorksHero from "@/components/how-it-works/HowItWorksHero";
import JourneySection from "@/components/how-it-works/JourneySection";
import HowItWorksFAQ from "@/components/how-it-works/HowItWorksFAQ";
import FinalCTASection from "@/components/home/FinalCTASection";
import SiteFooter from "@/components/home/SiteFooter";
import { finalCtaData, footerData } from "@/lib/siteData";
import { DEFAULT_OG_IMAGE, jsonLdProps, localeHref, localizedAlternates, ogLocale } from "@/lib/seo";

const dinerImages = [
  { src: "/how-it-works/diner-1-scan.jpg", alt: "Browsing the ScanEat restaurant directory to find a place to order from" },
  { src: "/how-it-works/diner-2-menu.jpg", alt: "Browsing a ScanEat digital menu with photos, prices, and categories" },
  { src: "/how-it-works/diner-3-cart.jpg", alt: "Reviewing a cart before choosing dine-in, pickup, or delivery" },
  { src: "/how-it-works/diner-4-checkout.jpg", alt: "Order confirmation screen right after checkout" },
  { src: "/how-it-works/diner-5-track.jpg", alt: "Tracking a live order status from the customer dashboard" },
];

const ownerImages = [
  { src: "/how-it-works/owner-1-setup.jpg", alt: "Restaurant profile overview in the ScanEat owner dashboard" },
  { src: "/how-it-works/owner-2-menu.jpg", alt: "Managing digital menu items, prices, and availability" },
  { src: "/how-it-works/owner-3-qr.jpg", alt: "Generating a printable table QR code" },
  { src: "/how-it-works/owner-4-orders.jpg", alt: "Live kitchen queue screen showing an incoming order" },
  { src: "/how-it-works/owner-5-analytics.jpg", alt: "Owner analytics dashboard with revenue and order data" },
];

export async function generateMetadata() {
  const locale = await getLocale();
  const t = await getTranslations("howItWorks.metadata");

  return {
    title: { absolute: t("title") },
    description: t("description"),
    alternates: localizedAlternates("/how-it-works", locale),
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: localeHref("/how-it-works", locale),
      locale: ogLocale(locale),
      images: [DEFAULT_OG_IMAGE],
    },
    keywords: [
      "how ScanEat works",
      "QR menu ordering process",
      "WhatsApp restaurant ordering",
      "restaurant kitchen dashboard",
      "digital menu setup",
    ],
  };
}

export default async function HowItWorksPage() {
  const t = await getTranslations("howItWorks.faq");
  const faqItems = t.raw("items");

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script id="schema-how-it-works-faq" {...jsonLdProps(faqSchema)} />

      <main className="min-h-screen bg-background text-foreground">
        <HowItWorksHero />
        <JourneySection
          id="diner-journey"
          namespace="howItWorks.diner"
          images={dinerImages}
        />
        <JourneySection
          id="owner-journey"
          namespace="howItWorks.owner"
          images={ownerImages}
          tinted
        />
        <HowItWorksFAQ />
        <FinalCTASection data={finalCtaData} />
        <SiteFooter data={footerData} />
      </main>
    </>
  );
}
