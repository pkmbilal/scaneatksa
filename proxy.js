import { NextResponse } from "next/server";
import { AR_PREFIX, LOCALE_HEADER, isLocalizedPath, localeHref, stripLocalePrefix } from "@/lib/seo";

const LOCALE_COOKIE = "NEXT_LOCALE";
const COOKIE_OPTIONS = { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" };

// Arabic URLs for public pages (see lib/seo.js):
// - /ar/<public page>  -> rewrite to /<page>, locale passed via LOCALE_HEADER.
// - /ar/<anything else> -> redirect to the unprefixed URL (cookie-localized).
// - /<public page> with an "ar" cookie -> redirect to its /ar URL, so the URL
//   always matches the language shown and shared links keep their language.
export function proxy(request) {
  const { pathname } = request.nextUrl;
  const isArabicUrl = pathname === AR_PREFIX || pathname.startsWith(`${AR_PREFIX}/`);

  if (isArabicUrl) {
    const url = request.nextUrl.clone();
    url.pathname = stripLocalePrefix(pathname);

    let response;
    if (isLocalizedPath(url.pathname)) {
      const headers = new Headers(request.headers);
      headers.set(LOCALE_HEADER, "ar");
      response = NextResponse.rewrite(url, { request: { headers } });
    } else {
      response = NextResponse.redirect(url);
    }
    response.cookies.set(LOCALE_COOKIE, "ar", COOKIE_OPTIONS);
    return response;
  }

  if (request.cookies.get(LOCALE_COOKIE)?.value === "ar" && isLocalizedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = localeHref(pathname, "ar");
    return NextResponse.redirect(url);
  }

  // Unprefixed public pages are always English, whatever the cookie says.
  const headers = new Headers(request.headers);
  headers.set(LOCALE_HEADER, "en");
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    "/",
    "/ar",
    "/ar/:path*",
    "/about",
    "/how-it-works",
    "/contact",
    "/privacy-policy",
    "/restaurants",
    "/menu/:slug",
  ],
};
