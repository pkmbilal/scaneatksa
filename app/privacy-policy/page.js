import SiteFooter from "@/components/home/SiteFooter";
import { footerData } from "@/lib/siteData";
import { sections } from "@/lib/siteData";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | ScanEat",
  description:
    "Learn how ScanEat collects, uses, stores, and protects personal data for restaurant QR menu and ordering services.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="border-b bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-16 md:px-6 md:py-20">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Legal
          </p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
            This Privacy Policy explains how ScanEat collects, uses, shares,
            and protects personal data across its website, QR menu system, and
            restaurant ordering services.
          </p>
          <p className="mt-4 text-sm text-slate-500">
            Last Updated: March 16, 2026
          </p>

          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
          <div className="space-y-10">
            {sections.map((section) => (
              <article
                key={section.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
              >
                <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
                  {section.title}
                </h2>
                <div className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700 md:text-base">
                  {section.content}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter data={footerData} />
    </main>
  );
}