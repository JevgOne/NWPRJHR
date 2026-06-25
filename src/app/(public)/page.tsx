import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function LandingPage() {
  const t = await getTranslations("public");
  const tCategory = await getTranslations("category");

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-indigo-900 text-white py-20 lg:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">
            {t("hero.title")}
          </h1>
          <p className="text-lg lg:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            {t("hero.subtitle")}
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/contact"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
            >
              {t("hero.cta")}
            </Link>
            <Link
              href="/offer"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors"
            >
              {t("hero.viewOffer")}
            </Link>
          </div>
        </div>
      </section>

      {/* Product categories */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            {t("nav.products")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(["virgin", "premium", "standard", "sale"] as const).map(
              (cat) => (
                <Link
                  key={cat}
                  href={`/offer?category=${cat.toUpperCase()}`}
                  className="group block p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
                >
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
                    <svg
                      className="w-6 h-6 text-indigo-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900">
                    {tCategory(cat)}
                  </h3>
                </Link>
              )
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
            Jak to funguje
          </h2>
          <p className="text-gray-500 text-center mb-10 max-w-xl mx-auto">
            Prodáváme prémiové vlasy k prodloužení. Na přání připravíme i hotové sady do 7 dnů.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">
                1️⃣
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">Vyberte si vlasy</h3>
              <p className="text-xs text-gray-600">
                Přijďte se podívat, osahat a porovnat. Poradíme s barvou i délkou. Nejste si jistí? Přijedeme s ukázkami přímo za vámi — po Praze zdarma.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">
                2️⃣
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">Spojte nás s kadeřnicí</h3>
              <p className="text-xs text-gray-600">
                Máte svou kadeřnici? Super, spojíme se přímo s ní. Nemáte? Nevadí — vyberte si z našich ověřených specialistek na prodlužování.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">
                3️⃣
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">Zaplaťte a vezmete si je</h3>
              <p className="text-xs text-gray-600">
                Vlasy skladem si vezmete rovnou s sebou. Potřebujete hotovou sadu (clip-in, tape-in)? Zaplaťte a my ji připravíme na míru.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">
                4️⃣
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">Sady do 7 dnů</h3>
              <p className="text-xs text-gray-600">
                Hotové sady na zakázku připravíme do 7 pracovních dnů. Vyzvednete si je u nás nebo vám je dovezeme — po Praze zdarma.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
            Proč nám zákazníci důvěřují
          </h2>
          <p className="text-gray-500 text-center mb-10 max-w-xl mx-auto">
            Žádné riziko. Osobní přístup. Kvalita, kterou uvidíte a osaháte si.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-4 p-5 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-3xl flex-shrink-0">🤝</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Osobní konzultace zdarma</h3>
                <p className="text-sm text-gray-600">
                  Nejste si jistí výběrem? Žádný problém. Kontaktujte nás a domluvíme osobní schůzku — přijedeme s ukázkami přímo za vámi nebo za vaší kadeřnicí. Po Praze zdarma.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-5 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-3xl flex-shrink-0">✋</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Vlasy si osaháte předem</h3>
                <p className="text-sm text-gray-600">
                  Nekupujete naslepo. Každý zákazník si může vlasy prohlédnout, porovnat barvy a délky. Teprve pak se rozhodnete.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-5 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-3xl flex-shrink-0">🚗</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Dovoz po Praze zdarma</h3>
                <p className="text-sm text-gray-600">
                  Přivezeme vlasy přímo k vám nebo do salonu. Ukážeme, zarezervujeme a prodáme. Bez starostí, bez čekání na poštu.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-5 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-3xl flex-shrink-0">⏰</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Sady na zakázku do 7 dnů</h3>
                <p className="text-sm text-gray-600">
                  Chcete hotovou sadu (clip-in, tape-in)? Připravíme ji přesně podle vašich požadavků. Od objednávky po předání do 7 pracovních dnů.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trilingual support */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center gap-3 text-4xl mb-4">
            <span>🇨🇿</span><span>🇺🇦</span><span>🇷🇺</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Mluvíme vaším jazykem</h3>
          <p className="text-sm text-gray-600 max-w-lg mx-auto">
            Kompletní servis v češtině, ukrajinštině i ruštině. Poradíme, vysvětlíme a pomůžeme — v jazyce, kterému rozumíte.
          </p>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Chcete se přijít podívat?
          </h2>
          <p className="text-gray-600 mb-6 max-w-lg mx-auto">
            Napište nám nebo zavolejte. Domluvíme schůzku, přijedeme s ukázkami a pomůžeme s výběrem. Žádný závazek, žádné riziko.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/contact"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
            >
              Napište nám
            </Link>
            <Link
              href="/kadernice"
              className="px-6 py-3 bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 font-medium rounded-lg transition-colors"
            >
              Naše kadeřnice
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
