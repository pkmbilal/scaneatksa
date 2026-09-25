import Link from "@/components/LocaleLink";
import { getTranslations } from "next-intl/server";

export default async function RestaurantNotFound() {
  const t = await getTranslations("menu");

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold">{t("notFound.title")}</h1>
      <p className="text-muted-foreground mt-2">
        {t("notFound.subtitle")}
      </p>
      <Link href="/restaurants" className="underline mt-4 inline-block">
        {t("notFound.backLink")}
      </Link>
    </div>
  );
}
