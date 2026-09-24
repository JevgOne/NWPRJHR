import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse, type NextRequest } from "next/server";

const intlMiddleware = createMiddleware(routing);

/**
 * Build a map of Czech pathname → localized pathname per locale prefix.
 * Used to issue 308 (permanent) redirects instead of next-intl's default 307.
 * Example: /ua/poradna → /ua/консультація (308)
 */
const LOCALE_PREFIX_TO_CODE: Record<string, "uk" | "ru"> = {
  "/ua": "uk",
  "/rus": "ru",
};

type PathnameEntry = string | Record<string, string>;

function buildLocalizedPaths() {
  const map = new Map<string, Map<string, string>>(); // localePrefix → (czPath → localizedPath)
  const pathnames = routing.pathnames as Record<string, PathnameEntry> | undefined;
  if (!pathnames) return map;

  for (const [localePrefix, localeCode] of Object.entries(LOCALE_PREFIX_TO_CODE)) {
    const localeMap = new Map<string, string>();
    for (const [key, value] of Object.entries(pathnames)) {
      if (typeof value === "string") continue; // same for all locales (e.g. /faq)
      const csPath = value.cs;
      const localizedPath = value[localeCode];
      if (!csPath || !localizedPath || csPath === localizedPath) continue;
      // Only static segments (no [param] patterns) — dynamic routes are rewritten, not redirected
      if (csPath.includes("[")) continue;
      localeMap.set(csPath, localizedPath);
    }
    map.set(localePrefix, localeMap);
  }
  return map;
}

const LOCALIZED_PATHS = buildLocalizedPaths();

/** Old /<category> URLs from product listing → standalone pages (308 permanent redirect) */
const CATEGORY_REDIRECTS: Record<string, string> = {
  "clip-in": "/clip-in-vlasy",
  "tape-in": "/tape-in-vlasy",
  "keratin": "/keratinove-vlasy",
  "micro-ring": "/micro-ring-vlasy",
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
  "/messages",
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
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  // Strip locale prefix for matching (e.g. /ua/vlasy-k-prodlouzeni → /vlasy-k-prodlouzeni)
  // Locale prefixes from routing: cs = none (default), uk = /ua, ru = /rus
  const stripped = pathname.replace(/^\/(ua|rus)/, "");

  // 301 redirects: old English folder names → new Czech names (for locale-prefixed URLs;
  // non-prefixed redirects are handled by next.config.ts redirects).
  // When locale prefix is present, redirect directly to localized (cyrillic) path to avoid chain.
  const RENAMED_PATHS: Record<string, string> = {
    "/contact": "/kontakt",
    "/about": "/o-nas",
    "/privacy": "/ochrana-udaju",
    "/checkout": "/pokladna",
    "/wishlist": "/oblibene",
    "/inquiry-cart": "/poptavka",
  };
  const renamedTarget = RENAMED_PATHS[stripped];
  if (renamedTarget) {
    const localePrefix = pathname.match(/^\/(ua|rus)/)?.[0] ?? "";
    if (localePrefix) {
      const url = request.nextUrl.clone();
      // Resolve directly to cyrillic path if available (avoid redirect chain)
      const localeMap = LOCALIZED_PATHS.get(localePrefix);
      const finalPath = localeMap?.get(renamedTarget) ?? renamedTarget;
      url.pathname = localePrefix + finalPath;
      return NextResponse.redirect(url, 301);
    }
  }

  // 301 redirect: old /offer URLs → /vlasy-k-prodlouzeni (strip query strings)
  if (stripped.startsWith("/offer")) {
    const newPath = stripped.replace("/offer", "/vlasy-k-prodlouzeni");
    const localePrefix = pathname.match(/^\/(ua|rus)/)?.[0] ?? "";
    return NextResponse.redirect(
      new URL(`${localePrefix}${newPath}`, request.url),
      301,
    );
  }

  // Redirect old /vlasy-k-prodlouzeni/<category> to standalone URLs
  const categoryMatch = stripped.match(/^\/vlasy-k-prodlouzeni\/(clip-in|tape-in|keratin|micro-ring|weft)\/?$/);
  if (categoryMatch) {
    const newPath = CATEGORY_REDIRECTS[categoryMatch[1]];
    if (newPath) {
      const url = request.nextUrl.clone();
      const localePrefix = pathname.match(/^\/(ua|rus)/)?.[0] ?? "";
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
      const localePrefix = pathname.match(/^\/(ua|rus)/)?.[0] ?? "";
      url.pathname = localePrefix + newPath;
      return NextResponse.redirect(url, 308);
    }
  }

  // 308 permanent redirect: Czech pathname on non-cs locale → localized (cyrillic) pathname
  // next-intl does this as 307 (temporary); we override with 308 for SEO
  const localePrefixMatch = pathname.match(/^\/(ua|rus)/);
  if (localePrefixMatch) {
    const localePrefix = "/" + localePrefixMatch[1];
    const pathAfterPrefix = pathname.slice(localePrefix.length) || "/";
    const localeMap = LOCALIZED_PATHS.get(localePrefix);
    if (localeMap) {
      const localizedPath = localeMap.get(pathAfterPrefix);
      if (localizedPath) {
        const url = request.nextUrl.clone();
        url.pathname = localePrefix + localizedPath;
        return NextResponse.redirect(url, 308);
      }
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Public paths: intl routing + redirects (excludes static assets, api, login)
    "/((?!api|feed|_next/static|_next/image|.*\\.(?:png|jpg|jpeg|svg|webp|ico|gif|woff2?|ttf|eot|mp4|webm)$|og/|sitemap\\.xml|robots\\.txt|llms\\.txt|llms-full\\.txt|manifest\\.json|sw\\.js|icons/|fonts/|images/|swatches/|opengraph-image|login|dashboard|inventory|products|orders|salons|invoices|sales|customers|export|complaints|settings|notifications|audit-log|referrals|promo-codes|posts|reviews|returns|payments|registrations|samples|discounts|finance|inquiries|stylists|suppliers|salon|reservations|calendar|messages/).*)",
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
    "/messages/:path*",
  ],
};
