import { getTranslations } from "next-intl/server";

export default async function AboutPositioning() {
  const t = await getTranslations("about.positioning");

  return (
    <section className="border-b">
      <div className="mx-auto max-w-7xl px-6 py-10 md:py-14 md:px-8">
        <div className="grid gap-6 md:gap-10 md:grid-cols-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
              {t("eyebrow")}
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              {t("title")}
            </h2>
          </div>

          <div className="md:col-span-2">
            <p className="max-w-4xl text-base leading-8 text-muted-foreground md:text-lg">
              {t("description")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
