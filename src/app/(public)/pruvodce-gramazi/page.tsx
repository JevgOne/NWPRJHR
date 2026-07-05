import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";

export const metadata: Metadata = {
  title: "Kolik gramů vlasů potřebuji? — průvodce gramáží",
  description:
    "Zjistěte, kolik gramů vlasů potřebujete pro clip-in a tape-in prodloužení. 100 g, 150 g, 200 g nebo více — poradíme podle typu a hustoty vašich vlasů.",
  alternates: { canonical: "/pruvodce-gramazi" },
  openGraph: {
    type: "website",
    title: "Kolik gramů vlasů potřebuji? — průvodce gramáží | Hairland",
    description:
      "Zjistěte, kolik gramů vlasů potřebujete pro clip-in a tape-in prodloužení. 100 g, 150 g, 200 g nebo více.",
    url: "https://www.hairland.cz/pruvodce-gramazi",
    siteName: "Hairland",
    locale: "cs_CZ",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kolik gramů vlasů potřebuji? — průvodce gramáží | Hairland",
    description:
      "Zjistěte, kolik gramů vlasů potřebujete pro clip-in a tape-in prodloužení. 100 g, 150 g, 200 g nebo více.",
  },
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Kolik gramů vlasů potřebuji na prodloužení?",
  description:
    "Průvodce výběrem správného množství vlasů pro clip-in a tape-in prodloužení podle typu a hustoty vašich vlasů.",
  step: [
    {
      "@type": "HowToStep",
      name: "Určete typ svých vlasů",
      text: "Zhodnoťte, zda máte jemné, normální nebo husté vlasy. To ovlivní kolik gramů budete potřebovat.",
    },
    {
      "@type": "HowToStep",
      name: "Zvolte požadovaný objem",
      text: "Rozhodněte se, zda chcete jemné doplnění (100 g), střední objem (150 g), plný objem (200 g) nebo extrémní délku a objem (250+ g).",
    },
    {
      "@type": "HowToStep",
      name: "Vyberte typ zpracování",
      text: "Clip-in vlasy vyžadují obvykle více gramů pro plný efekt. Tape-in vlasy se rozkládají rovnoměrněji a mohou vyžadovat méně gramů.",
    },
    {
      "@type": "HowToStep",
      name: "Objednejte vlasy",
      text: "Na základě doporučení vyberte správnou gramáž v našem e-shopu nebo nás kontaktujte pro osobní konzultaci.",
    },
  ],
};

const weightGuide = [
  {
    grams: "100 g",
    effect: "Jemné doplnění",
    description: "Přidá objem a mírně prodlouží. Ideální pro jemné vlasy nebo pro ty, kteří chtějí nenápadnou změnu.",
  },
  {
    grams: "150 g",
    effect: "Střední objem",
    description: "Nejpopulárnější volba. Výrazně přidá objem a přirozeně prodlouží vlasy. Vhodné pro normální vlasy.",
  },
  {
    grams: "200 g",
    effect: "Plný objem",
    description: "Bohatý, plný efekt. Ideální pro husté vlasy nebo výrazné prodloužení.",
  },
  {
    grams: "250+ g",
    effect: "Extrémní délka/objem",
    description: "Maximum objemu a délky. Pro velmi dlouhé prodloužení nebo extra husté vlasy.",
  },
];

const hairTypeRecs = [
  {
    type: "Jemné vlasy",
    recommended: "100–150 g",
    note: "Jemné vlasy nepotřebují tolik gramů pro viditelný efekt. Menší množství zabrání přetěžování vlastních vlasů.",
  },
  {
    type: "Normální vlasy",
    recommended: "150–200 g",
    note: "Standardní gramáž pro přirozený a plný výsledek. Nejčastější volba našich zákaznic.",
  },
  {
    type: "Husté vlasy",
    recommended: "200–250+ g",
    note: "Husté vlasy potřebují více gramů, aby se prodloužení opticky sladilo s vlastním objemem.",
  },
];

export default function PruvodceGramaziPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <Breadcrumbs items={[
        { label: "Domů", href: "/" },
        { label: "Průvodce gramáží" },
      ]} />

      <h1 className="text-3xl font-bold text-ink mb-3">
        Kolik gramů vlasů potřebuji?
      </h1>
      <p className="text-muted mb-10">
        Správná gramáž je klíčová pro přirozený výsledek. Záleží na typu vašich
        vlasů, požadovaném objemu a způsobu zpracování.
      </p>

      {/* Weight guide table */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-ink mb-4">
          Průvodce gramáží
        </h2>
        <div className="bg-nude-50 rounded-xl border border-line overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left p-3 font-medium text-muted">
                  Gramáž
                </th>
                <th className="text-left p-3 font-medium text-muted">Efekt</th>
                <th className="text-left p-3 font-medium text-muted hidden sm:table-cell">
                  Popis
                </th>
              </tr>
            </thead>
            <tbody>
              {weightGuide.map((row) => (
                <tr key={row.grams} className="border-b border-line last:border-b-0">
                  <td className="p-3 text-ink font-semibold whitespace-nowrap">
                    {row.grams}
                  </td>
                  <td className="p-3 text-ink">{row.effect}</td>
                  <td className="p-3 text-muted hidden sm:table-cell">
                    {row.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile descriptions */}
        <div className="sm:hidden mt-4 space-y-3">
          {weightGuide.map((row) => (
            <div
              key={row.grams}
              className="bg-nude-50 rounded-xl border border-line p-4"
            >
              <div className="font-semibold text-ink mb-1">
                {row.grams} — {row.effect}
              </div>
              <p className="text-sm text-muted">{row.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Hair type recommendations */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-ink mb-4">
          Doporučení podle typu vlasů
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {hairTypeRecs.map((rec) => (
            <div
              key={rec.type}
              className="bg-nude-50 rounded-xl border border-line p-5"
            >
              <div className="text-sm font-semibold text-ink mb-1">
                {rec.type}
              </div>
              <div className="text-lg font-bold text-rose mb-2">
                {rec.recommended}
              </div>
              <p className="text-sm text-muted">{rec.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Processing type guide */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-ink mb-4">
          Clip-in vs. tape-in
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-nude-50 rounded-xl border border-line p-5">
            <div className="text-sm font-semibold text-ink mb-2">Clip-in</div>
            <p className="text-sm text-muted">
              Clip-in vlasy se připínají sponkami a obvykle vyžadují{" "}
              <strong className="text-ink">o 20–30 % více gramů</strong> pro
              plný efekt, protože se soustředí do menšího počtu pramenů. Výhodou
              je snadná aplikace a možnost denního sundávání.
            </p>
          </div>
          <div className="bg-nude-50 rounded-xl border border-line p-5">
            <div className="text-sm font-semibold text-ink mb-2">Tape-in</div>
            <p className="text-sm text-muted">
              Tape-in vlasy se rozkládají rovnoměrněji po celé hlavě, takže{" "}
              <strong className="text-ink">
                stačí méně gramů pro stejný vizuální efekt
              </strong>
              . Aplikaci provádí kadeřník a vydrží 6–8 týdnů před přelepením.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center bg-nude-50 rounded-xl border border-line p-8">
        <p className="text-muted mb-4">
          Stále si nejste jistá? Rádi vám poradíme osobně.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/offer"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-rose text-white text-sm font-medium rounded-lg hover:bg-rose-deep transition-colors"
          >
            Prohlédnout nabídku
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-2.5 border border-line text-ink text-sm font-medium rounded-lg hover:bg-nude-100 transition-colors"
          >
            Kontaktovat nás
          </Link>
        </div>
      </div>
    </div>
  );
}
