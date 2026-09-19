import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ChefHat, Bell, LayoutDashboard, ShieldCheck, Wallet, TrendingUp } from "lucide-react";

// Index-matched to `operations.items` in messages/*/home.json — keep the two in sync.
const icons = [ChefHat, Bell, LayoutDashboard, ShieldCheck];

export default async function OperationsSection() {
  const t = await getTranslations("home.operations");
  const items = t.raw("items");
  const panelStats = t.raw("panel.stats");

  return (
    <section className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
            {t("eyebrow")}
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-slate-600">{t("description")}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {items.map((item, index) => {
            const Icon = icons[index];

            return (
              <div
                key={item.title}
                className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
                  <Icon className="h-7 w-7 text-[#00c951]" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{item.description}</p>
              </div>
            );
          })}
        </div>

        <div className="relative mt-6 min-h-[420px] overflow-hidden rounded-3xl border border-slate-200 shadow-xl md:min-h-[380px]">
          <Image
            src="/about-ops.webp"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/70 to-emerald-950/50" />

          <div className="relative z-10 p-8 text-white md:p-10">
            <div className="mb-8 flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <Wallet className="h-7 w-7 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-300">{t("panel.subtitle")}</p>
                <h3 className="text-2xl font-bold">{t("panel.title")}</h3>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {panelStats.map((stat) => (
                <div
                  key={stat.value}
                  className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md"
                >
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="mt-2 text-slate-300">{stat.text}</p>
                </div>
              ))}
            </div>
          </div>

          {panelStats?.[0] && (
            <div className="absolute -bottom-6 -right-4 z-20 hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-xl lg:block">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <TrendingUp className="h-5 w-5 text-[#00c951]" />
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900">{panelStats[0].value}</div>
                  <p className="text-xs text-slate-500">{panelStats[0].text}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">{t("note")}</p>
      </div>
    </section>
  );
}
