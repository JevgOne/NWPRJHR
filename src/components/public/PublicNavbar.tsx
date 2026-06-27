"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { useLocale } from "next-intl";
import { useTransition } from "react";
import { setUserLocale } from "@/i18n/locale";
import type { Locale } from "@/i18n/config";
import { useInquiryCart } from "@/lib/inquiry-cart";

const LOCALES = [
  { code: "cs" as Locale, flag: "🇨🇿", label: "CZ" },
  { code: "uk" as Locale, flag: "🇺🇦", label: "UA" },
  { code: "ru" as Locale, flag: "🇷🇺", label: "RU" },
];

function MobileLocaleSwitcher() {
  const locale = useLocale() as Locale;
  const [isPending, startTransition] = useTransition();

  return (
    <div className={`flex gap-1 ${isPending ? "opacity-50" : ""}`}>
      {LOCALES.map(({ code, flag, label }) => (
        <button
          key={code}
          onClick={() => {
            if (code !== locale) startTransition(() => setUserLocale(code));
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

export function PublicNavbar() {
  const t = useTranslations("public");
  const tAuth = useTranslations("auth");
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { itemCount } = useInquiryCart();

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/offer", label: t("nav.products") },
    { href: "/kadernice", label: t("navbar.hairdressers") },
    { href: "/pro", label: t("navbar.pro") },
    { href: "/contact", label: t("nav.contact") },
    { href: "/about", label: t("nav.about") },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-line shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex-shrink-0 flex items-center gap-2">
            {/* H seal icon — always visible */}
            <svg width="36" height="36" viewBox="0 0 230 230" className="flex-shrink-0">
              <circle cx="115" cy="115" r="100" fill="#fdfaf7" stroke="#3a2c2a" strokeWidth="1.6"/>
              <text x="115" y="128" fontFamily="Georgia, serif" fontSize="86" fill="#3a2c2a" textAnchor="middle">H</text>
              <line x1="80" y1="150" x2="150" y2="150" stroke="#dba8a6" strokeWidth="1"/>
            </svg>
            {/* "HAIRLAND" text — hidden on small screens */}
            <span className="hidden sm:block text-lg font-bold text-ink tracking-widest" style={{ fontFamily: "Georgia, serif" }}>
              HAIRLAND
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-5">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive
                      ? "text-rose"
                      : "text-muted hover:text-ink"
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
            <Link
              href="/login"
              className="ml-2 px-4 py-2 text-sm font-medium text-white bg-rose rounded-lg hover:bg-rose-deep transition-colors"
            >
              {tAuth("loginButton")}
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden text-muted hover:text-ink"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden pb-4 space-y-2">
            {navLinks.map((link) => (
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
            <Link
              href="/login"
              className="block mx-3 px-4 py-2 text-sm font-medium text-center text-white bg-rose rounded-lg hover:bg-rose-deep"
              onClick={() => setMenuOpen(false)}
            >
              {tAuth("loginButton")}
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
