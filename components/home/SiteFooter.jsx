import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

export default async function SiteFooter({ data }) {
  const t = await getTranslations("home.footer");

  return (
    <footer className="border-t border-slate-200 bg-white pt-14 pb-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <Image src="/logo.svg" alt="ScanEat Logo" width={180} height={50}/>
            </div>

            <p className="max-w-md leading-7 text-slate-600">{t("description")}</p>
          </div>

          <div>
            <h3 className="mb-4 font-bold text-slate-900">{t("quickLinks")}</h3>
            <ul className="space-y-3 text-slate-600">
              {data.productLinks.map((link) => (
                <li key={link.key}>
                  <Link href={link.href} className="transition hover:text-emerald-600">
                    {t(`productLinks.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-bold text-slate-900">{t("company")}</h3>
            <ul className="space-y-3 text-slate-600">
              {data.companyLinks.map((link) => (
                <li key={link.key}>
                  <a href={link.href} className="transition hover:text-emerald-600">
                    {t(`companyLinks.${link.key}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6 text-center text-sm text-slate-500">
          <p>{t("copyright", { year: new Date().getFullYear() })}</p>
          <p className="mt-2">
            {t("designedBy")}{" "}
            <a
              href="https://codesudio.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium transition hover:text-emerald-600"
            >
              codesudio
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
