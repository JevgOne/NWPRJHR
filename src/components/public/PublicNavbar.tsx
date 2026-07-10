"use client";

import { useState, useRef, useEffect } from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { useLocale } from "next-intl";
import { useTransition } from "react";
import type { Locale } from "@/i18n/config";
import { useInquiryCart } from "@/lib/inquiry-cart";
import { signOut } from "next-auth/react";

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

export function PublicNavbar() {
  const t = useTranslations("public");
  const tAuth = useTranslations("auth");
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { itemCount } = useInquiryCart();
  const [session, setSession] = useState<NavSession | null>(null);
  const [scrolled, setScrolled] = useState(false);

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
    { href: "/offer", label: t("nav.products") },
  ];

  const inspiraceItems = [
    { href: "/poradna", label: t("navbar.advice") },
    { href: "/pruvodce-gramazi", label: t("navbar.weightGuide") },
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

  // All links flat for mobile
  const allMobileLinks = [
    ...mainLinks,
    ...cooperationItems,
    ...inspiraceItems,
    ...endLinks,
  ];

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/80 backdrop-blur-xl border-b border-line shadow-sm" : "bg-white border-b border-transparent"}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex-shrink-0 flex items-center gap-2">
            <svg width="36" height="36" viewBox="0 0 230 230" className="flex-shrink-0">
              <circle cx="115" cy="115" r="100" fill="#fdfaf7" stroke="#3a2c2a" strokeWidth="1.6"/>
              <text x="115" y="128" fontFamily="Georgia, serif" fontSize="86" fill="#3a2c2a" textAnchor="middle">H</text>
              <line x1="80" y1="150" x2="150" y2="150" stroke="#dba8a6" strokeWidth="1"/>
            </svg>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold text-ink tracking-widest leading-tight" style={{ fontFamily: "Georgia, serif" }}>
                HAIRLAND
              </span>
              <span className="text-[9px] sm:text-[10px] tracking-[0.2em] text-rose-deep leading-tight">
                PRÉMIOVÉ VLASY
              </span>
            </div>
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

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden text-muted hover:text-ink"
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

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden pb-4 space-y-1">
            {allMobileLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2 text-sm font-medium text-muted hover:text-ink hover:bg-nude-50 rounded-lg"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/inquiry-cart"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted hover:text-ink hover:bg-nude-50 rounded-lg"
              onClick={() => setMenuOpen(false)}
            >
              {t("navbar.inquiry")} {itemCount > 0 && <span className="bg-rose text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{itemCount}</span>}
            </Link>
            <div className="flex items-center gap-2 px-3 py-2">
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
        )}
      </div>
    </nav>
  );
}
