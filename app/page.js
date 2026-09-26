import { supabaseServer } from "@/lib/supabase/server";
import { getTranslations, getLocale } from "next-intl/server";
import {
  SITE_URL,
  SITE_NAME,
  jsonLdProps,
  localeHref,
  localizedAlternates,
  ogLocale,
} from "@/lib/seo";

import HeroSection from "@/components/home/HeroSection";
import TrustStrip from "@/components/home/TrustStrip";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import OperationsSection from "@/components/home/OperationsSection";
import BenefitsSection from "@/components/home/BenefitsSection";
import FeaturedRestaurantsSection from "@/components/home/FeaturedRestaurantsSection";
import FAQSection from "@/components/home/FAQSection";
import FinalCTASection from "@/components/home/FinalCTASection";
import SiteFooter from "@/components/home/SiteFooter";

import {
  heroData,
  featuredRestaurantsData,
  finalCtaData,
  footerData,
  contactData,
} from "@/lib/siteData";

const siteUrl = SITE_URL;
const siteName = SITE_NAME;
const ogImage = `${siteUrl}/og-home.jpg`;

export async function generateMetadata() {
  const locale = await getLocale();
  const t = await getTranslations("home.metadata");
  const title = t("title");
  const description = t("description");

  return {
    title: { absolute: title },
    description,
    keywords: [
      "QR menu",
      "digital menu",
      "restaurant QR menu",
      "WhatsApp ordering",
      "restaurant ordering system",
      "cafe QR menu",
      "contactless menu",
      "table QR code menu",
      "restaurant menu software",
      "ScanEat",
      "Saudi restaurant QR menu",
      "restaurant digital ordering",
      "restaurant management system",
      "kitchen display system",
      "restaurant analytics",
      "restaurant operations platform",
      "منيو إلكتروني",
      "منيو QR",
      "قائمة طعام رقمية",
      "نظام طلبات المطاعم",
    ],
    alternates: localizedAlternates("/", locale),
    openGraph: {
      title,
      description,
      url: localeHref("/", locale),
      siteName,
      type: "website",
      locale: ogLocale(locale),
      images: [{ url: ogImage, width: 1200, height: 630, alt: t("ogAlt") }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    category: "technology",
  };
}

export default async function HomePage() {
  const supabase = supabaseServer();

  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(6);

  const restaurantCount = restaurants?.length || 0;

  const t = await getTranslations("home");
  const faqItems = t.raw("faq.items");
  const pageDescription = t("metadata.description");

  // Stable node ids so WebSite/SoftwareApplication point at one ScanEat entity.
  const organizationId = `${siteUrl}/#organization`;

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": organizationId,
    name: siteName,
    alternateName: ["سكان إيت", "ScanEat KSA"],
    url: siteUrl,
    logo: `${siteUrl}/scaneat-logo.png`,
    description: pageDescription,
    email: contactData.email,
    areaServed: { "@type": "Country", name: "Saudi Arabia" },
    address: { "@type": "PostalAddress", addressCountry: "SA" },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: contactData.phone,
      email: contactData.email,
      contactType: "sales",
      areaServed: "SA",
      availableLanguage: ["en", "ar"],
    },
    // TODO: add sameAs with real social profile URLs (Instagram, LinkedIn, X)
    // once they exist -- an empty array is worse than omitting it.
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ScanEat",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: siteUrl,
    description: t("metadata.softwareDescription"),
    provider: { "@id": organizationId },
    // Free 30-day trial, then paid -- don't advertise price "0" as the
    // product price. Add a real Offer with the SAR plan price once public.
    offers: {
      "@type": "Offer",
      name: "30-day free trial",
      price: "0",
      priceCurrency: "SAR",
      description: "Free 30-day trial, then a paid monthly subscription.",
    },
    brand: {
      "@type": "Brand",
      name: "ScanEat",
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: siteName,
    url: siteUrl,
    description: pageDescription,
    inLanguage: ["en", "ar"],
    publisher: { "@id": organizationId },
  };

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
      <script id="schema-organization" {...jsonLdProps(organizationSchema)} />
      <script id="schema-software" {...jsonLdProps(softwareSchema)} />
      <script id="schema-website" {...jsonLdProps(websiteSchema)} />
      <script id="schema-faq" {...jsonLdProps(faqSchema)} />

      <div className="min-h-screen bg-white text-slate-900">
        <HeroSection data={heroData} />
        <TrustStrip restaurantCount={restaurantCount} />
        <HowItWorksSection />
        <FeaturesSection />
        <OperationsSection />
        <BenefitsSection />
        <FeaturedRestaurantsSection
          data={featuredRestaurantsData}
          restaurants={restaurants}
        />
        <FAQSection />
        <FinalCTASection data={finalCtaData} />
        <SiteFooter data={footerData} />
      </div>
    </>
  );
}