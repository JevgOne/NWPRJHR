import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Obchodní podmínky | Hairland",
};

export default function ObchodniPodminkyPage() {
  const sections = [
    {
      title: "1. Úvodní ustanovení",
      text: `1.1. Tyto všeobecné obchodní podmínky (dále jen „VOP") upravují vzájemná práva a povinnosti mezi prodávajícím a kupujícím při prodeji vlasů k prodloužení a souvisejících produktů prostřednictvím portálu hairland.cz a při osobním prodeji.

1.2. Prodávající:
Alvento Solutions s.r.o.
IČO: 24111953
Sídlo: Školská 660/3, Nové Město, 110 00 Praha
E-mail: info@hairland.cz

1.3. Prodávající se zabývá velkoobchodním a maloobchodním prodejem přírodních vlasů k prodloužení pro profesionální kadeřnické salony a koncové zákazníky.

1.4. Kupujícím se rozumí fyzická nebo právnická osoba, která s prodávajícím uzavírá kupní smlouvu.

1.5. Registrací na portálu hairland.cz nebo uskutečněním objednávky kupující potvrzuje, že se seznámil s těmito VOP a že s nimi souhlasí.`,
    },
    {
      title: "2. Objednávka a uzavření kupní smlouvy",
      text: `2.1. Objednávka zboží probíhá na základě osobního výběru vlasů kupujícím, prostřednictvím poptávkového formuláře na webu hairland.cz nebo jinou dohodnutou formou (e-mail, telefon).

2.2. Kupní smlouva je uzavřena okamžikem potvrzení objednávky ze strany prodávajícího a uhrazením dohodnuté kupní ceny kupujícím.

2.3. V případě zakázkové výroby (clip-in sady, tape-in pásky, keratinové bondy a jiné úpravy) je smlouva uzavřena okamžikem potvrzení objednávky a složením zálohy ve výši 100 % kupní ceny.

2.4. Prodávající si vyhrazuje právo odmítnout objednávku nebo registraci B2B účtu bez udání důvodu.

2.5. U B2B registrace (registrace salonu) je přístup k portálu podmíněn schválením ze strany prodávajícího. Prodávající si ověřuje, zda se jedná o profesionální kadeřnický salon či podnikatele v oboru.`,
    },
    {
      title: "3. Ceny a platební podmínky",
      text: `3.1. Všechny ceny jsou uvedeny v českých korunách (CZK). U B2B odběratelů (plátců DPH) jsou ceny uvedeny bez DPH, není-li výslovně uvedeno jinak. U koncových zákazníků jsou ceny včetně DPH.

3.2. Platba probíhá:
  a) hotově při osobním odběru,
  b) bezhotovostním převodem na účet prodávajícího na základě vystavené faktury,
  c) složením zálohy u zakázkové výroby.

3.3. Faktura — daňový doklad je kupujícímu zaslána elektronicky na e-mail nebo předána při osobním odběru.

3.4. V případě prodlení s úhradou faktury je prodávající oprávněn účtovat zákonný úrok z prodlení.`,
    },
    {
      title: "4. Dodací podmínky",
      text: `4.1. Vlasy skladem jsou k dispozici ihned při osobním odběru.

4.2. Zakázková výroba (clip-in sady, tape-in pásky, keratinové bondy) je realizována do 7 pracovních dnů od potvrzení objednávky a uhrazení kupní ceny.

4.3. Rozvoz objednaného zboží po Praze je zdarma. Dodání mimo Prahu je možné po individuální domluvě a za úhradu přepravních nákladů.

4.4. Kupující je povinen zboží při převzetí zkontrolovat — zejména barvu, délku, množství a celkový stav vlasů. Na pozdější reklamace týkající se zjevných vad (nesouhlasící barva, délka, viditelné poškození) nebude brán zřetel, pokud nebyly nahlášeny při převzetí.

4.5. Odmítne-li kupující zboží převzít bez řádného důvodu, je prodávající oprávněn požadovat náhradu nákladů spojených s dodáním.`,
    },
    {
      title: "5. Povaha zboží — přírodní vlasy",
      text: `5.1. Předmětem prodeje jsou přírodní lidské vlasy. Jedná se o specifický produkt, jehož vlastnosti (jemné odchylky v barvě, struktuře a tloušťce) jsou dány jeho přírodním původem a nepředstavují vadu.

5.2. Prodávající u každého produktu uvádí přesný původ vlasů, kategorii kvality (Virgin, Premium, Standard) a dostupné parametry (délka, barva). Tyto údaje jsou orientační — drobné odchylky typické pro přírodní materiál nejsou důvodem k reklamaci.

5.3. Životnost vlasů závisí na způsobu aplikace, údržbě a používaných přípravcích. Prodávající neodpovídá za zkrácení životnosti způsobené nesprávnou péčí.`,
    },
    {
      title: "6. Reklamace a záruka",
      text: `6.1. Kupující má právo reklamovat zboží, pokud vykazuje vady kvality, které nebyly způsobeny nesprávným zacházením, a to ve lhůtě 14 dnů od převzetí zboží.

6.2. Reklamaci je nutné uplatnit bez zbytečného odkladu e-mailem na info@hairland.cz s popisem vady, fotodokumentací a dokladem o koupi.

6.3. Prodávající posoudí reklamaci do 30 dnů od jejího uplatnění.

6.4. DŮLEŽITÉ — Reklamaci nelze uznat v případě, že s vlasy bylo jakkoliv manipulováno po převzetí, zejména:
  a) vlasy byly aplikovány jakoukoliv metodou (keratin, tape-in, micro-ring, clip-in, prošití, jiná metoda),
  b) vlasy byly připraveny k aplikaci (nalepení pásek, vytvoření keratinových bondů, nastříhání na prameny),
  c) vlasy byly umyty, barveny, odbarvovány, tónovány nebo chemicky ošetřeny,
  d) vlasy byly vystaveny nevhodným přípravkům (sulfátové šampony, přípravky s alkoholem, silikonové oleje nevhodné pro prodloužené vlasy),
  e) vlasy byly mechanicky poškozeny (nadměrné česání, nevhodné kartáče, spánek bez ochrany),
  f) vlasy byly tepelně poškozeny (žehlička, kulma bez tepelné ochrany při teplotě nad 180 °C).

6.5. Reklamovat lze výhradně nepoužité, neaplikované a nijak nezpracované vlasy v původním stavu, ve kterém byly předány kupujícímu.

6.6. V případě oprávněné reklamace má kupující právo na výměnu zboží za bezvadné, nebo na vystavení dobropisu. Volbu způsobu vyřízení reklamace určuje prodávající.

6.7. Za skryté vady materiálu (např. nehomogenní struktura kutikuly, nesprávný směr vlasových šupin zjištěný až po aplikaci) odpovídá prodávající i po aplikaci, a to ve lhůtě 30 dnů od převzetí. V takovém případě je nutné doložit fotodokumentaci a zprávu od aplikující kadeřnice.`,
    },
    {
      title: "7. Vrácení zboží",
      text: `7.1. Vrácení zboží je možné pouze u nepoužitých, neaplikovaných a nijak nezpracovaných vlasů v původním stavu, a to do 14 dnů od převzetí.

7.2. Vrácení zboží je nutné předem domluvit e-mailem na info@hairland.cz. Bez předchozí domluvy vrácení zboží nebude přijato.

7.3. Nelze vrátit:
  a) vlasy, se kterými bylo jakkoliv manipulováno (viz čl. 6.4),
  b) vlasy vyrobené na zakázku (clip-in sady, tape-in pásky, keratinové bondy),
  c) vlasy, u nichž byl porušen originální obal nebo označení.

7.4. Při splnění podmínek pro vrácení zboží prodávající vrátí kupní cenu na účet kupujícího do 14 dnů od přijetí vráceného zboží.

7.5. Náklady na vrácení zboží nese kupující.`,
    },
    {
      title: "8. Registrace B2B účtu",
      text: `8.1. Registrace B2B účtu na portálu hairland.cz je určena výhradně pro profesionální kadeřnické salony, kadeřnice a podnikatele v oboru vlasové kosmetiky.

8.2. Registrací kupující prohlašuje, že je podnikatelem nebo zástupcem salonu a že bude zboží používat výhradně k profesionální činnosti.

8.3. Prodávající si vyhrazuje právo ověřit údaje uvedené při registraci (IČO, webové stránky, Instagram, reference) a registraci odmítnout bez udání důvodu.

8.4. B2B účet je aktivován až po schválení ze strany prodávajícího. Do té doby není možné se přihlásit ani zadávat objednávky.

8.5. Prodávající si vyhrazuje právo kdykoliv deaktivovat B2B účet v případě porušení těchto VOP nebo podezření na zneužití.`,
    },
    {
      title: "9. Ochrana osobních údajů",
      text: `9.1. Prodávající zpracovává osobní údaje kupujících v souladu s nařízením Evropského parlamentu a Rady (EU) 2016/679 (GDPR) a zákonem č. 110/2019 Sb., o zpracování osobních údajů.

9.2. Podrobné informace o zpracování osobních údajů naleznete na stránce:`,
      link: { href: "/privacy", label: "Zásady ochrany osobních údajů" },
    },
    {
      title: "10. Závěrečná ustanovení",
      text: `10.1. Tyto VOP nabývají účinnosti dnem jejich zveřejnění na webových stránkách hairland.cz.

10.2. Prodávající si vyhrazuje právo tyto VOP kdykoli změnit. Změny jsou účinné okamžikem jejich zveřejnění na webu. Pro již uzavřené smlouvy platí VOP účinné v době uzavření smlouvy.

10.3. Vztahy neupravené těmito VOP se řídí právním řádem České republiky, zejména zákonem č. 89/2012 Sb., občanský zákoník, v platném znění.

10.4. V případě sporů je příslušný soud v České republice dle sídla prodávajícího.

10.5. Je-li některé ustanovení těchto VOP neplatné nebo nevymahatelné, nemá to vliv na platnost ostatních ustanovení.`,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-ink mb-2">
        Všeobecné obchodní podmínky
      </h1>
      <p className="text-sm text-muted mb-8">
        Alvento Solutions s.r.o. — hairland.cz
      </p>

      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold text-ink mb-2">
              {section.title}
            </h2>
            <p className="text-sm text-muted leading-relaxed whitespace-pre-line">
              {section.text}
            </p>
            {section.link && (
              <Link
                href={section.link.href}
                className="inline-block mt-2 text-sm text-rose hover:text-rose-deep underline"
              >
                {section.link.label}
              </Link>
            )}
          </section>
        ))}
      </div>

      <p className="mt-12 text-sm text-muted">
        Poslední aktualizace: červen 2026
      </p>
    </div>
  );
}
