import Image from "next/image";
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
    <section className="bg-white py-20">
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

        <div className="relative mb-12 h-56 w-full overflow-hidden rounded-3xl border border-slate-200 md:h-72">
          <Image
            src="/about-product.webp"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/0 to-transparent" />
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
