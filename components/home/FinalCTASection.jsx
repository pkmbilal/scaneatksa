import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Star } from "lucide-react";

export default async function FinalCTASection({ data }) {
  const t = await getTranslations("home.finalCta");

  return (
    <section className="relative overflow-hidden py-20 text-white">
      <Image src="/about-team.webp" alt="" fill sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#00c951]/80 via-emerald-800/70 to-slate-950/75" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
        <div className="mb-4 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 backdrop-blur-sm">
            <Star className="h-5 w-5" />
          </div>
        </div>

        <h2 className="text-3xl font-bold tracking-tight md:text-5xl">{t("title")}</h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/90">
          {t("description")}
        </p>

        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href={data.primaryCta.href}
            className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-base font-bold text-[#00c951] shadow-lg transition hover:bg-slate-100"
          >
            {t("primaryCta")}
          </Link>

          <Link
            href={data.secondaryCta.href}
            className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-8 py-4 text-base font-bold text-white transition hover:bg-white/20"
          >
            {t("secondaryCta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
