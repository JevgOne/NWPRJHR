import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { HeroProductSlider } from "@/components/public/HeroProductSlider";

const BLOB = "https://usxv0mh0wvr3gzdk.public.blob.vercel-storage.com/hair";

export default async function LandingPage() {
  const t = await getTranslations("public");
  const tCategory = await getTranslations("category");

  return (
    <div>
      {/* Hero — text + benefits + product slider */}
      <section className="bg-white pt-12 pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              Prémiové vlasy k prodloužení
            </h1>
            <p className="text-gray-600 mb-4 max-w-xl mx-auto">
              Vlasy z celého světa — Evropa, Východní Evropa, Rusko, Kazachstán, Turecko, Írán, Indie i Vietnam. U každého produktu uvádíme přesný původ — vše oficiálně fakturováno.
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-600">
              <span>✅ Vlasy skladem — vezmete si hned</span>
              <span>✂️ Clip-in a tape-in do 7 dnů</span>
              <span>🚗 Dovoz po Praze zdarma</span>
              <span>🌍 U každého produktu přesný původ</span>
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

      {/* Product categories with photos */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-gray-900 text-center mb-6">
            Vyberte si z naší nabídky
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(
              [
                { key: "virgin" as const, img: `${BLOB}/volne-vlasy.jpg`, desc: "Nejvyšší kvalita, neošetřené" },
                { key: "premium" as const, img: `${BLOB}/odstiny-prehled.jpg`, desc: "Prémiová kvalita" },
                { key: "standard" as const, img: `${BLOB}/extensions-techniky.jpg`, desc: "Skvělý poměr cena/kvalita" },
                { key: "sale" as const, img: `${BLOB}/keratinove-vlasy.jpg`, desc: "Výhodné ceny" },
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
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Široká škála odstínů
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Od platinové blond po tmavě černou. Najdeme přesný odstín, který se hodí k vašim vlasům — přijedeme s ukázkami a porovnáme naživo.
            </p>
          </div>

          {/* Gradient bar */}
          <div className="relative mb-8">
            <div
              className="h-4 rounded-full shadow-inner"
              style={{
                background: "linear-gradient(to right, #FAF0DC, #E8D5A8, #D4B06A, #C49A48, #A07030, #7A5230, #5C3A1E, #3E2512, #2A1A0C, #0F0A06)",
              }}
            />
          </div>

          {/* Individual shades */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-3 mb-8">
            {[
              { color: "#FAF0DC", name: "Platinová" },
              { color: "#E8D5A8", name: "Světlá blond" },
              { color: "#D4B06A", name: "Zlatá blond" },
              { color: "#C49A48", name: "Medová" },
              { color: "#A07030", name: "Karamelová" },
              { color: "#7A5230", name: "Světle hnědá" },
              { color: "#5C3A1E", name: "Středně hnědá" },
              { color: "#3E2512", name: "Tmavě hnědá" },
              { color: "#2A1A0C", name: "Tmavá" },
              { color: "#0F0A06", name: "Černá" },
            ].map(({ color, name }) => (
              <div key={color} className="flex flex-col items-center gap-2 group">
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-md group-hover:scale-110 group-hover:shadow-lg transition-all duration-200 border-2 border-white ring-1 ring-gray-200"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[10px] sm:text-xs text-gray-500 font-medium text-center leading-tight">{name}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <img
              src={`${BLOB}/odstiny-prehled.jpg`}
              alt="Přehled odstínů vlasů"
              className="w-full max-w-2xl h-48 md:h-56 object-cover rounded-xl shadow-md"
            />
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
              <div className="text-3xl flex-shrink-0">🌍</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Přesný původ u každého produktu</h3>
                <p className="text-sm text-gray-600">
                  Vlasy z celého světa — u každého produktu uvádíme přesný původ. Vše oficiálně fakturováno, kvalita doložená doklady.
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
