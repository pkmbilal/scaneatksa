import Image from "next/image";
import { getTranslations } from "next-intl/server";

export default async function AboutProductView() {
  const t = await getTranslations("about.productView");

  return (
    <section className="mx-auto max-w-7xl px-6 pb-20 md:px-8 lg:pb-28">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="group relative overflow-hidden rounded-[2rem] border lg:col-span-7">
          <Image
            src="/about-product.webp"
            alt="ScanEat product interface for digital menus and ordering"
            width={1600}
            height={1200}
            className="h-[380px] w-full object-cover md:h-[520px]"
          />
        </div>

        <div className="flex flex-col justify-center lg:col-span-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
            {t("eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            {t("title")}
          </h2>
          <p className="mt-6 text-base leading-8 text-muted-foreground md:text-lg">
            {t("description")}
          </p>
        </div>
      </div>
    </section>
  );
}
