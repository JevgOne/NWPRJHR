import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse, type NextRequest } from "next/server";

const intlMiddleware = createMiddleware(routing);

/** Old /<category> URLs from product listing → standalone pages (308 permanent redirect) */
const CATEGORY_REDIRECTS: Record<string, string> = {
  "clip-in": "/clip-in",
  "tape-in": "/tape-in",
  "keratin": "/keratin",
  "micro-ring": "/micro-ring",
  "weft": "/tresove-vlasy",
};

/** Admin/app route prefixes that require authentication */
const PROTECTED_PREFIXES = [
  "/dashboard", "/inventory", "/products", "/orders", "/salons",
  "/invoices", "/sales", "/customers", "/export", "/complaints",
  "/settings", "/notifications", "/audit-log", "/referrals",
  "/promo-codes", "/posts", "/reviews", "/returns", "/payments",
  "/registrations", "/samples", "/discounts", "/finance",
  "/inquiries", "/stylists", "/suppliers", "/salon",
  "/reservations",
  "/calendar",
  "/order-products",
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

function hasSessionToken(request: NextRequest): boolean {
  return (
    request.cookies.has("__Secure-authjs.session-token") ||
    request.cookies.has("authjs.session-token")
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth guard for admin/app routes
  if (isProtectedPath(pathname)) {
    if (!hasSessionToken(request)) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("callbackUrl", pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Strip locale prefix for matching (e.g. /cs/vlasy-k-prodlouzeni/clip-in → /vlasy-k-prodlouzeni/clip-in)
  const stripped = pathname.replace(/^\/(cs|uk|ru)/, "");

  // 301 redirect: old /offer URLs → /vlasy-k-prodlouzeni
  if (stripped.startsWith("/offer")) {
    const newPath = stripped.replace("/offer", "/vlasy-k-prodlouzeni");
    const localePrefix = pathname.match(/^\/(cs|uk|ru)/)?.[0] ?? "";
    return NextResponse.redirect(
      new URL(`${localePrefix}${newPath}${request.nextUrl.search}`, request.url),
      301,
    );
  }

  // Redirect old /vlasy-k-prodlouzeni/<category> to standalone URLs
  const categoryMatch = stripped.match(/^\/vlasy-k-prodlouzeni\/(clip-in|tape-in|keratin|micro-ring|weft)\/?$/);
  if (categoryMatch) {
    const newPath = CATEGORY_REDIRECTS[categoryMatch[1]];
    if (newPath) {
      const url = request.nextUrl.clone();
      const localePrefix = pathname.match(/^\/(cs|uk|ru)/)?.[0] ?? "";
      url.pathname = localePrefix + newPath;
      return NextResponse.redirect(url, 308);
    }
  }

  // Also handle /vlasy-k-prodlouzeni/kategorie/<category>
  const katMatch = stripped.match(/^\/vlasy-k-prodlouzeni\/kategorie\/(clip-in|tape-in|keratin|micro-ring|weft)\/?$/);
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
    // Public paths: intl routing + redirects (excludes static assets, api, login)
    "/((?!api|feed|_next/static|_next/image|.*\\.(?:png|jpg|jpeg|svg|webp|ico|gif|woff2?|ttf|eot|mp4|webm)$|og/|sitemap\\.xml|robots\\.txt|manifest\\.json|sw\\.js|icons/|fonts/|images/|swatches/|opengraph-image|login|dashboard|inventory|products|orders|salons|invoices|sales|customers|export|complaints|settings|notifications|audit-log|referrals|promo-codes|posts|reviews|returns|payments|registrations|samples|discounts|finance|inquiries|stylists|suppliers|salon|reservations|calendar/).*)",
    // Protected admin/app paths: auth guard
    "/dashboard/:path*",
    "/inventory/:path*",
    "/products/:path*",
    "/orders/:path*",
    "/salons/:path*",
    "/invoices/:path*",
    "/sales/:path*",
    "/customers/:path*",
    "/export/:path*",
    "/complaints/:path*",
    "/settings/:path*",
    "/notifications/:path*",
    "/audit-log/:path*",
    "/referrals/:path*",
    "/promo-codes/:path*",
    "/posts/:path*",
    "/reviews/:path*",
    "/returns/:path*",
    "/payments/:path*",
    "/registrations/:path*",
    "/samples/:path*",
    "/discounts/:path*",
    "/finance/:path*",
    "/inquiries/:path*",
    "/stylists/:path*",
    "/suppliers/:path*",
    "/salon/:path*",
    "/reservations/:path*",
    "/calendar/:path*",
  ],
};
