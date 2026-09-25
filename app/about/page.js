import { getTranslations } from "next-intl/server";
import { DEFAULT_OG_IMAGE } from "@/lib/seo";
import SiteFooter from "@/components/home/SiteFooter";
import { footerData } from "@/lib/siteData";

import AboutHero from "@/components/about/AboutHero";
import AboutPositioning from "@/components/about/AboutPositioning";
import AboutStory from "@/components/about/AboutStory";
import AboutOperations from "@/components/about/AboutOperations";
import AboutPrinciples from "@/components/about/AboutPrinciples";
import AboutProductView from "@/components/about/AboutProductView";
import AboutMission from "@/components/about/AboutMission";
import AboutTeamBanner from "@/components/about/AboutTeamBanner";

export async function generateMetadata() {
  const t = await getTranslations("about.metadata");

  return {
    title: { absolute: t("title") },
    description: t("description"),
    alternates: { canonical: "/about" },
    openGraph: { title: t("title"), description: t("description"), url: "/about", images: [DEFAULT_OG_IMAGE] },
  };
}

export default function AboutPage() {
  return (
    <main className="bg-background text-foreground">
      <AboutHero />
      <AboutPositioning />
      <AboutStory />
      <AboutOperations />
      <AboutPrinciples />
      <AboutProductView />
      <AboutMission />
      <AboutTeamBanner />
      <SiteFooter data={footerData} />
    </main>
  );
}