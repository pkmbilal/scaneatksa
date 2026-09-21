import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function AboutOperations() {
  const t = await getTranslations("about.operations");
  const items = t.raw("items");

  return (
    <section className="border-y bg-muted/20">
      <div className="mx-auto grid max-w-7xl gap-0 px-6 py-10 md:py-20 md:px-8 lg:grid-cols-2 lg:py-0">
        <div className="flex flex-col justify-center py-0 md:py-6 lg:py-20 lg:pr-16">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
            {t("eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            {t("title")}
          </h2>

          <p className="mt-6 text-base leading-8 text-muted-foreground md:text-lg">
            {t("description")}
          </p>

          <div className="mt-8 space-y-4">
            {items.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <ChevronRight className="mt-1 h-4 w-4 text-emerald-600 rtl:-scale-x-100" />
                <p className="text-sm leading-7 text-muted-foreground md:text-base">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-[2rem] border mt-6 lg:my-16">
          <Image
            src="/about-ops.webp"
            alt="Restaurant operations supported by a digital ordering workflow"
            width={1400}
            height={1200}
            className="h-[360px] w-full object-cover md:h-[520px] lg:h-full"
          />
        </div>
      </div>
    </section>
  );
}
