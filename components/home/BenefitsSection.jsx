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

            <div className="relative mt-8 space-y-6">
              <div className="absolute bottom-12 left-6 top-12 w-px bg-slate-200" />

              {items.map((item, index) => {
                const Icon = icons[index];

                return (
                  <div key={item.title} className="relative flex gap-4">
                    <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-emerald-100 bg-white">
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

          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-900 via-slate-900 to-black p-8 text-white shadow-xl">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/25 blur-3xl" />

            <div className="relative mb-8 flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <Pizza className="h-7 w-7 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-300">{t("panel.subtitle")}</p>
                <h3 className="text-2xl font-bold">{t("panel.title")}</h3>
              </div>
            </div>

            <div className="relative divide-y divide-white/10">
              {panelStats.map((stat, index) => (
                <div
                  key={stat.value}
                  className={
                    index === 0
                      ? "pb-4"
                      : "flex items-center justify-between py-4"
                  }
                >
                  {index === 0 ? (
                    <>
                      <div className="text-4xl font-bold">{stat.value}</div>
                      <p className="mt-2 text-slate-300">{stat.text}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-slate-300">{stat.text}</p>
                      <div className="text-xl font-bold">{stat.value}</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
