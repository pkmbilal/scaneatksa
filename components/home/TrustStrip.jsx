import { getTranslations } from "next-intl/server";
import { Zap, Rocket, Headset, Store } from "lucide-react";

const icons = [Zap, Rocket, Headset, Store];

export default async function TrustStrip({ restaurantCount }) {
  const t = await getTranslations("home.trustStrip");
  const stats = t.raw("stats");

  return (
    <section className="relative bg-white py-8">
      <div className="relative z-10 mx-auto -mt-10 max-w-6xl rounded-3xl border border-slate-100 bg-white px-6 py-8 shadow-2xl md:-mt-24 md:px-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              {t("eyebrow")}
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{t("title")}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((stat, index) => {
              const Icon = icons[index];

              return (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-5 text-center transition hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                    <Icon className="h-4 w-4 text-[#00c951]" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                </div>
              );
            })}

            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-5 text-center transition hover:-translate-y-0.5 hover:shadow-sm">
              <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                <Store className="h-4 w-4 text-[#00c951]" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{restaurantCount}+</div>
              <div className="text-sm text-slate-500">{t("activeListings")}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
