"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function PublicFooter() {
  const t = useTranslations("public");

  return (
    <footer className="bg-espresso text-nude-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <span className="text-2xl font-bold text-white tracking-tight">Hairland</span>
            <p className="mt-3 text-sm text-nude-200/80 leading-relaxed">
              Prémiové vlasy k prodloužení pro profesionální salony. Přímý import, osobní přístup.
            </p>
            <div className="flex gap-2 mt-4 text-2xl">
              <span>🇨🇿</span><span>🇺🇦</span><span>🇷🇺</span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-xs font-semibold text-gold uppercase tracking-wider mb-4">
              Navigace
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  {t("nav.home")}
                </Link>
              </li>
              <li>
                <Link href="/offer" className="hover:text-white transition-colors">
                  {t("nav.products")}
                </Link>
              </li>
              <li>
                <Link href="/kadernice" className="hover:text-white transition-colors">
                  Kadeřnice
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  {t("nav.about")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  {t("nav.contact")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-semibold text-gold uppercase tracking-wider mb-4">
              Informace
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/obchodni-podminky" className="hover:text-white transition-colors">
                  Obchodní podmínky
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  {t("nav.privacy")}
                </Link>
              </li>
              <li>
                <Link href="/registrace" className="hover:text-white transition-colors">
                  Registrace salonu
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  {t("nav.login")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-semibold text-gold uppercase tracking-wider mb-4">
              {t("nav.contact")}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2">
                <span>✉️</span>
                <a href="mailto:info@hairland.cz" className="hover:text-white transition-colors">
                  info@hairland.cz
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span>📍</span>
                <span>Praha, Česká republika</span>
              </li>
              <li className="flex items-center gap-2">
                <span>🏢</span>
                <span className="text-xs text-nude-200/60">Alvento Solutions s.r.o.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-mauve/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-nude-200/50">
            {t("footer.copyright")}
          </p>
          <p className="text-xs text-nude-200/40">
            Prémiové vlasy k prodloužení — clip-in, tape-in, micro ring, keratin
          </p>
        </div>
      </div>
    </footer>
  );
}
