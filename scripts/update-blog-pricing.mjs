/**
 * Update blog post "kolik-stoji-prodlouzeni-vlasu-2026" with improved content
 * optimized for Google AI Overview extraction.
 *
 * Run: node --env-file=.env.production.local scripts/update-blog-pricing.mjs
 */
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL?.replace(/\s+/g, ""),
  authToken: process.env.TURSO_AUTH_TOKEN?.replace(/\s+/g, ""),
});
const prisma = new PrismaClient({ adapter });

const SLUG = "kolik-stoji-prodlouzeni-vlasu-2026";

const contentCs = `## Kolik stojí prodloužení vlasů v roce 2026?

Celková cena prodloužení vlasů se obvykle pohybuje **od 4 000 do 18 000 Kč** (vlasy + aplikace). Závisí na třech věcech: **kvalitě vlasů**, **metodě prodloužení** a **množství vlasů**. V tomto článku najdete konkrétní ceny podle metody včetně příkladů celkové kalkulace.

## Z čeho se skládá cena prodloužení vlasů?

Celková cena = **vlasy (materiál)** + **práce kadeřnice** + **údržba (přeaplikace)**

- **Vlasy**: 50–70 % celkové ceny. Panenské vlasy stojí víc, ale vydrží 12–24 měsíců a dají se přeaplikovat 2–3×.
- **Aplikace**: 20–35 % celkové ceny. Závisí na metodě a počtu pramenů/pásek.
- **Údržba**: 10–20 % ročních nákladů. Přeaplikace každých 6–12 týdnů.

## Kolik stojí clip-in prodloužení vlasů?

Clip-in vlasy si nasadíte samy doma — nepotřebujete kadeřnici.

- **Vlasy (sada 100–150 g):** 3 000–8 000 Kč
- **Práce kadeřnice:** 0 Kč (nasadíte si samy)
- **Údržba:** minimální — speciální šampon a kartáč
- **Životnost:** 12–18 měsíců při správné péči

**Příklad celkové ceny:** Clip-in sada 120 g / 50 cm z panenských vlasů = **přibližně 5 500 Kč**. Žádné další náklady na aplikaci.

Clip-in je nejlevnější metoda prodloužení — ideální pro příležitostné nošení.

## Kolik stojí tape-in prodloužení vlasů?

Tape-in (vlasy na páskách) je oblíbená metoda pro rychlou a šetrnou aplikaci.

- **Vlasy (40–80 pásek, cca 100 g):** 4 000–12 000 Kč
- **Aplikace (nasazení):** 1 500–3 000 Kč (trvá 60–90 minut)
- **Přeaplikace (korekce):** 800–1 500 Kč každých 6–8 týdnů
- **100 g = přibližně 40 pásek**, cena za pásek od **100 Kč**
- **Životnost vlasů:** 6–12 měsíců (2–3 přeaplikace)

**Příklad celkové ceny:** Vlasy 50 cm / 100 g (6 000 Kč) + první nasazení (2 000 Kč) = **přibližně 8 000 Kč**. Roční náklady včetně 4–5 přeaplikací: **12 000–15 000 Kč**.

## Kolik stojí keratinové prodloužení vlasů?

Keratinové prodloužení (bonding) je nejtrvanlivější metoda — vlasy drží 3–4 měsíce bez korekce.

- **Vlasy (100–200 pramenů, cca 100 g):** 5 000–15 000 Kč
- **Aplikace (nasazení):** 3 000–5 000 Kč (trvá 2–4 hodiny)
- **Korekce (přeaplikace):** 2 000–4 000 Kč každé 3–4 měsíce
- **100 g = přibližně 130 pramenů**, cena za pramen od **40 Kč**
- **Životnost vlasů:** 12–24 měsíců (3–6 přeaplikací)

**Příklad celkové ceny:** Vlasy 50 cm / 100 g (7 000 Kč) + nasazení (4 000 Kč) = **přibližně 11 000 Kč**. Roční náklady včetně 3 přeaplikací: **17 000–22 000 Kč**.

## Kolik stojí micro ring prodloužení vlasů?

Micro ring (micro loop) je beztepelná metoda — vlasy se připojují kroužky bez lepidla.

- **Vlasy (100–200 pramenů, cca 100 g):** 5 000–15 000 Kč
- **Aplikace (nasazení):** 2 500–4 000 Kč (trvá 2–3 hodiny)
- **Korekce (posun):** 1 500–3 000 Kč každých 8–12 týdnů
- **100 g = přibližně 150 pramenů**, cena za pramen od **35 Kč**
- **Životnost vlasů:** 12–18 měsíců (3–4 přeaplikace)

**Příklad celkové ceny:** Vlasy 50 cm / 100 g (7 000 Kč) + nasazení (3 000 Kč) = **přibližně 10 000 Kč**. Roční náklady včetně 4 přeaplikací: **16 000–20 000 Kč**.

## Kolik stojí tresy (weft) prodloužení vlasů?

Tresy jsou široké pásy vlasů všité nebo přilepené k vlastním vlasům — rychlá aplikace pro velký objem.

- **Vlasy (1–3 tresy, cca 100–150 g):** 5 000–12 000 Kč
- **Aplikace:** 1 500–3 000 Kč (trvá 45–90 minut)
- **Korekce:** 1 000–2 000 Kč každých 6–8 týdnů
- **Životnost vlasů:** 6–12 měsíců

**Příklad celkové ceny:** Vlasy 50 cm / 120 g (7 500 Kč) + nasazení (2 000 Kč) = **přibližně 9 500 Kč**.

## Co ovlivňuje cenu prodloužení vlasů?

### Délka vlasů
- **30–40 cm:** základní cena
- **50–60 cm:** +30–50 % oproti základu
- **70+ cm:** +80–120 % oproti základu

### Kvalita vlasů
- **Asijské (čínské, indické):** nejnižší cena, tužší textura, vydrží 3–6 měsíců
- **Remy:** střední cena, zachovaná kutikula, 6–12 měsíců
- **Panenské (Virgin):** nejvyšší cena, neošetřené, 12–24 měsíců — nejlepší investice

### Množství (gramáž)
- **Přidání objemu:** 50–80 g (od 3 000 Kč za vlasy)
- **Přirozené prodloužení:** 80–120 g (od 5 000 Kč za vlasy)
- **Plné prodloužení:** 120–200 g (od 8 000 Kč za vlasy)

## Srovnání metod prodloužení vlasů — přehledná tabulka

- **Clip-in:** celkem od 3 000 Kč, životnost 12–18 měsíců, nasadíte samy
- **Tape-in:** celkem od 5 000 Kč, životnost 6–12 měsíců, korekce po 6–8 týdnech
- **Keratin:** celkem od 7 000 Kč, životnost 12–24 měsíců, korekce po 3–4 měsících
- **Micro ring:** celkem od 7 000 Kč, životnost 12–18 měsíců, korekce po 8–12 týdnech
- **Tresy (weft):** celkem od 6 500 Kč, životnost 6–12 měsíců, korekce po 6–8 týdnech

## Jak ušetřit na prodloužení vlasů?

- **Kupujte vlasy přímo od dodavatele** — salony přidávají marži 50–100 %. V Hairland prodáváme vlasy přímo z importu bez prostředníků.
- **Investujte do panenských vlasů** — levné vlasy za 2 000 Kč vyměníte 4× za rok = 8 000 Kč. Panenské za 7 000 Kč vydrží celý rok.
- **Pečujte správně** — správná [péče o vlasy](/pece-o-vlasy) prodlouží životnost o měsíce.
- **Zvažte clip-in** pro příležitostné nošení — nejnižší roční náklady.
- **Přeaplikujte včas** — pozdní přeaplikace poškozuje vlastní vlasy a zkracuje životnost.

## Aktuální ceník vlasů v Hairland

V Hairland nabízíme prémiové panenské vlasy z přímého importu za férové ceny. Aktuální [ceník vlasů](/cenik-vlasy) najdete na stránce ceníku. Podívejte se na [nabídku vlasů](/vlasy-k-prodlouzeni) nebo nás [kontaktujte](/kontakt) pro individuální kalkulaci.`;

const contentUk = `## Скільки коштує нарощування волосся у 2026 році?

Загальна ціна нарощування волосся зазвичай становить **від 4 000 до 18 000 Kč** (волосся + аплікація). Залежить від трьох факторів: **якості волосся**, **методу нарощування** та **кількості волосся**. У цій статті знайдете конкретні ціни за методом, включаючи приклади розрахунків.

## З чого складається ціна нарощування?

Загальна ціна = **волосся (матеріал)** + **робота майстра** + **догляд (перенарощування)**

- **Волосся**: 50–70 % загальної ціни. Незаймане волосся коштує більше, але тримається 12–24 місяці.
- **Аплікація**: 20–35 % загальної ціни. Залежить від методу та кількості пасом.
- **Догляд**: 10–20 % річних витрат. Перенарощування кожні 6–12 тижнів.

## Скільки коштує clip-in нарощування?

Clip-in волосся надягаєте самі вдома — майстер не потрібен.

- **Волосся (сет 100–150 г):** 3 000–8 000 Kč
- **Робота:** 0 Kč
- **Термін служби:** 12–18 місяців

**Приклад ціни:** Clip-in сет 120 г / 50 см = **приблизно 5 500 Kč**.

## Скільки коштує tape-in нарощування?

- **Волосся (40–80 стрічок, ~100 г):** 4 000–12 000 Kč
- **Аплікація:** 1 500–3 000 Kč (60–90 хвилин)
- **Корекція:** 800–1 500 Kč кожні 6–8 тижнів
- **100 г = приблизно 40 стрічок**, ціна за стрічку від **100 Kč**

**Приклад ціни:** Волосся 50 см / 100 г (6 000 Kč) + аплікація (2 000 Kč) = **приблизно 8 000 Kč**.

## Скільки коштує кератинове нарощування?

- **Волосся (100–200 пасом, ~100 г):** 5 000–15 000 Kč
- **Аплікація:** 3 000–5 000 Kč (2–4 години)
- **Корекція:** 2 000–4 000 Kč кожні 3–4 місяці
- **100 г = приблизно 130 пасом**, ціна за пасмо від **40 Kč**

**Приклад ціни:** Волосся 50 см / 100 г (7 000 Kč) + аплікація (4 000 Kč) = **приблизно 11 000 Kč**.

## Скільки коштує micro ring нарощування?

- **Волосся (100–200 пасом, ~100 г):** 5 000–15 000 Kč
- **Аплікація:** 2 500–4 000 Kč (2–3 години)
- **Корекція:** 1 500–3 000 Kč кожних 8–12 тижнів
- **100 г = приблизно 150 пасом**, ціна за пасмо від **35 Kč**

**Приклад ціни:** Волосся 50 см / 100 г (7 000 Kč) + аплікація (3 000 Kč) = **приблизно 10 000 Kč**.

## Що впливає на ціну?

### Довжина
- **30–40 см:** базова ціна
- **50–60 см:** +30–50 %
- **70+ см:** +80–120 %

### Якість
- **Азійське:** найнижча ціна, 3–6 місяців
- **Remy:** середня ціна, 6–12 місяців
- **Virgin (незаймане):** найвища ціна, 12–24 місяці

### Кількість
- **Додавання об'єму:** 50–80 г (від 3 000 Kč)
- **Природне нарощування:** 80–120 г (від 5 000 Kč)
- **Повне нарощування:** 120–200 г (від 8 000 Kč)

## Як заощадити?

- **Купуйте напряму** — салони додають 50–100 % націнки
- **Інвестуйте в якість** — дешеве волосся обійдеться дорожче за рік
- **Доглядайте правильно** — правильний [догляд](/pece-o-vlasy) подовжує термін служби

## Актуальний прайс-лист Hairland

У Hairland ми пропонуємо преміальне волосся з прямого імпорту. Перегляньте [прайс-лист](/cenik-vlasy) або [каталог волосся](/vlasy-k-prodlouzeni).`;

const contentRu = `## Сколько стоит наращивание волос в 2026 году?

Общая стоимость наращивания волос обычно составляет **от 4 000 до 18 000 Kč** (волосы + работа). Зависит от трёх факторов: **качества волос**, **метода наращивания** и **количества волос**. В этой статье — конкретные цены по методам с примерами расчётов.

## Из чего складывается цена наращивания?

Общая цена = **волосы (материал)** + **работа мастера** + **уход (перенаращивание)**

- **Волосы**: 50–70 % общей стоимости. Девственные волосы дороже, но держатся 12–24 месяца.
- **Работа**: 20–35 % общей стоимости. Зависит от метода и количества прядей.
- **Уход**: 10–20 % годовых расходов. Перенаращивание каждые 6–12 недель.

## Сколько стоит clip-in наращивание?

Clip-in волосы надеваете сами — мастер не нужен.

- **Волосы (набор 100–150 г):** 3 000–8 000 Kč
- **Работа:** 0 Kč
- **Срок службы:** 12–18 месяцев

**Пример цены:** Clip-in набор 120 г / 50 см = **примерно 5 500 Kč**.

## Сколько стоит tape-in наращивание?

- **Волосы (40–80 лент, ~100 г):** 4 000–12 000 Kč
- **Работа:** 1 500–3 000 Kč (60–90 минут)
- **Коррекция:** 800–1 500 Kč каждые 6–8 недель
- **100 г = примерно 40 лент**, цена за ленту от **100 Kč**

**Пример цены:** Волосы 50 см / 100 г (6 000 Kč) + работа (2 000 Kč) = **примерно 8 000 Kč**.

## Сколько стоит кератиновое наращивание?

- **Волосы (100–200 прядей, ~100 г):** 5 000–15 000 Kč
- **Работа:** 3 000–5 000 Kč (2–4 часа)
- **Коррекция:** 2 000–4 000 Kč каждые 3–4 месяца
- **100 г = примерно 130 прядей**, цена за прядь от **40 Kč**

**Пример цены:** Волосы 50 см / 100 г (7 000 Kč) + работа (4 000 Kč) = **примерно 11 000 Kč**.

## Сколько стоит micro ring наращивание?

- **Волосы (100–200 прядей, ~100 г):** 5 000–15 000 Kč
- **Работа:** 2 500–4 000 Kč (2–3 часа)
- **Коррекция:** 1 500–3 000 Kč каждые 8–12 недель
- **100 г = примерно 150 прядей**, цена за прядь от **35 Kč**

**Пример цены:** Волосы 50 см / 100 г (7 000 Kč) + работа (3 000 Kč) = **примерно 10 000 Kč**.

## Что влияет на цену?

### Длина
- **30–40 см:** базовая цена
- **50–60 см:** +30–50 %
- **70+ см:** +80–120 %

### Качество
- **Азиатские:** самая низкая цена, 3–6 месяцев
- **Remy:** средняя цена, 6–12 месяцев
- **Virgin (девственные):** высшая цена, 12–24 месяца

### Количество
- **Добавление объёма:** 50–80 г (от 3 000 Kč)
- **Естественное наращивание:** 80–120 г (от 5 000 Kč)
- **Полное наращивание:** 120–200 г (от 8 000 Kč)

## Как сэкономить?

- **Покупайте напрямую** — салоны добавляют 50–100 % наценки
- **Инвестируйте в качество** — дешёвые волосы обойдутся дороже за год
- **Ухаживайте правильно** — правильный [уход](/pece-o-vlasy) продлевает срок службы

## Актуальный прайс-лист Hairland

В Hairland мы предлагаем премиальные волосы из прямого импорта. Посмотрите [прайс-лист](/cenik-vlasy) или [каталог волос](/vlasy-k-prodlouzeni).`;

async function main() {
  const post = await prisma.blogPost.findUnique({
    where: { slug: SLUG },
    select: { id: true, slug: true, title: true },
  });

  if (!post) {
    console.error(`Blog post "${SLUG}" not found!`);
    process.exit(1);
  }

  console.log(`Updating: [${post.slug}] "${post.title}"`);

  await prisma.blogPost.update({
    where: { id: post.id },
    data: {
      content: contentCs,
      contentUk,
      contentRu,
      metaTitle: "Kolik stojí prodloužení vlasů 2026 — ceny clip-in, tape-in, keratin, micro ring",
      metaDescription: "Kolik stojí prodloužení vlasů v roce 2026? Ceny od 3 000 Kč (clip-in) do 18 000 Kč (keratin). Kompletní cenový přehled s příklady kalkulací — vlasy, práce i údržba.",
      excerpt: "Kolik stojí prodloužení vlasů? Ceny od 3 000 Kč (clip-in) do 18 000 Kč (keratin). Konkrétní ceny podle metody včetně příkladů celkové kalkulace.",
      excerptUk: "Скільки коштує нарощування волосся? Ціни від 3 000 Kč (clip-in) до 18 000 Kč (кератин). Конкретні ціни за методом з прикладами розрахунків.",
      excerptRu: "Сколько стоит наращивание волос? Цены от 3 000 Kč (clip-in) до 18 000 Kč (кератин). Конкретные цены по методам с примерами расчётов.",
      updatedAt: new Date(),
    },
  });

  console.log("Done! Updated content, meta title, meta description, and excerpts.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
