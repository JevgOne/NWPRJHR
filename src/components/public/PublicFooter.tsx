"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";

export function PublicFooter() {
  const t = useTranslations("public");

  return (
    <footer className="bg-espresso text-nude-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Top: logo + nav + contact in a compact row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/">
              <Image
                src="/logo-dark.svg"
                alt="Hairland"
                width={160}
                height={52}
                className="h-10 w-auto"
              />
            </Link>
            <p className="mt-2 text-xs text-nude-200/60 leading-relaxed max-w-[220px]">
              {t("footer.brandDesc")}
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-[10px] font-semibold text-nude-200/40 uppercase tracking-widest mb-3">
              {t("footer.navTitle")}
            </h3>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link href="/offer" className="text-nude-200/80 hover:text-white transition-colors">
                  {t("nav.products")}
                </Link>
              </li>
              <li>
                <Link href="/poradna" className="text-nude-200/80 hover:text-white transition-colors">
                  {t("navbar.advice")}
                </Link>
              </li>
              <li>
                <Link href="/kadernice" className="text-nude-200/80 hover:text-white transition-colors">
                  {t("footer.hairdressers")}
                </Link>
              </li>
              <li>
                <Link href="/vykup" className="text-nude-200/80 hover:text-white transition-colors">
                  {t("navbar.buyback")}
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-nude-200/80 hover:text-white transition-colors">
                  {t("nav.about")}
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-nude-200/80 hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/pruvodce-gramazi" className="text-nude-200/80 hover:text-white transition-colors">
                  {t("footer.weightGuide")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-[10px] font-semibold text-nude-200/40 uppercase tracking-widest mb-3">
              {t("footer.infoTitle")}
            </h3>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link href="/obchodni-podminky" className="text-nude-200/80 hover:text-white transition-colors">
                  {t("footer.termsLink")}
                </Link>
              </li>
              <li>
                <Link href="/reklamacni-rad" className="text-nude-200/80 hover:text-white transition-colors">
                  {t("footer.complaintsLink")}
                </Link>
              </li>
              <li>
                <Link href="/doprava" className="text-nude-200/80 hover:text-white transition-colors">
                  {t("footer.shippingLink")}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-nude-200/80 hover:text-white transition-colors">
                  {t("nav.privacy")}
                </Link>
              </li>
              <li>
                <Link href="/registrace" className="text-nude-200/80 hover:text-white transition-colors">
                  {t("footer.salonRegLink")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-nude-200/80 hover:text-white transition-colors">
                  {t("nav.contact")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[10px] font-semibold text-nude-200/40 uppercase tracking-widest mb-3">
              {t("nav.contact")}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:info@hairland.cz" className="text-nude-200/80 hover:text-white transition-colors">
                  info@hairland.cz
                </a>
              </li>
              <li>
                <a href="tel:+420608553103" className="text-nude-200/80 hover:text-white transition-colors">
                  +420 608 553 103
                </a>
              </li>
              <li className="flex items-center gap-3 pt-1">
                <a href="https://wa.me/420608553103" target="_blank" rel="noopener noreferrer" className="text-nude-200/60 hover:text-white transition-colors" aria-label="WhatsApp">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
                <a href="https://t.me/+420608553103" target="_blank" rel="noopener noreferrer" className="text-nude-200/60 hover:text-white transition-colors" aria-label="Telegram">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                </a>
                <a href="https://www.instagram.com/hairland.cz/" target="_blank" rel="noopener noreferrer" className="text-nude-200/60 hover:text-white transition-colors" aria-label="Instagram">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-5 border-t border-nude-200/10 flex items-center justify-center text-[11px] text-nude-200/40">
          <span>{t("footer.copyright")}</span>
        </div>
      </div>
    </footer>
  );
}
