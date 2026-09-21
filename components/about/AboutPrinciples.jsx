import { getTranslations } from "next-intl/server";

export default async function AboutPrinciples() {
  const t = await getTranslations("about.principles");
  const items = t.raw("items");

  return (
    <section className="mx-auto max-w-7xl px-6 py-10 md:px-8 lg:py-28">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
          {t("eyebrow")}
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          {t("title")}
        </h2>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.title}
            className="group rounded-[1.75rem] border border-border/60 bg-background p-8 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:bg-emerald-500/[0.04] hover:shadow-lg"
          >
            <div className="mb-8 flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/70 transition-all duration-300 group-hover:scale-125 group-hover:bg-emerald-600" />
              <div className="h-px flex-1 bg-border transition-colors duration-300 group-hover:bg-emerald-500/20" />
            </div>

            <h3 className="text-xl font-semibold tracking-tight transition-colors duration-300 group-hover:text-emerald-600">
              {item.title}
            </h3>

            <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
