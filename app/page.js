import { supabaseServer } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import Script from "next/script";

import HeroSection from "@/components/home/HeroSection";
import TrustStrip from "@/components/home/TrustStrip";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import FeaturesSection from "@/components/home/FeaturesSection";
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
} from "@/lib/siteData";

const siteUrl = "https://scaneatksa.com"; // change to your actual domain
const siteName = "ScanEat";
const pageTitle = "ScanEat | QR Menu & WhatsApp Ordering for Restaurants";
const pageDescription =
  "Create digital QR menus for restaurants, cafes, and food businesses. Let customers scan, browse, and order instantly via WhatsApp.";
const ogImage = `${siteUrl}/og-home.jpg`; // create this image later

/** @type {import("next").Metadata} */
export const metadata = {
  metadataBase: new URL(siteUrl),
  title: pageTitle,
  description: pageDescription,
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
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: siteUrl,
    siteName,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "ScanEat QR menu and WhatsApp ordering platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
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

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description: pageDescription,
    sameAs: [
      // add your real social URLs later
      // "https://www.instagram.com/yourbrand",
      // "https://www.linkedin.com/company/yourbrand"
    ],
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ScanEat",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: siteUrl,
    description:
      "A web-based QR menu and restaurant ordering platform that helps restaurants create digital menus and receive orders via WhatsApp.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "SAR",
    },
    brand: {
      "@type": "Brand",
      name: "ScanEat",
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    description: pageDescription,
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
      <Script
        id="schema-organization"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="schema-software"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <Script
        id="schema-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <Script
        id="schema-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="min-h-screen bg-white text-slate-900">
        <HeroSection data={heroData} />
        <TrustStrip restaurantCount={restaurantCount} />
        <HowItWorksSection />
        <FeaturesSection />
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