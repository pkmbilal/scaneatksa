import { SITE_URL } from "@/lib/seo";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/auth/", "/api/", "/cart", "/qr/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
