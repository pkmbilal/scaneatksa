import { ArrowRight } from "lucide-react";

export default function AboutMission() {
  return (
    <section className="border-t">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:px-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
            Our mission
          </p>
          <h2 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight md:text-4xl">
            To help restaurants deliver a faster, cleaner, and more modern
            ordering experience
          </h2>
        </div>

        <div className="lg:col-span-5">
          <p className="text-base leading-8 text-muted-foreground md:text-lg">
            ScanEat exists to reduce operational friction and improve the
            guest journey through simple, well-designed QR technology. We are
            building for restaurants that care about speed, clarity, and the
            quality of the experience they present.
          </p>

          <div className="mt-8">
            <a
              href="/restaurants"
              className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-medium transition-all duration-300 hover:bg-muted"
            >
              Explore the platform
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}