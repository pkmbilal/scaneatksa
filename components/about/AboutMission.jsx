import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function AboutMission() {
  const t = await getTranslations("about.mission");

  return (
    <section className="border-t">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:px-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
            {t("eyebrow")}
          </p>
          <h2 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight md:text-4xl">
            {t("title")}
          </h2>
        </div>

        <div className="lg:col-span-5">
          <p className="text-base leading-8 text-muted-foreground md:text-lg">
            {t("description")}
          </p>

          <div className="mt-8">
            <Link
              href="/restaurants"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00c951] px-7 py-4 text-base font-semibold text-white shadow-lg shadow-black/20 transition hover:bg-green-600"
            >
              {t("cta")}
              <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
