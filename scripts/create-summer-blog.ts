import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const remoteUrl = process.env.TURSO_DATABASE_URL?.replace(/\s+/g, "");
const authToken = process.env.TURSO_AUTH_TOKEN?.replace(/\s+/g, "");

const adapter = new PrismaLibSql({ url: remoteUrl!, authToken });
const prisma = new PrismaClient({ adapter });

const SLUG = "prodlouzene-vlasy-more-sport-sauna";

const CONTENT = `Prodloužené vlasy mají jedno zásadní omezení: nedokáží se samy regenerovat. Vlastní vlasy dorůstají a poškozená část se postupně vystříhá. Prodloužené vlasy tuhle možnost nemají — co se poškodí, zůstane poškozené až do výměny.

Tohle je potřeba mít na paměti vždy, když jdete k vodě, do posilovny nebo na dovolenou. Neznamená to, že si nemůžete užívat — stačí pár jednoduchých kroků.

## Moře a slaná voda

Slaná voda je pro prodloužené vlasy nejagresivnější prostředí, na které narazíte. Sůl krystalizuje na vlasu, vysušuje ho a vytahuje barvu. U blond prodloužení může po pár dnech bez ochrany dojít k viditelnému vyblednutí.

### Co dělat

1. **Před vstupem do moře** vlasy navlhčete čistou vodou — nasycený vlas nepřijme tolik soli
2. **Naneste ochranný sprej nebo olej** s UV filtrem (beach spray pro vlasy, ne opalovací krém)
3. **Vlasy sepněte** do copu nebo použijte koupací čepici
4. **Ihned po koupání propláchněte** čistou vodou — čím déle sůl na vlasech zůstane, tím větší škoda
5. **Večer** použijte hydratační masku a olej na konečky

### Čemu se vyhnout

- Nesušte vlasy na přímém slunci po moři — sůl + UV = dvojnásobné poškození
- Nečešte vlasy plné soli — mohly by se trhat
- Nepoužívejte fén ihned po moři, nejdřív propláchněte

### Kolik dní u moře vlasy vydrží?

S ochranou (sprej, propláchnutí, maska každý večer) vydrží prodloužené vlasy 7–10 dní u moře v pěkném stavu. Bez ochrany se viditelné poškození projeví už po 3–4 dnech.

## Bazén a chlor

Chlorovaná voda je o něco šetrnější než mořská, ale má jiný problém: u blond vlasů může způsobit zelený nádech. U tmavších vlasů chlor způsobuje vyblednutí a suchost.

### Co dělat

1. **Navlhčete vlasy čistou vodou** před vstupem do bazénu
2. **Naneste ochranný sprej** nebo kondicionér ve spreji (leave-in)
3. **Používejte koupací čepici** — u bazénu je mnohem praktičtější než u moře
4. **Po plavání okamžitě propláchněte** vlasy čistou vodou
5. **Jednou týdně** použijte šampon s chelátovými složkami (odstraňuje minerální usazeniny)

### Zelený nádech u blond vlasů

Zelený nádech způsobuje měď rozpuštěná v bazénové vodě, ne chlor samotný. Pokud už k tomu došlo:
- Použijte šampon s EDTA nebo kyselinou citronovou (chelátový šampon)
- Profesionální řešení: Malibu C Hard Water Wellness Remedy
- **Nikdy nepoužívejte kečup ani aspirin** — lidové rady, které nic nevyřeší a vlasy poškodí

## Sport a pot

Pot obsahuje sůl a amoniak — obojí vlasy vysušuje. Navíc při intenzivním pohybu se vlasy trhají o oblečení, čelenky a gumičky.

### Co dělat

1. **Vlasy sepněte do volného copu** nad spoji — ne culík, ne drdol v místě spojů
2. **Po tréninku vlasy propláchněte** nebo alespoň použijte bezoplachový sprej
3. **Pokud nechcete mýt vlasy po každém tréninku** — suchý šampon na kořínky a propláchnutí délek vodou stačí
4. **Na jógu a pilates** — copánek, žádná těsná čelenka přes spoje

### Posilovna — konkrétní pravidla

- Při cvicích vleže (bench press, leg curl) leží vlasy pod váhou těla → vždy spleťte dopředu
- Při cardiu se vlasy potí nejvíc u kořínků → po tréninku prosušte spoje fénem na studenou
- **Spoje musí být suché** — pot je rozvolňuje stejně jako voda

## Sauna a páry

Horký, vlhký vzduch rozvolňuje keratinové spoje a oslabuje lepidlo tape-in pásek. Infrasauna je šetrnější než finská sauna, ale pravidla platí pro obě.

### Co dělat

1. **Vlasy vždy sepněte a zakryjte** — ručník nebo speciální čepice na saunu
2. **Po sauně vlasy nechoďte chladit studenou vodou** jako tělo — teplotní šok na spoje
3. **Nechte vlasy volně vychladnout** a pak je propláchněte vlahou vodou
4. **Po sauně** naneste olej na konečky

### Jak často je bezpečné

- **S ochranou:** 1–2× týdně, bez problémů
- **Bez ochrany:** každá návštěva zkracuje životnost spojů
- **Parní sauna** je agresivnější než suchá — pára proniká do spojů rychleji

## Slunce a UV záření

UV záření rozbíjí proteinovou strukturu vlasu. U přírodních vlasů to kompenzuje melanin a tvorba nového keratinu. Prodloužené vlasy se nebráni — UV poškození je kumulativní.

### Co dělat

1. **Používejte sprej s UV filtrem** — nanášejte po délce, každé 2–3 hodiny na přímém slunci
2. **Noste klobouk nebo šátek** při celodenním pobytu venku
3. **Vyhněte se soláriu** — koncentrované UV je horší než přirozené slunce

### Proč blond vlasy trpí víc

Světlé vlasy mají méně melaninu, který funguje jako přirozený UV filtr. Proto blond prodloužení vybledne rychleji a potřebuje intenzivnější UV ochranu.

## Cestovatelský balíček pro prodloužené vlasy

Na dovolenou si zabalte:

- **Bezoplachový kondicionér ve spreji** — nejuniverzálnější přípravek, použijete ho po koupání, po sportu, ráno i večer
- **Ochranný sprej s UV filtrem** — na pláž a celodenní pobyty venku
- **Malá hydratační maska** (cestovní balení) — na večerní regeneraci
- **Olej na konečky** — stačí malá lahvička, 2–3 kapky denně
- **Hedvábná/saténová gumička** — netahá spoje, nezanechává otisky
- **Kartáč na prodloužené vlasy** — loop brush nebo tangle teezer, bez kovových částí

## 5 pravidel jednou větou

1. Před vodou navlhčit a chránit
2. Po vodě ihned propláchnout
3. Spoje vždy vysušit
4. UV sprej na slunce
5. Večer maska + olej

Správná ochrana neznamená omezení — znamená, že si vlasy užijete déle.

Potřebujete poradit s konkrétní situací? [Napište nám](/kontakt) — poradíme, co zabalit a jak se připravit.`;

async function main() {
  const existing = await prisma.blogPost.findUnique({ where: { slug: SLUG } });
  if (existing) {
    console.log(`Blog post "${SLUG}" already exists (id: ${existing.id}). Updating...`);
    await prisma.blogPost.update({
      where: { slug: SLUG },
      data: {
        title: "Prodloužené vlasy u moře, v bazénu, při sportu a v sauně",
        content: CONTENT,
        excerpt: "Slaná voda, chlor, pot i UV záření — prodloužené vlasy se nedokáží samy regenerovat. Kompletní návod co dělat a čemu se vyhnout.",
        category: "care",
        published: false,
        metaTitle: "Prodloužené vlasy u moře a při sportu — jak je chránit | Hairland",
        metaDescription: "Co dělat s prodlouženými vlasy u moře, v bazénu, při sportu a v sauně? Praktický návod na ochranu spojů, vlasů i barvy. Čtěte před dovolenou.",
      },
    });
    console.log("Updated successfully!");
  } else {
    const post = await prisma.blogPost.create({
      data: {
        slug: SLUG,
        title: "Prodloužené vlasy u moře, v bazénu, při sportu a v sauně",
        content: CONTENT,
        excerpt: "Slaná voda, chlor, pot i UV záření — prodloužené vlasy se nedokáží samy regenerovat. Kompletní návod co dělat a čemu se vyhnout.",
        category: "care",
        published: false,
        metaTitle: "Prodloužené vlasy u moře a při sportu — jak je chránit | Hairland",
        metaDescription: "Co dělat s prodlouženými vlasy u moře, v bazénu, při sportu a v sauně? Praktický návod na ochranu spojů, vlasů i barvy. Čtěte před dovolenou.",
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
