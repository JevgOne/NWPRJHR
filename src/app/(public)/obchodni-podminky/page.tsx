import Link from "next/link";

export default function ObchodniPodminkyPage() {
  const sections = [
    {
      title: "1. Úvodní ustanovení",
      text: `Tyto obchodní podmínky upravují vzájemná práva a povinnosti mezi provozovatelem internetového portálu hairland.cz a jeho zákazníky.

Provozovatel:
Alvento Solutions s.r.o.
IČO: 24111953
Sídlo: Školská 660/3, Nové Město, 110 00 Praha
E-mail: info@hairland.cz

Provozovatel se zabývá velkoobchodním prodejem vlasů k prodloužení pro profesionální kadeřnické salony.`,
    },
    {
      title: "2. Objednávka a uzavření smlouvy",
      text: `Objednávka zboží probíhá zpravidla na základě osobního výběru vlasů zákazníkem. Zákazník si vybere konkrétní vlasy (barvu, délku, množství) a provede objednávku.

Kupní smlouva je uzavřena okamžikem potvrzení objednávky ze strany provozovatele a uhrazením dohodnuté kupní ceny zákazníkem.

V případě zakázkové výroby (clip-in, tape-in) je smlouva uzavřena okamžikem potvrzení objednávky a složením zálohy.`,
    },
    {
      title: "3. Ceny a platební podmínky",
      text: `Všechny ceny jsou uvedeny v českých korunách (CZK) a zahrnují DPH, není-li výslovně uvedeno jinak.

Platba probíhá předem na základě vystavené faktury, hotově při osobním odběru, nebo bezhotovostním převodem na účet provozovatele.

Faktura – daňový doklad je zákazníkovi zaslána elektronicky na e-mail nebo předána při osobním odběru.`,
    },
    {
      title: "4. Dodací podmínky",
      text: `Vlasy skladem jsou k dispozici ihned při osobním odběru.

Zakázková výroba (clip-in, tape-in sady) je realizována do 7 pracovních dnů od potvrzení objednávky a uhrazení zálohy.

Rozvoz objednaného zboží po Praze je zdarma. Dodání mimo Prahu je možné po individuální domluvě.

Zákazník je povinen zboží při převzetí zkontrolovat a případné nesrovnalosti ihned nahlásit.`,
    },
    {
      title: "5. Reklamace a vrácení zboží",
      text: `Zákazník má právo reklamovat zboží, pokud vykazuje vady kvality, které nebyly způsobeny nesprávným zacházením.

Reklamaci je nutné uplatnit bez zbytečného odkladu po zjištění vady, a to e-mailem na info@hairland.cz s popisem vady a fotodokumentací.

Provozovatel posoudí reklamaci do 30 dnů od jejího uplatnění.

Použité vlasy (tj. vlasy, které byly aplikovány nebo jinak zpracovány) nelze vrátit ani reklamovat, pokud se nejedná o skrytou vadu materiálu.

Zboží nelze vrátit pouze z důvodu změny rozhodnutí zákazníka, pokud nebylo poškozeno nebo neodpovídá objednávce.`,
    },
    {
      title: "6. Ochrana osobních údajů",
      text: `Provozovatel zpracovává osobní údaje zákazníků v souladu s nařízením GDPR a platnými právními předpisy České republiky.

Podrobné informace o zpracování osobních údajů naleznete na stránce:`,
      link: { href: "/privacy", label: "Ochrana osobních údajů" },
    },
    {
      title: "7. Závěrečná ustanovení",
      text: `Tyto obchodní podmínky nabývají účinnosti dnem jejich zveřejnění na webových stránkách hairland.cz.

Provozovatel si vyhrazuje právo tyto obchodní podmínky kdykoli změnit. Změny jsou účinné okamžikem jejich zveřejnění na webu.

Vztahy neupravené těmito obchodními podmínkami se řídí právním řádem České republiky, zejména zákonem č. 89/2012 Sb., občanský zákoník, v platném znění.

V případě sporů je příslušný soud v České republice dle sídla provozovatele.`,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Obchodní podmínky
      </h1>

      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              {section.title}
            </h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {section.text}
            </p>
            {section.link && (
              <Link
                href={section.link.href}
                className="inline-block mt-2 text-indigo-600 hover:text-indigo-700 underline"
              >
                {section.link.label}
              </Link>
            )}
          </section>
        ))}
      </div>

      <p className="mt-12 text-sm text-gray-400">
        Poslední aktualizace: červen 2026
      </p>
    </div>
  );
}
