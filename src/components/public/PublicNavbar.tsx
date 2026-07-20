"use client";

import { useState, useRef, useEffect } from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { useLocale } from "next-intl";
import { useTransition } from "react";
import type { Locale } from "@/i18n/config";
import { useInquiryCart } from "@/lib/inquiry-cart";
import { useWishlist } from "@/lib/wishlist";
import { signOut } from "next-auth/react";
import { SearchOverlay } from "@/components/public/SearchOverlay";

interface NavSession {
  user?: { name?: string; role?: string };
}

const LOCALES = [
  { code: "cs" as Locale, flag: "🇨🇿", label: "CZ" },
  { code: "uk" as Locale, flag: "🇺🇦", label: "UA" },
  { code: "ru" as Locale, flag: "🇷🇺", label: "RU" },
];

function MobileLocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  return (
    <div className={`flex gap-1 ${isPending ? "opacity-50" : ""}`}>
      {LOCALES.map(({ code, flag, label }) => (
        <button
          key={code}
          onClick={() => {
            if (code !== locale) startTransition(() => router.replace(pathname, { locale: code }));
          }}
          disabled={isPending}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
            locale === code
              ? "bg-blush-100 text-rose-deep font-medium"
              : "text-muted hover:bg-nude-50"
          }`}
        >
          <span className="text-base">{flag}</span>
          {label}
        </button>
      ))}
    </div>
  );
}

function NavDropdown({
  label,
  items,
  pathname,
}: {
  label: string;
  items: { href: string; label: string }[];
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isActive = items.some((item) => pathname.startsWith(item.href));

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`text-sm font-medium transition-colors flex items-center gap-1 ${
          isActive ? "text-rose" : "text-muted hover:text-ink"
        }`}
      >
        {label}
        <svg className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl border border-line shadow-lg py-1 z-50">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block px-4 py-2 text-sm transition-colors ${
                pathname.startsWith(item.href)
                  ? "text-rose bg-blush-100/50"
                  : "text-muted hover:text-ink hover:bg-nude-50"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function MobileAccordion({
  label,
  items,
  pathname,
  onNavigate,
}: {
  label: string;
  items: { href: string; label: string }[];
  pathname: string;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const isActive = items.some((item) => pathname.startsWith(item.href));

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
          isActive ? "text-rose bg-blush-100/50" : "text-ink hover:bg-nude-50"
        }`}
      >
        {label}
        <svg className={`w-4 h-4 text-muted transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="ml-3 border-l-2 border-nude-200 pl-3 mt-1 space-y-0.5">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                pathname.startsWith(item.href)
                  ? "text-rose font-medium"
                  : "text-muted hover:text-ink hover:bg-nude-50"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function PublicNavbar() {
  const t = useTranslations("public");
  const tAuth = useTranslations("auth");
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { itemCount } = useInquiryCart();
  const { count: wishlistCount } = useWishlist();
  const [session, setSession] = useState<NavSession | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user) setSession(data);
      })
      .catch(() => {});
  }, []);

  const isLoggedIn = !!session?.user;
  const isSalonOrHairdresser =
    session?.user?.role === "SALON" || session?.user?.role === "HAIRDRESSER";
  const isStaff =
    session?.user?.role === "OWNER" || session?.user?.role === "EMPLOYEE";
  const portalHref = isSalonOrHairdresser ? "/salon" : isStaff ? "/dashboard" : "/login";

  const mainLinks = [
    { href: "/", label: t("nav.home") },
  ];

  const offerItems = [
    { href: "/offer", label: t("navbar.hair") },
    { href: "/ofiny", label: t("navbar.bangs") },
    { href: "/prislusenstvi", label: t("nav.accessories") },
  ];

  const inspiraceItems = [
    { href: "/poradna", label: t("navbar.advice") },
    { href: "/pruvodce-gramazi", label: t("navbar.weightGuide") },
    { href: "/recenze", label: t("navbar.reviews") },
    { href: "/blog", label: "Blog" },
  ];

  const cooperationItems = [
    { href: "/pro", label: t("navbar.pro") },
    { href: "/kadernice", label: t("navbar.hairdressers") },
    { href: "/vykup", label: t("navbar.buyback") },
    { href: "/registrace", label: t("navbar.register") },
  ];

  const endLinks = [
    { href: "/contact", label: t("nav.contact") },
    { href: "/about", label: t("nav.about") },
  ];


  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/80 backdrop-blur-xl border-b border-line shadow-sm" : "bg-white border-b border-transparent"}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex-shrink-0 flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-light.svg"
              alt="Hairland"
              className="h-9 w-auto"
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-5">
            {mainLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive ? "text-rose" : "text-muted hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            <NavDropdown
              label={t("nav.products")}
              items={offerItems}
              pathname={pathname}
            />

            <NavDropdown
              label={t("navbar.cooperation")}
              items={cooperationItems}
              pathname={pathname}
            />

            <NavDropdown
              label={t("navbar.inspiration")}
              items={inspiraceItems}
              pathname={pathname}
            />

            {endLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive ? "text-rose" : "text-muted hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            <button
              onClick={() => setSearchOpen(true)}
              className="p-1.5 text-muted hover:text-rose transition-colors"
              aria-label={t("offer.searchPlaceholder")}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <Link href="/wishlist" className="relative p-1.5 text-muted hover:text-rose transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-rose text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link href="/inquiry-cart" className="relative p-1.5 text-muted hover:text-rose transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-rose text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
            <LocaleSwitcher />
            {isLoggedIn ? (
              <div className="ml-2 flex items-center gap-1">
                <Link
                  href={portalHref}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-espresso bg-nude-100 rounded-l-lg hover:bg-nude-200 transition-colors"
                >
                  <span>{session.user?.name ?? tAuth("loginButton")}</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="px-3 py-2 text-sm text-muted bg-nude-100 rounded-r-lg hover:bg-red-50 hover:text-red-600 transition-colors border-l border-line"
                  title={tAuth("logout")}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="ml-2 px-4 py-2 text-sm font-medium text-white bg-rose rounded-lg hover:bg-rose-deep transition-colors"
              >
                {tAuth("loginButton")}
              </Link>
            )}
          </div>

          {/* Mobile icons + hamburger */}
          <div className="flex items-center gap-1 lg:hidden">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-muted hover:text-rose transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <Link href="/wishlist" className="relative p-2 text-muted hover:text-rose transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {wishlistCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-rose text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">{wishlistCount}</span>
              )}
            </Link>
            <Link href="/inquiry-cart" className="relative p-2 text-muted hover:text-rose transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-rose text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">{itemCount}</span>
              )}
            </Link>
            {!isLoggedIn && (
              <Link href="/registrace" className="p-2 text-muted hover:text-rose transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </Link>
            )}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-muted hover:text-ink"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden pb-4">
            {/* Navigation links */}
            <div className="space-y-0.5">
              {/* Nabidka — primo link */}
              <Link
                href="/offer"
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  pathname.startsWith("/offer") ? "text-rose bg-blush-100/50" : "text-ink hover:bg-nude-50"
                }`}
              >
                {t("navbar.hair")}
              </Link>

              {/* Ofiny + Prislusenstvi — primo linky */}
              <Link
                href="/ofiny"
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  pathname.startsWith("/ofiny") ? "text-rose bg-blush-100/50" : "text-ink hover:bg-nude-50"
                }`}
              >
                {t("navbar.bangs")}
              </Link>
              <Link
                href="/prislusenstvi"
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  pathname.startsWith("/prislusenstvi") ? "text-rose bg-blush-100/50" : "text-ink hover:bg-nude-50"
                }`}
              >
                {t("nav.accessories")}
              </Link>

              {/* Spoluprace — accordion */}
              <MobileAccordion
                label={t("navbar.cooperation")}
                items={cooperationItems}
                pathname={pathname}
                onNavigate={() => setMenuOpen(false)}
              />

              {/* Inspirace — accordion */}
              <MobileAccordion
                label={t("navbar.inspiration")}
                items={inspiraceItems}
                pathname={pathname}
                onNavigate={() => setMenuOpen(false)}
              />

              {/* Kontakt — primo link */}
              <Link
                href="/contact"
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  pathname.startsWith("/contact") ? "text-rose bg-blush-100/50" : "text-ink hover:bg-nude-50"
                }`}
              >
                {t("nav.contact")}
              </Link>
            </div>

            {/* Language + Auth — bottom section */}
            <div className="mt-3 pt-3 border-t border-line space-y-2">
              <div className="flex items-center gap-2 px-3">
                <MobileLocaleSwitcher />
              </div>
              {isLoggedIn ? (
                <div className="mx-3 flex gap-2">
                  <Link
                    href={portalHref}
                    className="flex-1 px-4 py-2 text-sm font-medium text-center text-espresso bg-nude-100 rounded-lg hover:bg-nude-200"
                    onClick={() => setMenuOpen(false)}
                  >
                    {session.user?.name ?? tAuth("loginButton")}
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    {tAuth("logout")}
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="block mx-3 px-4 py-2 text-sm font-medium text-center text-white bg-rose rounded-lg hover:bg-rose-deep"
                  onClick={() => setMenuOpen(false)}
                >
                  {tAuth("loginButton")}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </nav>
  );
}
