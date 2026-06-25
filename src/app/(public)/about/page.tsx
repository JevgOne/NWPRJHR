import Link from "next/link";

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-white pt-12 pb-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Kdo stojí za Hairora
              </h1>
              <p className="text-gray-600 leading-relaxed mb-4">
                Jsme tým, který rozumí vlasům. Dovážíme prémiové vlasy k prodloužení přímo od výrobců a prodáváme je salonům i koncovým zákazníkům v České republice. Každý pramínek prochází naší kontrolou kvality.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Věříme, že kvalitní vlasy by měly být dostupné za férovou cenu — bez zbytečných mezičlánků. Proto pracujeme přímo s dodavateli a nabízíme osobní přístup ke každému zákazníkovi.
              </p>
            </div>
            <div className="flex-shrink-0">
              <img
                src="https://usxv0mh0wvr3gzdk.public.blob.vercel-storage.com/hair/volne-vlasy-promo.jpg"
                alt="Prémiové vlasy Hairora"
                className="w-64 h-64 md:w-72 md:h-72 object-cover rounded-2xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="py-10 bg-gray-50 border-y border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-indigo-600">100%</div>
              <div className="text-sm text-gray-600 mt-1">Lidské vlasy</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-indigo-600">7 dnů</div>
              <div className="text-sm text-gray-600 mt-1">Clip-in a tape-in na zakázku</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-indigo-600">3</div>
              <div className="text-sm text-gray-600 mt-1">Jazyky (CZ, UA, RU)</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-indigo-600">Zdarma</div>
              <div className="text-sm text-gray-600 mt-1">Dovoz po Praze</div>
            </div>
          </div>
        </div>
      </section>

      {/* What we offer */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            Co u nás najdete
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="relative overflow-hidden rounded-xl group">
              <img
                src="https://usxv0mh0wvr3gzdk.public.blob.vercel-storage.com/hair/volne-vlasy.jpg"
                alt="Volné vlasy"
                className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <h3 className="text-white font-semibold">Volné vlasy</h3>
                <p className="text-white/80 text-xs">Skladem — vezmete si hned</p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-xl group">
              <img
                src="https://usxv0mh0wvr3gzdk.public.blob.vercel-storage.com/hair/clip-in.jpg"
                alt="Clip-in"
                className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <h3 className="text-white font-semibold">Clip-in sady</h3>
                <p className="text-white/80 text-xs">Na zakázku do 7 dnů</p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-xl group">
              <img
                src="https://usxv0mh0wvr3gzdk.public.blob.vercel-storage.com/hair/tape-in.jpg"
                alt="Tape-in"
                className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <h3 className="text-white font-semibold">Tape-in pásky</h3>
                <p className="text-white/80 text-xs">Na zakázku do 7 dnů</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            Naše hodnoty
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-4 p-5 bg-white rounded-xl border border-gray-200">
              <div className="text-3xl flex-shrink-0">💎</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Kvalita na prvním místě</h3>
                <p className="text-sm text-gray-600">
                  Každý pramínek kontrolujeme osobně. Prodáváme jen vlasy, za které ručíme. Žádné překvapení, žádná kompromitace.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-5 bg-white rounded-xl border border-gray-200">
              <div className="text-3xl flex-shrink-0">🤝</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Osobní přístup</h3>
                <p className="text-sm text-gray-600">
                  Přijedeme s ukázkami, poradíme s odstínem a délkou. Spojíme vás s ověřenou kadeřnicí. Jsme tu pro vás od výběru po výsledek.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-5 bg-white rounded-xl border border-gray-200">
              <div className="text-3xl flex-shrink-0">💰</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Férové ceny</h3>
                <p className="text-sm text-gray-600">
                  Bez zbytečných mezičlánků. Dovážíme přímo od výrobců, proto nabízíme prémiovou kvalitu za rozumnou cenu.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-5 bg-white rounded-xl border border-gray-200">
              <div className="text-3xl flex-shrink-0">🌍</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Mluvíme vaším jazykem</h3>
                <p className="text-sm text-gray-600">
                  Kompletní servis v češtině, ukrajinštině i ruštině. Poradíme a vysvětlíme — v jazyce, kterému rozumíte.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company info */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Provozovatel</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600">
              <div><span className="text-gray-500">Firma:</span> Alvento Solutions s.r.o.</div>
              <div><span className="text-gray-500">IČO:</span> 24111953</div>
              <div><span className="text-gray-500">Sídlo:</span> Školská 660/3, Praha 1, 110 00</div>
              <div><span className="text-gray-500">E-mail:</span> info@hairora.cz</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Chcete se přijít podívat?
          </h2>
          <p className="text-gray-600 mb-6">
            Napište nám nebo zavolejte. Domluvíme schůzku a pomůžeme s výběrem. Žádný závazek.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/contact"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
            >
              Kontaktujte nás
            </Link>
            <Link
              href="/offer"
              className="px-6 py-3 bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 font-medium rounded-lg transition-colors"
            >
              Zobrazit nabídku
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
