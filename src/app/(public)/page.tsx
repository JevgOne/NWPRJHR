import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { HeroProductSlider } from "@/components/public/HeroProductSlider";

export default async function LandingPage() {
  const t = await getTranslations("public");
  const tCategory = await getTranslations("category");

  return (
    <div>
      {/* Hero — text + product slider */}
      <section className="bg-white pt-12 pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              Prémiové vlasy k prodloužení
            </h1>
            <p className="text-gray-600 mb-4 max-w-xl mx-auto">
              Výhradně východoevropské a evropské vlasy. Vše oficiálně fakturováno — kvalita doložená doklady.
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-600">
              <span>✅ Vlasy skladem — vezmete si hned</span>
              <span>✂️ Clip-in a tape-in do 7 dnů</span>
              <span>🚗 Dovoz po Praze zdarma</span>
              <span>🇪🇺 100% evropský původ</span>
            </div>
          </div>

          {/* Product slider */}
          <div className="px-4">
            <HeroProductSlider />
          </div>

          <div className="flex gap-3 justify-center mt-6">
            <Link
              href="/offer"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Zobrazit celou nabídku
            </Link>
            <Link
              href="/contact"
              className="px-5 py-2.5 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 text-sm font-medium rounded-lg transition-colors"
            >
              Kontaktujte nás
            </Link>
          </div>
        </div>
      </section>

      {/* Product categories — right below hero */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-gray-900 text-center mb-6">
            Vyberte si z naší nabídky
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(
              [
                { key: "virgin" as const, img: "https://usxv0mh0wvr3gzdk.public.blob.vercel-storage.com/hair/volne-vlasy.jpg", desc: "Nejvyšší kvalita, neošetřené" },
                { key: "premium" as const, img: "https://usxv0mh0wvr3gzdk.public.blob.vercel-storage.com/hair/odstiny-prehled.jpg", desc: "Prémiová kvalita" },
                { key: "standard" as const, img: "https://usxv0mh0wvr3gzdk.public.blob.vercel-storage.com/hair/extensions-techniky.jpg", desc: "Skvělý poměr cena/kvalita" },
                { key: "sale" as const, img: "https://usxv0mh0wvr3gzdk.public.blob.vercel-storage.com/hair/keratinove-vlasy.jpg", desc: "Výhodné ceny" },
              ]
            ).map(({ key, img, desc }) => (
              <Link
                key={key}
                href={`/offer?category=${key.toUpperCase()}`}
                className="group block overflow-hidden rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
              >
                <div className="relative h-32">
                  <img src={img} alt={tCategory(key)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-3 bg-white text-center">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {tCategory(key)}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Color palette */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Široká škála odstínů
              </h2>
              <p className="text-gray-600 mb-4">
                Od platinové blond po tmavě černou. Najdeme přesný odstín, který se hodí k vašim vlasům — přijedeme s ukázkami a porovnáme naživo.
              </p>
              <div className="flex flex-wrap gap-2">
                {["#F5E6C8", "#D4A76A", "#C08040", "#8B6914", "#6B4226", "#4A2F1A", "#2C1810", "#1A0F0A"].map((color) => (
                  <div key={color} className="w-8 h-8 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
            <div className="flex-shrink-0">
              <img
                src="https://usxv0mh0wvr3gzdk.public.blob.vercel-storage.com/hair/odstiny-prehled.jpg"
                alt="Přehled odstínů vlasů"
                className="w-72 h-48 md:w-80 md:h-52 object-cover rounded-xl shadow-md"
              />
            </div>
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
            Prodáváme prémiové vlasy k prodloužení. Clip-in a tape-in připravíme na zakázku do 7 dnů.
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
                Vlasy skladem si vezmete rovnou s sebou. Chcete clip-in nebo tape-in? Zaplaťte a připravíme je na míru do 7 dnů.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">
                4️⃣
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">Vlasy na zakázku do 7 dnů</h3>
              <p className="text-xs text-gray-600">
                Potřebujete clip-in nebo tape-in? Připravíme na míru do 7 pracovních dnů. Vyzvednete si je u nás nebo vám je dovezeme — po Praze zdarma.
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
                <h3 className="font-semibold text-gray-900 mb-1">Vlasy na zakázku do 7 dnů</h3>
                <p className="text-sm text-gray-600">
                  Clip-in i tape-in připravíme přesně podle vašich požadavků. Od objednávky po předání do 7 pracovních dnů.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-5 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-3xl flex-shrink-0">🇪🇺</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Výhradně evropské vlasy</h3>
                <p className="text-sm text-gray-600">
                  Prodáváme pouze východoevropské a evropské vlasy. Žádné příměsi, žádné pochybné zdroje.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-5 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-3xl flex-shrink-0">🧾</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Vše oficiálně fakturováno</h3>
                <p className="text-sm text-gray-600">
                  Ke každému nákupu vystavíme řádný doklad. Původ vlasů i kvalita jsou doložené — máme vše oficiální.
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
