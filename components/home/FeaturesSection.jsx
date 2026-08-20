import { getTranslations } from "next-intl/server";
import {
  ScanLine,
  NotebookPen,
  MessageCircleMore,
  Smartphone,
  Languages,
  Store,
} from "lucide-react";

const icons = [ScanLine, NotebookPen, MessageCircleMore, Smartphone, Languages, Store];

export default async function FeaturesSection() {
  const t = await getTranslations("home.features");
  const items = t.raw("items");

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

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {items.map((feature, index) => {
            const Icon = icons[index];

            return (
              <div
                key={feature.title}
                className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
                  <Icon className="h-7 w-7 text-[#00c951]" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{feature.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
