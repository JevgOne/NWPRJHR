import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse, type NextRequest } from "next/server";

const intlMiddleware = createMiddleware(routing);

/** Old /offer/<category> URLs → standalone pages (308 permanent redirect) */
const CATEGORY_REDIRECTS: Record<string, string> = {
  "clip-in": "/clip-in",
  "tape-in": "/tape-in",
  "keratin": "/keratin",
  "micro-ring": "/micro-ring",
  "weft": "/tresove-vlasy",
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Strip locale prefix for matching (e.g. /cs/offer/clip-in → /offer/clip-in)
  const stripped = pathname.replace(/^\/(cs|uk|ru)/, "");

  // Redirect old /offer/<category> to standalone URLs
  const offerMatch = stripped.match(/^\/offer\/(clip-in|tape-in|keratin|micro-ring|weft)\/?$/);
  if (offerMatch) {
    const newPath = CATEGORY_REDIRECTS[offerMatch[1]];
    if (newPath) {
      const url = request.nextUrl.clone();
      // Keep locale prefix if present
      const localePrefix = pathname.match(/^\/(cs|uk|ru)/)?.[0] ?? "";
      url.pathname = localePrefix + newPath;
      return NextResponse.redirect(url, 308);
    }
  }

  // Also handle /offer/kategorie/<category>
  const katMatch = stripped.match(/^\/offer\/kategorie\/(clip-in|tape-in|keratin|micro-ring|weft)\/?$/);
  if (katMatch) {
    const newPath = CATEGORY_REDIRECTS[katMatch[1]];
    if (newPath) {
      const url = request.nextUrl.clone();
      const localePrefix = pathname.match(/^\/(cs|uk|ru)/)?.[0] ?? "";
      url.pathname = localePrefix + newPath;
      return NextResponse.redirect(url, 308);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Match all public paths, but NOT:
    // - api routes, _next/static, _next/image
    // - favicon, icon, sitemap, robots, manifest, sw, icons
    // - login, admin (app) paths, salon portal paths
    "/((?!api|_next/static|_next/image|favicon\\.ico|icon\\.svg|logo-.*\\.svg|seal-.*\\.svg|hero-vzornik\\.png|sitemap\\.xml|robots\\.txt|manifest\\.json|sw\\.js|icons/|opengraph-image|login|dashboard|inventory|products|orders|salons|invoices|sales|customers|export|complaints|settings|notifications|audit-log|referrals|promo-codes|posts|reviews|returns|payments|registrations|samples|discounts|finance|inquiries|stylists|suppliers|salon/).*)",
  ],
};
