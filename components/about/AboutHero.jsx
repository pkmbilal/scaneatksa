import Image from "next/image";
import { Check } from "lucide-react";
import { highlights } from "@/lib/siteData";



export default function AboutHero() {
  return (
    <section className="border-b">
      <div className="mx-auto grid max-w-7xl items-stretch gap-14 px-6 py-10 md:py-20 md:px-8 lg:grid-cols-12 lg:gap-10 lg:py-28">
        <div className="flex h-full flex-col justify-center lg:col-span-6">
          <div className="mb-6 inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            About ScanEat
          </div>

          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">
            Built for restaurants that want a more modern service experience
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
            ScanEat helps restaurants replace slow, outdated ordering flows
            with a cleaner digital experience — from QR menu access to a
            smoother path between guest intent and service execution.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {highlights.map((item) => (
              <div
                key={item}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-white/80 px-5 py-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl dark:bg-background/70"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="relative flex items-center gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary shadow-sm">
                    <Check className="h-4 w-4" />
                  </span>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold tracking-tight text-foreground md:text-[15px]">
                      {item}
                    </p>
                    <p className="mt-1 text-xs leading-6 text-muted-foreground">
                      Designed to make restaurant ordering feel faster and cleaner.
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6 h-full">
          <div className="group relative h-full overflow-hidden rounded-[2rem] border bg-muted/20">
            <Image
              src="/about-hero1.webp"
              alt="Modern restaurant using ScanEat digital menu and QR ordering"
              width={1400}
              height={1200}
              priority
              className="h-full min-h-[420px] w-full object-cover md:min-h-[560px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}