import Image from "next/image";
import { getTranslations } from "next-intl/server";

export default async function JourneySection({ id, namespace, images, tinted }) {
  const t = await getTranslations(namespace);
  const steps = t.raw("steps");

  return (
    <section
      id={id}
      className={`scroll-mt-20 py-20 md:py-28 ${tinted ? "border-y bg-muted/20" : ""}`}
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
            {t("eyebrow")}
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-slate-600">{t("description")}</p>
        </div>

        <div className="flex flex-col gap-16 md:gap-24">
          {steps.map((step, index) => {
            const image = images[index];
            const reverse = index % 2 === 1;

            return (
              <div
                key={step.title}
                className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14"
              >
                <div
                  className={`group relative overflow-hidden rounded-[2rem] border bg-white shadow-sm lg:col-span-7 ${
                    reverse ? "lg:order-2" : "lg:order-1"
                  }`}
                >
                  {image ? (
                    <Image
                      src={image.src}
                      alt={image.alt}
                      width={1600}
                      height={1200}
                      className="h-[320px] w-full object-cover md:h-[440px]"
                    />
                  ) : (
                    <div className="h-[320px] w-full bg-slate-100 md:h-[440px]" />
                  )}
                </div>

                <div
                  className={`flex flex-col justify-center lg:col-span-5 ${
                    reverse ? "lg:order-1" : "lg:order-2"
                  }`}
                >
                  <span className="text-6xl font-black text-slate-200/80">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                    {step.title.replace(/^\d+\.\s*/, "")}
                  </h3>
                  <p className="mt-4 text-base leading-7 text-slate-600 md:text-lg">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
