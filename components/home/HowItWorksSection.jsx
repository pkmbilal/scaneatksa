import { getTranslations } from "next-intl/server";
import { QrCode, NotebookPen, ArrowLeftRight, ArrowRight } from "lucide-react";

const icons = [QrCode, NotebookPen, ArrowLeftRight];

export default async function HowItWorksSection() {
  const t = await getTranslations("home.howItWorks");
  const steps = t.raw("steps");

  return (
    <section id="how-it-works" className="relative overflow-hidden bg-slate-50 py-20">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 animate-blob rounded-full bg-emerald-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-10 h-72 w-72 animate-blob animation-delay-2000 rounded-full bg-emerald-200/30 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
            {t("eyebrow")}
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-slate-600">{t("description")}</p>
        </div>

        <div className="relative grid gap-8 md:grid-cols-3">
          <div className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent md:block" />

          {steps.map((step, index) => {
            const Icon = icons[index];

            return (
              <div key={step.title} className="relative flex flex-col items-center text-center">
                <span className="pointer-events-none absolute -top-6 select-none text-7xl font-black text-slate-200/70">
                  0{index + 1}
                </span>

                <div className="relative z-10 mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md">
                  <Icon size={36} className="text-[#00c951]" />
                </div>
                <h3 className="relative z-10 text-2xl font-bold text-slate-900">{step.title}</h3>
                <p className="relative z-10 mt-3 text-slate-600">{step.description}</p>

                {index < steps.length - 1 && (
                  <ArrowRight className="absolute right-[-1.75rem] top-8 hidden h-6 w-6 text-slate-300 rtl:-scale-x-100 md:block" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
