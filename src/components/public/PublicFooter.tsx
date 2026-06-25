"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function PublicFooter() {
  const t = useTranslations("public");

  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <span className="text-xl font-bold text-white">Hairland</span>
            <p className="mt-2 text-sm">{t("heroSubtitle")}</p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">
              {t("nav.home")}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  {t("nav.home")}
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-white transition-colors"
                >
                  {t("nav.about")}
                </Link>
              </li>
              <li>
                <Link
                  href="/offer"
                  className="hover:text-white transition-colors"
                >
                  {t("nav.products")}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-white transition-colors"
                >
                  {t("nav.contact")}
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-white transition-colors"
                >
                  {t("nav.privacy")}
                </Link>
              </li>
              <li>
                <Link
                  href="/obchodni-podminky"
                  className="hover:text-white transition-colors"
                >
                  Obchodní podmínky
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">
              {t("nav.contact")}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>info@hairland.cz</li>
              <li>
                <Link
                  href="/login"
                  className="hover:text-white transition-colors"
                >
                  {t("nav.login")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 text-sm text-center">
          {t("footer.copyright")}
        </div>
      </div>
    </footer>
  );
}
