"use client";

import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";

export function PublicFooter() {
  const t = useTranslations("public");

  return (
    <footer className="bg-espresso text-nude-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Brand + contact row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-6">
          <div>
            <Link href="/">
              <Image
                src="/logo-dark.svg"
                alt="Hairland"
                width={160}
                height={52}
                className="h-8 sm:h-10 w-auto"
                unoptimized
              />
            </Link>
            <p className="mt-2 text-[11px] text-nude-200/50 leading-relaxed max-w-[220px]">
              {t("footer.brandDesc")}
            </p>
          </div>

          {/* Contact — always visible, compact */}
          <div className="flex flex-col items-start sm:items-end gap-1.5">
            <a href="mailto:info@hairland.cz" className="text-sm text-nude-200/70 hover:text-white transition-colors">
              info@hairland.cz
            </a>
            <a href="tel:+420608553103" className="text-sm text-nude-200/70 hover:text-white transition-colors">
              +420 608 553 103
            </a>
            <div className="flex items-center gap-3 mt-1">
              <a href="https://wa.me/420608553103" target="_blank" rel="noopener noreferrer" className="text-nude-200/50 hover:text-white transition-colors" aria-label="WhatsApp">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
              <a href="https://t.me/+420608553103" target="_blank" rel="noopener noreferrer" className="text-nude-200/50 hover:text-white transition-colors" aria-label="Telegram">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </a>
              <a href="https://www.instagram.com/hairland.cz/" target="_blank" rel="noopener noreferrer" className="text-nude-200/50 hover:text-white transition-colors" aria-label="Instagram">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
              </a>
              <a href="https://www.facebook.com/profile.php?id=61591480246246" target="_blank" rel="noopener noreferrer" className="text-nude-200/50 hover:text-white transition-colors" aria-label="Facebook">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
            </div>
          </div>
        </div>

        {/* Links — 2 columns on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 text-[12px] py-4 border-t border-nude-200/10">
          <Link href="/offer" className="text-nude-200/60 hover:text-white transition-colors py-0.5">{t("nav.products")}</Link>
          <Link href="/obchodni-podminky" className="text-nude-200/60 hover:text-white transition-colors py-0.5">{t("footer.termsLink")}</Link>
          <Link href="/poradna" className="text-nude-200/60 hover:text-white transition-colors py-0.5">{t("navbar.advice")}</Link>
          <Link href="/reklamacni-rad" className="text-nude-200/60 hover:text-white transition-colors py-0.5">{t("footer.complaintsLink")}</Link>
          <Link href="/kadernice" className="text-nude-200/60 hover:text-white transition-colors py-0.5">{t("footer.hairdressers")}</Link>
          <Link href="/doprava" className="text-nude-200/60 hover:text-white transition-colors py-0.5">{t("footer.shippingLink")}</Link>
          <Link href="/vykup" className="text-nude-200/60 hover:text-white transition-colors py-0.5">{t("navbar.buyback")}</Link>
          <Link href="/privacy" className="text-nude-200/60 hover:text-white transition-colors py-0.5">{t("nav.privacy")}</Link>
          <Link href="/about" className="text-nude-200/60 hover:text-white transition-colors py-0.5">{t("nav.about")}</Link>
          <Link href="/registrace" className="text-nude-200/60 hover:text-white transition-colors py-0.5">{t("footer.salonRegLink")}</Link>
          <Link href="/blog" className="text-nude-200/60 hover:text-white transition-colors py-0.5">Blog</Link>
          <Link href="/contact" className="text-nude-200/60 hover:text-white transition-colors py-0.5">{t("nav.contact")}</Link>
        </div>

        {/* Copyright */}
        <div className="pt-4 border-t border-nude-200/10 text-center text-[10px] text-nude-200/30">
          {t("footer.copyright")}
        </div>
      </div>
    </footer>
  );
}
