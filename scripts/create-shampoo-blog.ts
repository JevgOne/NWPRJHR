import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const remoteUrl = process.env.TURSO_DATABASE_URL?.replace(/\s+/g, "");
const authToken = process.env.TURSO_AUTH_TOKEN?.replace(/\s+/g, "");

const adapter = new PrismaLibSql({ url: remoteUrl!, authToken });
const prisma = new PrismaClient({ adapter });

const SLUG = "sampon-pro-prodlouzene-vlasy";

const CONTENT = `Prodloužené vlasy nedostávají maz z pokožky hlavy, takže každé mytí jim vlhkost jen bere a nic jim ji nevrací. Poškození je nevratné. Šampon je navíc jediný přípravek, který se dostává přímo ke spojům (keratin, páska, kroužek). Proto pro něj platí přísnější pravidla než pro kondicionér nebo sérum, které nanášíte jen na délky.

Prošli jsme složení desítek šamponů z drogerií, lékáren i salonových e-shopů. Tady je výsledek.

## Past jménem „bez sulfátů"

Nápis „bez sulfátů" na obalu často znamená jen to, že ve výrobku chybí jeden konkrétní sulfát. Místo něj bývá jiná, podobně silná čisticí látka:

- **Sodium C14-16 Olefin Sulfonate** — chemicky to není sulfát, ale vlasy vysušuje podobně
- **Sodium Coco-Sulfate** — sulfát z kokosu, častý v „přírodní" kosmetice
- **Sodium Chloride (sůl)** — zahušťuje šampon

Nevyhnou se tomu ani šampony, které se prodávají přímo pro prodloužené vlasy. Čtěte složení, ne nápisy na obalu.

## Naše 3 pravidla

Látky ve složení jsou seřazené podle množství, takže nejvíc rozhoduje prvních 5 položek.

- **Žádné agresivní čisticí látky.** Ve složení nesmí být Sodium Lauryl Sulfate (SLS), Sodium Laureth Sulfate (SLES), Ammonium Lauryl Sulfate, Sodium Coco-Sulfate ani Sodium C14-16 Olefin Sulfonate.
- **Žádné silikony.** Nic, co končí na -cone, -conol nebo -siloxane.
- **Sůl, alkohol (Alcohol Denat.), oleje a másla** nesmí být mezi prvními pěti složkami. Ve stopovém množství na konci složení nevadí.

Hledejte naopak tyto šetrné čisticí látky: Sodium Cocoyl Isethionate, Sodium Lauroyl Methyl Isethionate, Sodium Lauroyl Sarcosinate, Sodium Cocoyl Glutamate, Coco-Glucoside, Decyl Glucoside, Betaine.

## Doporučené šampony

### Drogerie a přírodní e-shopy

- **alverde Ultra Sensitiv (dm)** — Nejčistší složení, jaké v drogerii najdete: glycerin, Coco-Glucoside, Betaine a pár pomocných látek. Neobsahuje sulfáty, silikony, parfemaci ani alkohol. Pozor, ostatní šampony alverde obsahují sulfát i sůl.
- **Herbal Essences Aloe + avokádový olej (Rossmann)** — Šetrné čisticí látky, bez soli a bez silikonů. Olej a alkohol jsou až na konci složení, tedy jen ve stopovém množství.
- **Coslys šampon bez sulfátů, broskev** — Hlavní čisticí látkou je Sodium Cocoyl Glutamate, bez silikonů. Sůl je na 6. místě složení, takže těsně splňuje naše pravidlo.

### Salonová péče

- **Color Wow Color Security** (od cca 420 Kč / 250 ml) — Pro prodloužené vlasy vychází nejlépe. Kombinuje několik šetrných čisticích látek a neobsahuje silikony, sůl ani oleje. Z vlasů se úplně vymyje a nezanechá na nich žádné zbytky, což je u spojů ideální.
- **Pureology Hydrate Sheer** — Lehčí verze šamponu Hydrate. Hlavní čisticí látkou je Sodium Cocoyl Isethionate, neobsahuje silikony ani oleje. Pozor, neplést s klasickým Pureology Hydrate, který silikony obsahuje.
- **Olaplex No.4 Fine** — Verze pro jemné vlasy. Myje šetrnými čisticími látkami a neobsahuje silikony ani oleje. Pozor, klasický Olaplex No.4 silikon obsahuje.
- **Davines Heart of Glass Silkening Shampoo** — Pro blond vlasy. Myje isethionátem, betainem a glukosidem, silikony v celé řadě nejsou. Navíc odstraňuje usazeniny z tvrdé vody a obsahuje pigment proti žlutému nádechu, takže je ideální pro blond prodloužení.

### Luxus: žádný šampon naše pravidla nesplnil

Vyšší cena neznamená šetrnější složení. Prověřili jsme:

- **Balmain Hair Couture Moisturizing** — SLES hned na 2. místě
- **K18 Peptide Prep** — Olefin Sulfonate jako hlavní čisticí látka
- **Christophe Robin Hydrating Aloe Vera** — Ammonium Lauryl Sulfate
- **Oribe Gold Lust** — silikon Dimethicone na předních místech
- **Kevin Murphy Hydrate-Me Wash** — silikony
- **Maria Nila True Soft** — oleje na předních místech a silikon

**Závěr: nejlepší šampon na prodloužené vlasy stojí kolem 400 Kč. Víc platit nemusíte.**

## Pozor na tyto „šetrné" šampony

- **Šampony přímo pro prodloužené vlasy:** Framesi Morphosis Love Extension i Malibu C Un-Do-Goo obsahují Olefin Sulfonate.
- **Balea Sensitive** — obsahuje SLES a sůl
- **Balea natural beauty Rozmarýn & Šalvěj** — Olefin Sulfonate, sůl a alkohol
- **Taft curl & shine** — silikon Amodimethicone
- **Garnier Fructis Hair Food Aloe Vera** — SLES + sůl

## Jak poznat složení

Složení (INCI) najdete na zadní straně obalu. Na e-shopech bývá v záložce „složení" nebo „INCI". Látky jsou seřazené od nejvyššího zastoupení po nejnižší — proto je klíčové prvních 5 položek.

Pokud složení na e-shopu nenajdete, nehledejte dál a vyberte šampon, u kterého ho vidíte. Chybějící INCI na produktové stránce je varovný signál.

## Shrnutí

1. Čtěte složení, ne marketing na obalu
2. Žádné sulfáty, silikony, sůl a alkohol v prvních 5 složkách
3. Nejlepší volba v drogerii: alverde Ultra Sensitiv
4. Nejlepší salonový šampon: Color Wow Color Security
5. Luxusní šampony naše pravidla nesplnil ani jeden
6. Šampon nanášejte jen na kořínky, nikdy přímo na spoje

Máte dotaz ke konkrétnímu šamponu? [Napište nám](/kontakt) — rádi prověříme složení za vás.`;

async function main() {
  // Check if already exists
  const existing = await prisma.blogPost.findUnique({ where: { slug: SLUG } });
  if (existing) {
    console.log(`Blog post "${SLUG}" already exists (id: ${existing.id}). Updating...`);
    await prisma.blogPost.update({
      where: { slug: SLUG },
      data: {
        title: "Šampon pro prodloužené vlasy: co opravdu funguje",
        content: CONTENT,
        excerpt: "Prodloužené vlasy nedostávají maz z pokožky hlavy, takže každé mytí jim vlhkost jen bere. Prošli jsme složení desítek šamponů — tady je výsledek.",
        category: "care",
        published: false,
        metaTitle: "Šampon pro prodloužené vlasy — test složení 2026 | Hairland",
        metaDescription: "Prošli jsme složení desítek šamponů z drogerií, lékáren i salonů. Tady je výsledek — 3 pravidla, doporučené šampony a na co si dát pozor.",
      },
    });
    console.log("Updated successfully!");
  } else {
    const post = await prisma.blogPost.create({
      data: {
        slug: SLUG,
        title: "Šampon pro prodloužené vlasy: co opravdu funguje",
        content: CONTENT,
        excerpt: "Prodloužené vlasy nedostávají maz z pokožky hlavy, takže každé mytí jim vlhkost jen bere. Prošli jsme složení desítek šamponů — tady je výsledek.",
        category: "care",
        published: false,
        metaTitle: "Šampon pro prodloužené vlasy — test složení 2026 | Hairland",
        metaDescription: "Prošli jsme složení desítek šamponů z drogerií, lékáren i salonů. Tady je výsledek — 3 pravidla, doporučené šampony a na co si dát pozor.",
      },
    });
    console.log(`Created blog post: ${post.id} (slug: ${post.slug})`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
