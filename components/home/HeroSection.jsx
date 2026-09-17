import Image from "next/image";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function HeroSection({ data }) {
  const t = await getTranslations("home.hero");
  const points = t.raw("points");

  return (
    <section className="relative isolate flex min-h-[560px] items-center overflow-hidden border-b border-slate-100 py-24 md:min-h-[720px] md:py-32">
      <Image src="/Hero_BG.webp" alt="" fill priority sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-950/70 to-slate-950/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent md:hidden" />

      <div className="relative mx-auto w-full max-w-7xl px-4">
        {/* Pinned to the physical left (not logical start): the photo's open, uncluttered
            area is on that side and its overlay isn't mirrored for RTL, unlike most of this
            page — mirroring would flip the readable "Scaneat" QR-stand artwork backwards. */}
        <div className="mr-auto max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
            {t("badge")}
          </div>

          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl">
            {t("title")}
            <span className="block bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
              {t("highlight")}
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-200 md:text-xl">
            {t("description")}
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href={data.primaryCta.href}
              className="inline-flex items-center justify-center rounded-xl bg-[#00c951] px-7 py-4 text-base font-semibold text-white shadow-lg shadow-black/20 transition hover:bg-green-600"
            >
              {t("primaryCta")}
            </Link>

            <Link
              href={data.secondaryCta.href}
              className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-7 py-4 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              {t("secondaryCta")}
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-200">
            {points.map((point) => (
              <div key={point} className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-emerald-400" />
                {point}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
