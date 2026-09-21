import { getTranslations } from "next-intl/server";

export default async function AboutStory() {
  const t = await getTranslations("about.story");
  const paragraphs = t.raw("paragraphs");

  return (
    <section className="mx-auto max-w-7xl px-6 py-10 md:py-20 md:px-8 lg:py-28">
      <div className="grid items-start gap-6 md:gap-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
            {t("eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            {t("title")}
          </h2>
        </div>

        <div className="space-y-6 text-base leading-8 text-muted-foreground md:text-lg lg:col-span-7">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
