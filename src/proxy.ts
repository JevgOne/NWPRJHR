import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import type { NextRequest } from "next/server";

const intlMiddleware = createMiddleware(routing);

export function proxy(request: NextRequest) {
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Match all public paths, but NOT:
    // - api routes, _next/static, _next/image
    // - favicon, icon, sitemap, robots, manifest, sw, icons
    // - login, admin (app) paths, salon portal paths
    "/((?!api|_next/static|_next/image|favicon\\.ico|icon\\.svg|sitemap\\.xml|robots\\.txt|manifest\\.json|sw\\.js|icons/|opengraph-image|login|dashboard|inventory|products|orders|salons|invoices|sales|customers|export|complaints|settings|notifications|audit-log|referrals|promo-codes|posts|reviews|returns|payments|registrations|samples|discounts|finance|inquiries|stylists|suppliers|salon/).*)",
  ],
};
