import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ContactForm } from "./ContactForm";

export default async function ContactPage() {
  const t = await getTranslations("public");

  return (
    <div>
      {/* Hero */}
      <section className="bg-white pt-12 pb-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {t("contact.title")}
          </h1>
          <p className="text-gray-600 max-w-lg mx-auto">
            Napište nám, zavolejte nebo přijďte osobně. Rádi poradíme s výběrem vlasů a domluvíme schůzku.
          </p>
        </div>
      </section>

      {/* Quick contact options */}
      <section className="py-8 bg-gray-50 border-y border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a
              href="mailto:info@hairora.cz"
              className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">E-mail</div>
                <div className="text-sm text-indigo-600">info@hairora.cz</div>
              </div>
            </a>
            <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Adresa</div>
                <div className="text-sm text-gray-600">Školská 660/3, Praha 1</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Jazyky</div>
                <div className="text-sm text-gray-600">🇨🇿 🇺🇦 🇷🇺</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits + Form */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Left — benefits */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Co pro vás uděláme
              </h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="text-2xl flex-shrink-0">🚗</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Přijedeme za vámi</h3>
                    <p className="text-sm text-gray-600">Dovezeme ukázky přímo k vám nebo do salonu — po Praze zdarma.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="text-2xl flex-shrink-0">✋</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Vlasy si osaháte</h3>
                    <p className="text-sm text-gray-600">Nekupujete naslepo. Prohlédněte si barvy a délky naživo.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="text-2xl flex-shrink-0">✂️</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Clip-in a tape-in do 7 dnů</h3>
                    <p className="text-sm text-gray-600">Připravíme na zakázku přesně podle vašich požadavků.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="text-2xl flex-shrink-0">🤝</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Spojíme vás s kadeřnicí</h3>
                    <p className="text-sm text-gray-600">Nemáte svou? Doporučíme ověřenou specialistku na prodlužování.</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  href="/kadernice"
                  className="inline-flex items-center text-sm text-indigo-600 font-medium hover:text-indigo-700"
                >
                  Prohlédnout naše kadeřnice →
                </Link>
              </div>
            </div>

            {/* Right — contact form */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Napište nám
              </h2>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* Company info */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>Alvento Solutions s.r.o. · IČO 24111953 · Školská 660/3, Praha 1, 110 00</p>
          </div>
        </div>
      </section>
    </div>
  );
}
