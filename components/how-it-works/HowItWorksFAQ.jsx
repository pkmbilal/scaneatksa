import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";

export default async function HowItWorksFAQ() {
  const t = await getTranslations("howItWorks.faq");
  const items = t.raw("items");

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
            {t("eyebrow")}
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
            {t("title")}
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item, index) => (
            <details
              key={item.question}
              className={`group rounded-2xl border border-slate-200 bg-slate-50 open:border-emerald-200 open:bg-white open:shadow-md ${
                index === items.length - 1 && items.length % 2 === 1
                  ? "md:col-span-2"
                  : ""
              }`}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-6 font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                {item.question}
                <Plus className="h-5 w-5 shrink-0 text-[#00c951] transition-transform duration-300 group-open:rotate-45" />
              </summary>
              <div className="px-6 pb-6 leading-7 text-slate-600 group-open:animate-in group-open:fade-in group-open:slide-in-from-top-1">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
