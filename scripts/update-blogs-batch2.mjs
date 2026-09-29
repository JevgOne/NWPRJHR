/**
 * Update remaining 8 blog posts with question-based H2 headings.
 * Run: node --env-file=.env.production.local scripts/update-blogs-batch2.mjs
 */
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL?.replace(/\s+/g, ""),
  authToken: process.env.TURSO_AUTH_TOKEN?.replace(/\s+/g, ""),
});
const prisma = new PrismaClient({ adapter });

const updates = [

// ═══════════════════════════════════════════════════════════
// 1. 5 důvodů proč investovat do kvalitních vlasů
// ═══════════════════════════════════════════════════════════
{
  slug: "5-duvodu-proc-investovat-do-kvalitnich-vlasu",
  content: `## Vyplatí se investovat do dražších vlasů na prodloužení?

Ano — a tady je 5 důvodů proč. Rozdíl mezi levnými a prémiovými vlasy se projeví už během prvních týdnů. A hlavně: **za dva roky zaplatíte za levné vlasy víc** než za jedny kvalitní.

## Jak dlouho vydrží kvalitní vlasy vs levné?

- **Panenské (Virgin) vlasy:** 12–24 měsíců, lze přeaplikovat 2–3×
- **Remy vlasy:** 6–12 měsíců, 1–2 přeaplikace
- **Levné (non-Remy) vlasy:** 1–3 měsíce, žádná přeaplikace

**Příklad kalkulace:** Virgin vlasy za **7 000 Kč** vydrží 18 měsíců. Levné vlasy za **2 000 Kč** vyměníte 6× za stejnou dobu = **12 000 Kč**. Kvalitní vlasy ušetří **5 000 Kč**.

## Vypadají kvalitní vlasy přirozeněji?

Ano — prémiové vlasy mají zachovanou kutikulu, která odráží světlo rovnoměrně. Výsledek: **hedvábný lesk a přirozený pohyb**, který nelze uměle napodobit. Levné vlasy mají silikonový coating, který po pár mytích zmizí a vlasy ztratí lesk.

## Lze kvalitní vlasy barvit a stylovat?

- **Kvalitní (Virgin/Remy):** Ano — barvení, tónování, kulma, žehlička, fén. Stejně jako vlastní vlasy.
- **Levné (non-Remy):** Ne — chemicky zpracované vlasy další procedury nezvládnou a poškodí se.

## Jsou kvalitní vlasy šetrnější k vlastním vlasům?

Ano. Prémiové vlasy jsou **lehčí** a mají kvalitnější spoje. Méně tahání na kořínky = méně poškození vlastních vlasů. Po sundání prodloužení jsou vaše vlasy v lepším stavu.

## Kolikrát lze kvalitní vlasy přeaplikovat?

- **Virgin vlasy:** 2–3× bez ztráty kvality (úspora 10 000–20 000 Kč za rok)
- **Remy vlasy:** 1–2×
- **Levné vlasy:** 0× — po sundání jdou do koše

## Jak poznat kvalitní vlasy na prodloužení?

- **Test kutikulou:** Přejeďte prsty od konečků ke kořínkům. Kvalitní vlasy jsou hladké ve směru růstu, lehce drsné proti.
- **Test vodou:** Kvalitní vlasy nasají vodu pomaleji (zdravá kutikula).
- **Test tahem:** Kvalitní vlasy jsou pružné, nepraskají.
- **Cena:** Virgin vlasy pod **40 Kč/g jsou podezřelé** — pravděpodobně přeznačené asijské vlasy.

V Hairland nabízíme výhradně panenské vlasy s garancí původu. [Prohlédněte si nabídku](/vlasy-k-prodlouzeni) nebo si přečtěte náš [ceník](/cenik-vlasy).`,

  contentUk: `## Чи варто інвестувати в дорожче волосся для нарощування?

Так — і ось 5 причин. За два роки дешеве волосся обійдеться **дорожче** якісного.

## Як довго тримається якісне vs дешеве волосся?

- **Virgin:** 12–24 місяці, 2–3 перенарощування
- **Remy:** 6–12 місяців
- **Дешеве:** 1–3 місяці

**Приклад:** Virgin за **7 000 Kč** (18 місяців) vs дешеве 6× по **2 000 Kč** = **12 000 Kč**. Економія: **5 000 Kč**.

## Чи виглядає якісне волосся природніше?
Так — збережена кутикула дає **природний блиск**.

## Чи можна фарбувати якісне волосся?
Так — Virgin/Remy витримують фарбування, тонування, стайлінг.

## Скільки разів можна перенарощити?
- **Virgin:** 2–3×, **Remy:** 1–2×, **Дешеве:** 0×

## Як розпізнати якісне волосся?
- Тест кутикулою, тест водою, тест розтягуванням
- Virgin під **40 Kč/г = підозріло**

[Каталог](/vlasy-k-prodlouzeni) · [Прайс-лист](/cenik-vlasy).`,

  contentRu: `## Стоит ли инвестировать в дорогие волосы для наращивания?

Да — и вот 5 причин. За два года дешёвые волосы обойдутся **дороже** качественных.

## Как долго держатся качественные vs дешёвые?

- **Virgin:** 12–24 месяца, 2–3 перенаращивания
- **Remy:** 6–12 месяцев
- **Дешёвые:** 1–3 месяца

**Пример:** Virgin за **7 000 Kč** (18 месяцев) vs дешёвые 6× по **2 000 Kč** = **12 000 Kč**. Экономия: **5 000 Kč**.

## Выглядят ли качественные волосы естественнее?
Да — сохранённая кутикула даёт **естественный блеск**.

## Можно ли красить качественные волосы?
Да — Virgin/Remy выдерживают окрашивание, тонирование, стайлинг.

## Сколько раз можно перенаращивать?
- **Virgin:** 2–3×, **Remy:** 1–2×, **Дешёвые:** 0×

## Как распознать качественные волосы?
- Тест кутикулой, тест водой, тест на растяжение
- Virgin ниже **40 Kč/г = подозрительно**

[Каталог](/vlasy-k-prodlouzeni) · [Прайс-лист](/cenik-vlasy).`,
},

// ═══════════════════════════════════════════════════════════
// 2. Clip-in vs tape-in vs keratin — trojsrovnání
// ═══════════════════════════════════════════════════════════
{
  slug: "clip-in-vs-tape-in-vs-keratinove-prodlouzeni",
  content: `## Které prodloužení vlasů je nejlepší — clip-in, tape-in nebo keratin?

Tři nejpopulárnější metody prodloužení vlasů v jednom srovnání. Konkrétní ceny, životnost a pro koho se která hodí.

## Jak funguje clip-in prodloužení a kolik stojí?

Prameny s kovovými sponkami nasadíte a sundáte během pár minut — samy, doma.

- **Cena sady (100–150 g):** 3 000–8 000 Kč
- **Aplikace:** 5 minut, samy doma
- **Životnost:** 12–18 měsíců
- **Údržba:** žádná
- **Celkové roční náklady:** 3 000–8 000 Kč

**Ideální pro:** příležitostné nošení, první zkušenost, omezený rozpočet.

## Jak funguje tape-in prodloužení a kolik stojí?

Ultratenké pásky nalepené k vlasům. Aplikuje kadeřnice, nosíte 24/7.

- **Cena vlasů (100 g):** 4 000–12 000 Kč
- **Aplikace:** 1 500–3 000 Kč (60–90 min)
- **Přeaplikace:** 800–1 500 Kč každých 6–8 týdnů
- **Životnost vlasů:** 6–12 měsíců
- **Celkové roční náklady:** 10 000–20 000 Kč

**Ideální pro:** každodenní nošení, rychlou aplikaci, minimální údržbu.

## Jak funguje keratinové prodloužení a kolik stojí?

Jednotlivé prameny spojené keratinovou vazbou pomocí tepla. Nejdiskrétnější metoda.

- **Cena vlasů (100 g, ~130 pramenů):** 5 000–15 000 Kč
- **Aplikace:** 3 000–5 000 Kč (2–4 hodiny)
- **Korekce:** 2 000–4 000 Kč každé 3–4 měsíce
- **Životnost vlasů:** 12–24 měsíců
- **Celkové roční náklady:** 14 000–26 000 Kč

**Ideální pro:** nejpřirozenější výsledek, jemné vlasy, dlouhé intervaly mezi korekcemi.

## Které prodloužení je nejlevnější?

1. **Clip-in:** 3 000–8 000 Kč/rok (jednorázový nákup)
2. **Tape-in:** 10 000–20 000 Kč/rok (vlasy + přeaplikace)
3. **Keratin:** 14 000–26 000 Kč/rok (vlasy + korekce)

## Které prodloužení vypadá nejpřirozeněji?

1. **Keratin** — spoj 5 mm, téměř neviditelný
2. **Tape-in** — plochý spoj, splyne s vlasy
3. **Clip-in** — sponky mohou být vidět při větru

## Které prodloužení je nejšetrnější k vlasům?

1. **Clip-in** — žádné trvalé spoje
2. **Tape-in** — šetrné lepidlo
3. **Keratin** — teplo při aplikaci

## Jak se rozhodnout?

- **Chci to jen občas** → Clip-in
- **Chci nosit každý den** → Tape-in
- **Chci nejdiskrétnější výsledek** → Keratin
- **Mám jemné vlasy** → Tape-in nebo micro ring
- **Mám omezený rozpočet** → Clip-in

[Prohlédněte si nabídku](/vlasy-k-prodlouzeni) nebo nás [kontaktujte](/kontakt) pro poradenství.`,

  contentUk: `## Яке нарощування найкраще — clip-in, tape-in чи кератин?

Три найпопулярніші методи в одному порівнянні.

## Як працює clip-in і скільки коштує?
- **Ціна набору:** 3 000–8 000 Kč
- **Річні витрати:** 3 000–8 000 Kč
- Для: особливих подій, першого досвіду

## Як працює tape-in і скільки коштує?
- **Волосся:** 4 000–12 000 Kč + аплікація 1 500–3 000 Kč
- **Річні витрати:** 10 000–20 000 Kč
- Для: щоденного носіння

## Як працює кератин і скільки коштує?
- **Волосся:** 5 000–15 000 Kč + аплікація 3 000–5 000 Kč
- **Річні витрати:** 14 000–26 000 Kč
- Для: найприроднішого результату

## Як вирішити?
- Іноді → Clip-in, щоденно → Tape-in, найдискретніше → Кератин

[Каталог](/vlasy-k-prodlouzeni) · [Контакт](/kontakt).`,

  contentRu: `## Какое наращивание лучше — clip-in, tape-in или кератин?

Три самых популярных метода в одном сравнении.

## Как работает clip-in и сколько стоит?
- **Цена набора:** 3 000–8 000 Kč
- **Годовые расходы:** 3 000–8 000 Kč
- Для: особых случаев, первого опыта

## Как работает tape-in и сколько стоит?
- **Волосы:** 4 000–12 000 Kč + работа 1 500–3 000 Kč
- **Годовые расходы:** 10 000–20 000 Kč
- Для: ежедневного ношения

## Как работает кератин и сколько стоит?
- **Волосы:** 5 000–15 000 Kč + работа 3 000–5 000 Kč
- **Годовые расходы:** 14 000–26 000 Kč
- Для: самого естественного результата

## Как решить?
- Иногда → Clip-in, ежедневно → Tape-in, самое дискретное → Кератин

[Каталог](/vlasy-k-prodlouzeni) · [Контакт](/kontakt).`,
},

// ═══════════════════════════════════════════════════════════
// 3. Letní péče
// ═══════════════════════════════════════════════════════════
{
  slug: "pece-o-prodlouzene-vlasy-v-lete",
  content: `## Jak pečovat o prodloužené vlasy v létě?

Léto je pro prodloužené vlasy nejnáročnější období — slunce, slaná voda, chlór a vlhkost zkracují životnost. S těmito pravidly vlasy přežijí celou dovolenou.

## Jak chránit prodloužené vlasy před mořem a slanou vodou?

Slaná voda je **nejagresivnější prostředí** pro prodloužené vlasy. Sůl krystalizuje, vysušuje a vytahuje barvu.

1. **Před vstupem do moře** vlasy navlhčete čistou vodou — nasycený vlas nepřijme tolik soli
2. **Naneste ochranný sprej nebo olej** s UV filtrem
3. **Vlasy sepněte** do copu
4. **Ihned po koupání propláchněte** čistou vodou
5. **Večer** hydratační maska a olej na konečky

**Kolik dní u moře vlasy vydrží?** S ochranou **7–10 dní** v pěkném stavu. Bez ochrany poškození po **3–4 dnech**.

## Jak chránit prodloužené vlasy v bazénu s chlórem?

Chlor odbarvuje a vysušuje vlasy — blond prodloužení může dostat **zelený nádech**.

1. **Namočte vlasy čistou vodou** před bazénem
2. **Nasaďte koupací čepici** — nejlepší ochrana
3. **Po bazénu okamžitě propláchněte** a naneste kondicionér
4. **1× týdně** hloubková maska (při častém plavání)

## Jak chránit prodloužené vlasy před sluncem?

UV záření odbarvuje a vysušuje vlasy:

- Sprej s UV filtrem na vlasy (každé 2 hodiny na slunci)
- Klobouk nebo šátek při dlouhém pobytu
- **Nikdy nesušte vlasy na přímém slunci** po moři — sůl + UV = dvojnásobné poškození

## Jaká je správná letní rutina pro prodloužené vlasy?

1. **Ráno:** Rozčesejte + ochranný sprej
2. **Přes den:** Vlasy svázané (cop, culík) — méně tření
3. **Večer:** Rozčesejte, pokud byly v kontaktu s vodou → myté šamponem bez sulfátů
4. **Na noc:** Volný cop + hedvábný polštář

## Čemu se v létě vyhnout?

- **Fén na horký vzduch** — nechte vlasy schnout přirozeně
- **Žehlička každý den** — nechte vlasy přirozené
- **Šampony se sulfáty** — vysušují vlasy ještě víc
- **Nedotažení copu** — volné vlasy ve větru se zamotávají

Více o správné [péči o prodloužené vlasy](/pece-o-vlasy).`,

  contentUk: `## Як доглядати за нарощеним волоссям влітку?

Літо — найскладніший період. Сонце, сіль, хлор скорочують термін служби.

## Як захистити від моря?
1. Намочіть чистою водою перед входом
2. Захисний спрей з UV фільтром
3. Після моря — негайно промити
**З захистом: 7–10 днів**, без: 3–4 дні.

## Як захистити в басейні?
1. Намочіть чистою водою
2. Шапочка для плавання
3. Після — промити + кондиціонер

## Як захистити від сонця?
- UV спрей кожні 2 години
- Капелюх при тривалому перебуванні

## Літня рутина?
Ранок: спрей. День: зібране волосся. Вечір: маска. Ніч: коса + шовкова подушка.

[Догляд за волоссям](/pece-o-vlasy).`,

  contentRu: `## Как ухаживать за наращёнными волосами летом?

Лето — самый сложный период. Солнце, соль, хлор сокращают срок службы.

## Как защитить от моря?
1. Намочите чистой водой перед входом
2. Защитный спрей с UV фильтром
3. После моря — немедленно промыть
**С защитой: 7–10 дней**, без: 3–4 дня.

## Как защитить в бассейне?
1. Намочите чистой водой
2. Шапочка для плавания
3. После — промыть + кондиционер

## Как защитить от солнца?
- UV спрей каждые 2 часа
- Шляпа при длительном пребывании

## Летняя рутина?
Утро: спрей. День: собранные волосы. Вечер: маска. Ночь: коса + шёлковая подушка.

[Уход за волосами](/pece-o-vlasy).`,
},

// ═══════════════════════════════════════════════════════════
// 4. Chyby při výběru barvy
// ═══════════════════════════════════════════════════════════
{
  slug: "nejcastejsi-chyby-pri-vyberu-barvy-vlasu",
  content: `## Jakých 7 chyb se vyvarovat při výběru barvy vlasů na prodloužení?

Špatně zvolená barva je důvod číslo jedna, proč klientky nejsou spokojené s prodloužením. Stojí je zbytečné peníze a nervy. Tady je 7 nejčastějších chyb a jak se jim vyhnout.

## Je špatné vybírat barvu pod umělým světlem?

Ano — to je chyba číslo 1. Umělé osvětlení v obchodě nebo salonu **zkresluje barvy**. Teplé světlo „oteplí" studené odstíny a naopak. Vždy porovnávejte vzorky **u okna při denním světle**. Ideálně na severní straně — přímé slunce barvy příliš zesvětlí.

## Lze vybírat barvu vlasů podle fotky na internetu?

Ne — každý monitor zobrazuje barvy jinak. Fotka na Instagramu nebo e-shopu je **orientační**, nikdy přesná. Co dělat:
- **Objednejte si vzorek** — stojí pár korun a ušetří tisíce
- Přijďte na **osobní konzultaci** — v Hairland porovnáme barvy přímo s vašimi vlasy

## Proč je důležitý podtón vlasů?

Vlasy nemají jen „světlost" (level 1–10), ale i **podtón** — teplý (zlatý, měděný) nebo studený (popelavý, platinový). Pokud máte teplé vlastní vlasy a koupíte studené prodloužení, **bude to vidět i na dálku**. Tip: Pokud nevíte svůj podtón, zeptejte se kadeřnice.

## Proč neporovnávat barvu prodloužení s kořínky?

Barva kořínků je obvykle **tmavší** než délky. Prodloužení se napojuje na délky, ne na kořínky. Správně: porovnávejte vzorek s barvou vlasů **10–15 cm od pokožky hlavy**.

## Je lepší přesná shoda barvy nebo mix odstínů?

Paradoxně — **100% shoda často vypadá uměle**. Příroda míchá několik tónů v jedné hlavě. Pro nejpřirozenější výsledek zvažte **mix 2–3 blízkých odstínů**.

## Jak řešit prodloužení s šedinami nebo melírem?

Jednobarevné prodloužení bude **vyčnívat**, pokud máte šediny nebo melír. Řešení:
- Prodloužení s **melírem** (mix světlých a tmavších pramenů)
- **Tónování** prodloužení tak, aby odpovídalo vašemu melíru
- Konzultace s kadeřnicí — pomůže s namíchání správné kombinace

## Proč se poradit s kadeřnicí o barvě prodloužení?

Vaše kadeřnice zná vaše vlasy nejlíp — podtón, strukturu, historii barvení. Nechte ji pomoct s výběrem a ušetříte čas, peníze i nervy.

V Hairland nabízíme **vzorky** a **osobní konzultaci** zdarma. [Kontaktujte nás](/kontakt) nebo si [prohlédněte nabídku](/vlasy-k-prodlouzeni).`,

  contentUk: `## Яких 7 помилок уникати при виборі кольору волосся?

Неправильний колір — причина №1 невдоволення нарощуванням.

## Чи погано вибирати при штучному світлі?
Так — воно **спотворює кольори**. Порівнюйте при денному світлі біля вікна.

## Чи можна вибирати за фото в інтернеті?
Ні — кожен монітор показує інакше. **Замовте зразок**.

## Чому важливий підтон?
Теплі (золотисті) vs холодні (попелясті). Невідповідність видно здалеку.

## Чому не порівнювати з коренями?
Корені темніші. Порівнюйте з довжиною **10–15 см від шкіри**.

## Точна відповідність чи мікс?
**Мікс 2–3 відтінків** виглядає природніше.

## Як з сивиною/мелюванням?
Одноколірне нарощування буде **виділятися**. Потрібен мікс.

## Чому порадитися з майстром?
Майстер знає ваше волосся — підтон, структуру, історію фарбування.

[Контакт](/kontakt) · [Каталог](/vlasy-k-prodlouzeni).`,

  contentRu: `## Каких 7 ошибок избегать при выборе цвета волос?

Неправильный цвет — причина №1 недовольства наращиванием.

## Плохо ли выбирать при искусственном свете?
Да — оно **искажает цвета**. Сравнивайте при дневном свете у окна.

## Можно ли выбирать по фото в интернете?
Нет — каждый монитор показывает по-разному. **Закажите образец**.

## Почему важен подтон?
Тёплые (золотистые) vs холодные (пепельные). Несоответствие видно издалека.

## Почему не сравнивать с корнями?
Корни темнее. Сравнивайте с длиной **10–15 см от кожи**.

## Точное совпадение или микс?
**Микс 2–3 оттенков** выглядит естественнее.

## Как с сединой/мелированием?
Одноцветное наращивание будет **выделяться**. Нужен микс.

## Почему посоветоваться с мастером?
Мастер знает ваши волосы — подтон, структуру, историю окрашивания.

[Контакт](/kontakt) · [Каталог](/vlasy-k-prodlouzeni).`,
},

// ═══════════════════════════════════════════════════════════
// 5. Šampon pro prodloužené vlasy
// ═══════════════════════════════════════════════════════════
{
  slug: "sampon-pro-prodlouzene-vlasy",
  content: `## Jaký šampon je nejlepší pro prodloužené vlasy?

Šampon je jediný přípravek, který se dostává přímo ke spojům (keratin, páska, kroužek). Proto pro něj platí přísnější pravidla. Prošli jsme složení desítek šamponů — tady je výsledek.

## Je šampon „bez sulfátů" opravdu bezpečný?

Často ne — nápis „bez sulfátů" znamená jen to, že chybí **jeden konkrétní sulfát**. Místo něj bývá jiná, podobně agresivní látka:

- **Sodium C14-16 Olefin Sulfonate** — chemicky to není sulfát, ale vysušuje stejně
- **Sodium Coco-Sulfate** — sulfát z kokosu, častý v „přírodní" kosmetice
- **Sodium Chloride (sůl)** — zahušťuje šampon, ale oslabuje spoje

**Čtěte složení, ne nápisy na obalu.**

## Jaké 3 pravidla musí šampon splňovat?

Složky ve složení jsou seřazené podle množství — nejvíc rozhoduje prvních 5 položek.

### Pravidlo 1: Žádné agresivní čisticí látky
Nesmí obsahovat: SLS, SLES, Ammonium Lauryl Sulfate, Sodium Coco-Sulfate, Sodium C14-16 Olefin Sulfonate.

### Pravidlo 2: Žádné silikony
Nic, co končí na **-cone, -conol, -siloxane**. Silikony se hromadí na spojích a uvolňují je.

### Pravidlo 3: Sůl a alkohol ne v prvních 5 složkách
Sodium Chloride, Alcohol Denat., oleje a másla — ve stopovém množství nevadí, ale v prvních 5 položkách oslabují spoje.

## Jaké čisticí látky jsou bezpečné?

Hledejte tyto šetrné alternativy:
- **Sodium Cocoyl Isethionate** — jemný, kokosový základ
- **Cocamidopropyl Betaine** — mírný, pěnivý
- **Sodium Lauroyl Sarcosinate** — šetrný, dermatologicky testovaný
- **Decyl Glucoside** — rostlinný, nízká pěnivost

## Jak často mýt prodloužené vlasy šamponem?

- **2–3× týdně** — ideální frekvence
- Každodenní mytí **zbytečně zatěžuje** spoje
- Mezi mytím používejte **suchý šampon** (bez pudru u kořínků — zamotává spoje)

## Jak správně nanášet šampon na prodloužené vlasy?

1. Šampon jen **na pokožku a kořínky** — masírujte bříšky prstů
2. Délky myjte pouze **proudem šamponu**, který steče dolů
3. **Nikdy nedrhněte** délky proti sobě
4. Opláchněte **vlažnou až studenou vodou**

Více o celkové [péči o vlasy](/pece-o-vlasy) na naší stránce.`,

  contentUk: `## Який шампунь найкращий для нарощеного волосся?

Шампунь — єдиний засіб, який контактує зі з'єднаннями. Тому правила суворіші.

## Чи безпечний шампунь "без сульфатів"?
Часто ні — замість одного сульфату містить **інший агресивний засіб**. Читайте склад.

## Які 3 правила повинен виконувати шампунь?
1. **Жодних агресивних** ПАР (SLS, SLES, Sodium Coco-Sulfate)
2. **Жодних силіконів** (-cone, -conol, -siloxane)
3. **Сіль і спирт** не в перших 5 складниках

## Які очищувачі безпечні?
- Sodium Cocoyl Isethionate, Cocamidopropyl Betaine, Decyl Glucoside

## Як часто мити?
**2–3× на тиждень**. Щоденне миття навантажує з'єднання.

[Догляд за волоссям](/pece-o-vlasy).`,

  contentRu: `## Какой шампунь лучший для наращённых волос?

Шампунь — единственное средство, контактирующее с соединениями. Поэтому правила строже.

## Безопасен ли шампунь "без сульфатов"?
Часто нет — вместо одного сульфата содержит **другое агрессивное средство**. Читайте состав.

## Какие 3 правила должен выполнять шампунь?
1. **Никаких агрессивных** ПАВ (SLS, SLES, Sodium Coco-Sulfate)
2. **Никаких силиконов** (-cone, -conol, -siloxane)
3. **Соль и спирт** не в первых 5 компонентах

## Какие очистители безопасны?
- Sodium Cocoyl Isethionate, Cocamidopropyl Betaine, Decyl Glucoside

## Как часто мыть?
**2–3× в неделю**. Ежедневное мытьё нагружает соединения.

[Уход за волосами](/pece-o-vlasy).`,
},

// ═══════════════════════════════════════════════════════════
// 6. Moře, sport, sauna
// ═══════════════════════════════════════════════════════════
{
  slug: "prodlouzene-vlasy-more-sport-sauna",
  content: `## Lze nosit prodloužené vlasy k moři, do bazénu a na sport?

Ano — prodloužené vlasy zvládnou moře, bazén, sport i saunu. Stačí dodržovat pár pravidel. Klíčové je pamatovat: prodloužené vlasy se **nedokáží samy regenerovat** jako vlastní.

## Jak chránit prodloužené vlasy u moře?

Slaná voda je nejagresivnější — sůl krystalizuje, vysušuje a vytahuje barvu.

1. **Před mořem:** Navlhčete čistou vodou + ochranný sprej s UV filtrem
2. **V moři:** Vlasy sepnuté v copu
3. **Po moři:** Okamžitě propláchněte čistou vodou
4. **Večer:** Hydratační maska + olej na konečky

**Jak dlouho vydrží u moře?** S ochranou **7–10 dní**, bez ochrany poškození po **3–4 dnech**.

## Jak chránit prodloužené vlasy v bazénu?

Chlor odbarvuje — blond vlasy mohou dostat **zelený nádech**.

1. **Před bazénem:** Namočte čistou vodou, ideálně koupací čepice
2. **Po bazénu:** Ihned propláchněte + kondicionér na délky
3. **Při častém plavání:** 1× týdně hloubková maska

## Lze sportovat s prodlouženými vlasy?

Ano — ale pot obsahuje soli, které vlasy vysušují.

- **Vlasy sepněte** do pevného copu nebo drdolu (ne kovu přímo na spoje)
- **Po sportu:** Propláchněte vlasy vodou (nemusíte mýt šamponem pokaždé)
- **Hedvábná gumička** místo kovové — nezachytává se o spoje
- **Cardio, jóga, fitness** — bez omezení
- **Kontaktní sporty** — opatrně se spoji

## Lze chodit s prodlouženými vlasy do sauny?

S opatrností ano:

- **Vlasy zaplétejte** nebo zabalte do ručníku
- **Suchá sauna** (finská) — méně problematická
- **Parní sauna** — vlhkost a teplo oslabují keratinové spoje, **max. 15 minut**
- **Po sauně:** Studená sprcha na vlasy

## Cestovatelský balíček pro prodloužené vlasy

Co vzít na dovolenou:
- Šampon a kondicionér bez sulfátů (cestovní balení)
- Ochranný sprej s UV filtrem
- Tangle Teezer nebo Loop Brush
- Hedvábné gumičky
- Bezoplachový kondicionér

Více o [péči o prodloužené vlasy](/pece-o-vlasy).`,

  contentUk: `## Чи можна носити нарощене волосся на море, в басейн і на спорт?

Так — з правильним захистом.

## Як захистити на морі?
Перед: намочити + спрей. Після: промити. Маска ввечері. **З захистом: 7–10 днів.**

## Як захистити в басейні?
Перед: намочити, шапочка. Після: промити + кондиціонер.

## Чи можна займатися спортом?
Так — волосся в косі, після спорту промити водою.

## Чи можна в сауну?
Обережно — заплести, парна сауна **макс. 15 хвилин**.

[Догляд за волоссям](/pece-o-vlasy).`,

  contentRu: `## Можно ли носить наращённые волосы на море, в бассейн и на спорт?

Да — с правильной защитой.

## Как защитить на море?
Перед: намочить + спрей. После: промыть. Маска вечером. **С защитой: 7–10 дней.**

## Как защитить в бассейне?
Перед: намочить, шапочка. После: промыть + кондиционер.

## Можно ли заниматься спортом?
Да — волосы в косе, после спорта промыть водой.

## Можно ли в сауну?
Осторожно — заплести, парная сауна **макс. 15 минут**.

[Уход за волосами](/pece-o-vlasy).`,
},

// ═══════════════════════════════════════════════════════════
// 7. Prodloužení pro jemné vlasy
// ═══════════════════════════════════════════════════════════
{
  slug: "prodlouzeni-vlasu-pro-jemne-vlasy",
  content: `## Lze prodloužit jemné a řídké vlasy?

Ano — ale ne každá metoda je vhodná. Špatný výběr nebo příliš velká gramáž může jemné vlasy poškodit. Klíčové je zvolit **šetrnou metodu, správnou gramáž** a svěřit se zkušené kadeřnici.

## Jaká metoda prodloužení je nejlepší pro jemné vlasy?

### Tape-in — ideální volba pro jemné vlasy
[Tape-in](/tape-in-vlasy) je pro jemné vlasy **naprosto ideální**. Plochý profil pásek (šířka 4 cm, tloušťka pod 1 mm) rozloží váhu rovnoměrně.

- **Minimální zátěž** kořínků díky plochému profilu
- **Rychlá aplikace:** 30–60 minut
- **Přeaplikace** každých 6–8 týdnů
- **Cena:** od 5 000 Kč (vlasy + aplikace)

### Micro ring — skvělá alternativa
[Micro ring](/micro-ring-vlasy) — malé kroužky (2–3 mm) bez lepidla a bez tepla.

- Pro jemné vlasy volte **nejmenší kroužky** (2 mm) a menší prameny
- Více menších pramenů je šetrnější než málo velkých
- **Cena:** od 7 000 Kč (vlasy + aplikace)

### Keratin — podmíněně vhodný
Keratinové prodloužení může fungovat, ale:
- Použijte **menší kapsule** a jemnější prameny
- **Méně pramenů** než u silných vlasů
- Teplo při aplikaci je rizikové pro jemné vlasy

### Clip-in — bezpečný start
[Clip-in](/clip-in-vlasy) — žádné trvalé spoje, ideální na vyzkoušení.

## Kolik gramů vlasů potřebuji na jemné vlasy?

Méně než u silných vlasů — jemné vlasy nesnesou takovou zátěž:

- **Přidání objemu:** 30–50 g (ne víc!)
- **Jemné prodloužení:** 50–80 g
- **Plné prodloužení:** 80–120 g (max.)

**Pravidlo:** U jemných vlasů nikdy nepřekračujte **120 g** — větší váha poškozuje kořínky.

## Na co si dát pozor u jemných vlasů?

- **Nepřetěžujte kořínky** — méně gramů, víc pramenů
- **Pravidelné korekce** — dorostlé spoje tahají vlastní vlasy
- **Šetrné sundávání** — nechte to na profesionálce
- **Žádné DIY** — u jemných vlasů je chyba nákladná

## Jak pečovat o prodloužené jemné vlasy?

- **Kartáčování 2× denně** — Tangle Teezer, od konečků nahoru
- **Šampon bez sulfátů** — jemné vlasy jsou citlivější
- **Noční cop** — hedvábná gumička + hedvábný polštář
- **Kondicionér jen na délky** — nikdy na kořínky/spoje

Poradíme vám zdarma — [kontaktujte nás](/kontakt) nebo si [prohlédněte nabídku](/vlasy-k-prodlouzeni).`,

  contentUk: `## Чи можна нарощувати тонке і рідке волосся?

Так — але не кожна метода підходить. Важливо вибрати **щадну методу і правильну грамаж**.

## Яка метода найкраща?
- **Tape-in** — ідеально, плоский профіль, від 5 000 Kč
- **Micro ring** — без клею, без тепла, від 7 000 Kč
- **Clip-in** — безпечний старт для проби

## Скільки грамів потрібно?
- Об'єм: 30–50 г
- Нарощування: 50–80 г
- Максимум: **120 г** (більше пошкоджує корені)

## На що звернути увагу?
- Не перевантажуйте корені
- Регулярні корекції
- Професійне зняття

[Контакт](/kontakt) · [Каталог](/vlasy-k-prodlouzeni).`,

  contentRu: `## Можно ли наращивать тонкие и редкие волосы?

Да — но не каждый метод подходит. Важно выбрать **щадящий метод и правильный граммаж**.

## Какой метод лучший?
- **Tape-in** — идеально, плоский профиль, от 5 000 Kč
- **Micro ring** — без клея, без тепла, от 7 000 Kč
- **Clip-in** — безопасный старт для пробы

## Сколько граммов нужно?
- Объём: 30–50 г
- Наращивание: 50–80 г
- Максимум: **120 г** (больше повреждает корни)

## На что обратить внимание?
- Не перегружайте корни
- Регулярные коррекции
- Профессиональное снятие

[Контакт](/kontakt) · [Каталог](/vlasy-k-prodlouzeni).`,
},

// ═══════════════════════════════════════════════════════════
// 8. Prodloužení po chemoterapii
// ═══════════════════════════════════════════════════════════
{
  slug: "prodlouzeni-vlasu-po-chemoterapii",
  content: `## Kdy a jak prodloužit vlasy po chemoterapii?

Ztráta vlasů patří mezi nejnáročnější vedlejší účinky onkologické léčby. Prodloužení vlasů je **jednou z možností** — ne nutností. Tady jsou odpovědi na nejčastější otázky.

**Důležité:** Tento článek není lékařská rada. Vždy se poraďte se svým onkologem.

## Kdy po chemoterapii můžu začít s prodloužením vlasů?

Vlasy začínají růst **2–4 týdny po posledním cyklu**. První vlasy mohou mít jinou texturu — jemnější, kudrnatější nebo tmavší. To je normální a stabilizuje se během 6–12 měsíců.

### Minimální délka vlasů pro prodloužení
- **Clip-in:** od 3–5 cm (přitisknou se na vlastní vlasy)
- **Tape-in:** od 5–8 cm
- **Micro ring:** od 8–10 cm
- **Keratin:** nedoporučujeme v raném stádiu — teplo na nových vlasech

### Kdy je bezpečné začít?
- **3–6 měsíců po léčbě:** Clip-in (nejbezpečnější start)
- **6–9 měsíců:** Tape-in nebo micro ring (pokud vlasy mají 5+ cm)
- **9–12 měsíců:** Jakákoliv metoda (pokud onkolog schválí)

**Plná hustota** se vrací obvykle za 6–12 měsíců. Každá žena je jiná — respektujte vlastní tempo.

## Jaká metoda prodloužení je po chemoterapii nejbezpečnější?

### Clip-in — nejbezpečnější start
- Žádné lepidlo, žádné teplo
- Nasadíte a sundáte kdykoliv
- Nulová zátěž kořínků
- Můžete nosit jen když chcete
- **Cena:** od 3 000 Kč

### Tape-in — další krok
- Šetrné lepidlo, minimální zátěž
- Vhodné od 5–8 cm vlastních vlasů
- **Používejte menší a lehčí pásky** než obvykle
- **Cena:** od 5 000 Kč

### Micro ring — beztepelná alternativa
- Bez lepidla, bez tepla — nejšetrnější trvalá metoda
- Vhodné od 8–10 cm
- **Cena:** od 7 000 Kč

## Jaké vlasy vybrat po chemoterapii?

- **Panenské (Virgin)** — nejšetrnější, neprocházely žádnou chemií
- **Lidské vlasy** vždy, nikdy syntetické
- **Lehčí gramáž** — 50–80 g místo 100–150 g (méně zátěž na nové kořínky)
- **Světlejší varianta** — první vlasy mohou být tmavší, prodloužení by mělo odpovídat cílové barvě

## Na co si dát pozor po chemoterapii?

- **Konzultace s onkologem** před jakýmkoliv zásahem
- **Citlivější pokožka** — lepidla a kroužky mohou dráždit
- **Jemnější vlasy** — menší gramáž, šetrnější metody
- **Alergie** — po léčbě se mohou projevit nové citlivosti (test lepidla předem)
- **Trpělivost** — neporovnávejte se s ostatními

## Je prodloužení vlasů po chemoterapii emocionálně důležité?

Pro mnohé ženy ano — vlasy jsou součást identity a sebevědomí. Prodloužení může pomoci:
- Cítit se znovu jako „já"
- Vrátit se do normálního života
- Posílit sebevědomí v přechodném období

Ale **není to nutnost** — každá žena prochází zotavením jinak a všechny cesty jsou správné.

Rádi vám poradíme s citlivým přístupem. [Kontaktujte nás](/kontakt) — porozumíme.`,

  contentUk: `## Коли і як нарощувати волосся після хіміотерапії?

Втрата волосся — один з найтяжчих побічних ефектів. Нарощування — **одна з можливостей**, не обов'язок.

**Важливо:** Це не медична порада. Завжди консультуйтесь з онкологом.

## Коли можна починати?
- Волосся починає рости **2–4 тижні** після останнього циклу
- **Clip-in:** від 3–5 см (3–6 місяців після лікування)
- **Tape-in:** від 5–8 см (6–9 місяців)
- **Micro ring:** від 8–10 см (9–12 місяців)

## Яка метода найбезпечніша?
- **Clip-in** — жодного клею, жодного тепла, від 3 000 Kč
- **Tape-in** — шадне, від 5 000 Kč
- **Micro ring** — без тепла, від 7 000 Kč

## Яке волосся вибрати?
- **Virgin** — найшадніше
- Легша грамаж: 50–80 г
- Тільки людське волосся

## На що звернути увагу?
- Консультація з онкологом
- Чутливіша шкіра — тест клею
- Менша грамаж, шадніші методи

[Контакт](/kontakt) — допоможемо з чуйним підходом.`,

  contentRu: `## Когда и как наращивать волосы после химиотерапии?

Потеря волос — один из самых тяжёлых побочных эффектов. Наращивание — **одна из возможностей**, не обязанность.

**Важно:** Это не медицинский совет. Всегда консультируйтесь с онкологом.

## Когда можно начинать?
- Волосы начинают расти **2–4 недели** после последнего цикла
- **Clip-in:** от 3–5 см (3–6 месяцев после лечения)
- **Tape-in:** от 5–8 см (6–9 месяцев)
- **Micro ring:** от 8–10 см (9–12 месяцев)

## Какой метод самый безопасный?
- **Clip-in** — никакого клея, никакого тепла, от 3 000 Kč
- **Tape-in** — щадящий, от 5 000 Kč
- **Micro ring** — без тепла, от 7 000 Kč

## Какие волосы выбрать?
- **Virgin** — самые щадящие
- Меньший граммаж: 50–80 г
- Только человеческие волосы

## На что обратить внимание?
- Консультация с онкологом
- Чувствительная кожа — тест клея
- Меньший граммаж, щадящие методы

[Контакт](/kontakt) — поможем с чутким подходом.`,
},

];

async function main() {
  let updated = 0;
  for (const article of updates) {
    const post = await prisma.blogPost.findUnique({
      where: { slug: article.slug },
      select: { id: true, slug: true, title: true },
    });
    if (!post) {
      console.log(`  SKIP: "${article.slug}" not found`);
      continue;
    }
    await prisma.blogPost.update({
      where: { id: post.id },
      data: {
        content: article.content,
        contentUk: article.contentUk,
        contentRu: article.contentRu,
        updatedAt: new Date(),
      },
    });
    updated++;
    console.log(`  OK: [${post.slug}] "${post.title}"`);
  }
  console.log(`\nDone. Updated ${updated}/${updates.length} blog posts.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
