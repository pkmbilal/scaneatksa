import { getTranslations } from "next-intl/server";
import { Pizza, Clock3, Wallet, BadgeCheck } from "lucide-react";

const icons = [Clock3, Wallet, BadgeCheck];

export default async function BenefitsSection() {
  const t = await getTranslations("home.benefits");
  const items = t.raw("items");
  const panelStats = t.raw("panel.stats");

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
              {t("eyebrow")}
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
              {t("title")}
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">{t("description")}</p>

            <div className="mt-8 space-y-5">
              {items.map((item, index) => {
                const Icon = icons[index];

                return (
                  <div key={item.title} className="flex gap-4 rounded-2xl bg-slate-50 p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                      <Icon className="h-6 w-6 text-[#00c951]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                      <p className="mt-1 text-slate-600">{item.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white shadow-xl">
            <div className="mb-8 flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <Pizza className="h-7 w-7 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-300">{t("panel.subtitle")}</p>
                <h3 className="text-2xl font-bold">{t("panel.title")}</h3>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {panelStats.map((stat) => (
                <div key={stat.value} className="rounded-2xl bg-white/5 p-5">
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <p className="mt-2 text-slate-300">{stat.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
