import Image from "next/image";
import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function AboutHero() {
  const t = await getTranslations("about.hero");
  const highlights = t.raw("highlights");

  return (
    <section className="border-b">
      <div className="mx-auto grid max-w-7xl items-stretch gap-14 px-6 py-10 md:py-20 md:px-8 lg:grid-cols-12 lg:gap-10 lg:py-28">
        <div className="flex h-full flex-col justify-center lg:col-span-6">
          <div className="mb-6 inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
            {t("eyebrow")}
          </div>

          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">
            {t("title")}
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
            {t("description")}
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-white/80 px-5 py-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl dark:bg-background/70"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.05] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="relative flex items-center gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600 shadow-sm">
                    <Check className="h-4 w-4" />
                  </span>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold tracking-tight text-foreground md:text-[15px]">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs leading-6 text-muted-foreground">
                      {item.caption}
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
