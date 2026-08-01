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