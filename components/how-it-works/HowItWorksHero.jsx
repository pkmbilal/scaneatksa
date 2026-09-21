import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { QrCode, LayoutDashboard } from "lucide-react";

export default async function HowItWorksHero() {
  const t = await getTranslations("howItWorks.hero");

  return (
    <section className="relative overflow-hidden border-b bg-slate-50 py-20 md:py-28">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 animate-blob rounded-full bg-emerald-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-10 h-72 w-72 animate-blob animation-delay-2000 rounded-full bg-emerald-200/30 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-4 text-center">
        <div className="mb-6 inline-flex items-center rounded-full border border-emerald-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
          {t("badge")}
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-6xl">
          {t("title")}
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          {t("description")}
        </p>

        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="#diner-journey"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00c951] px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-600"
          >
            <QrCode className="h-4 w-4" />
            {t("dinerCta")}
          </Link>

          <Link
            href="#owner-journey"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-slate-100"
          >
            <LayoutDashboard className="h-4 w-4" />
            {t("ownerCta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
