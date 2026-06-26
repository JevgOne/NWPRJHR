import { getTranslations } from "next-intl/server";
import { ContactForm } from "./ContactForm";

export default async function ContactPage() {
  const t = await getTranslations("public");

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-ink mb-8">
        {t("contact.title")}
      </h1>

      {/* Trust banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-10">
        <div className="flex gap-4 items-start">
          <div className="text-3xl flex-shrink-0">🚗</div>
          <div>
            <h2 className="font-semibold text-emerald-900 mb-1">Osobní konzultace a dovoz zdarma</h2>
            <p className="text-sm text-emerald-800">
              Nejste si jistí výběrem? Napište nám a domluvíme osobní schůzku. Přijedeme s vlasy přímo za vámi nebo za vaší kadeřnicí — <strong>po Praze zcela zdarma</strong>. Ukážeme, poradíme a pomůžeme s výběrem. Žádný závazek.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Contact info */}
        <div>
          <h2 className="text-lg font-semibold text-ink mb-4">
            {t("contact.infoTitle")}
          </h2>
          <div className="space-y-3 text-sm text-muted">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-muted flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <span>info@hairland.cz</span>
            </div>

            <div className="mt-6 p-4 bg-nude-50 rounded-lg border border-line">
              <p className="font-medium text-ink mb-1">🇨🇿 🇺🇦 🇷🇺 Mluvíme vaším jazykem</p>
              <p className="text-xs text-muted">Kompletní servis v češtině, ukrajinštině i ruštině.</p>
            </div>
          </div>
        </div>

        {/* Contact form */}
        <ContactForm />
      </div>
    </div>
  );
}
