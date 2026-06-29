/**
 * Fill all 26 blog posts with full Czech content
 * Run: npx tsx scripts/fill-blog-content.ts
 */
import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const articles: Record<string, string> = {

"5-duvodu-proc-investovat-do-kvalitnich-vlasu": `## Proč se vyplatí investovat do kvalitních vlasů?

Prodloužení vlasů je investice do vašeho sebevědomí a vzhledu. Rozdíl mezi levnými a prémiovými vlasy je ale obrovský — a projeví se už během prvních týdnů nošení.

## 1. Životnost až 2 roky

Kvalitní panenské vlasy s kompletní kutikulou vydrží při správné péči až 24 měsíců. Levné vlasy z Číny nebo Indie se začnou třepit a zamotávat už po 2–3 měsících. Matematika je jasná — za dva roky utratíte za levné vlasy víc než za jedny kvalitní.

## 2. Přirozený vzhled

Prémiové vlasy mají zachovanou přirozenou strukturu — hedvábný lesk, jemnost a pohyb, který se nedá uměle napodobit. Okolí nepozná, že máte prodloužené vlasy. U levných vlasů je to často vidět na první pohled.

## 3. Možnost barvení a stylingu

Kvalitní vlasy můžete barvit, tónovat, kulmovat i narovnávat — stejně jako vlastní vlasy. Levné syntetické nebo přechemicky ošetřené vlasy tyto procedury nezvládnou a poškodí se.

## 4. Šetrnost k vlastním vlasům

Prémiové vlasy jsou lehčí a mají kvalitnější spoje, které méně zatěžují vaše vlastní vlasy. Méně tahání = méně poškození = zdravější vlastní vlasy i po sundání prodloužení.

## 5. Opakovaná přeaplikace

Kvalitní vlasy můžete přeaplikovat 2–3x bez ztráty kvality. U levných vlasů to nejde — po sundání jdou rovnou do koše. To znamená, že každých pár měsíců kupujete nové.

## Jak poznat kvalitní vlasy?

- **Kutikula**: Přejeďte prsty od konečků ke kořínkům. Kvalitní vlasy mají hladkou kutikulu ve správném směru.
- **Lesk**: Přirozený, ne plastový lesk = dobrý znak.
- **Vůně**: Žádný chemický zápach.
- **Mokrý test**: Namočte pramen — kvalitní vlasy se nezačnou okamžitě zamotávat.

Investice do kvalitních vlasů se vyplatí vždy. Je to rozdíl mezi "mám prodloužené vlasy" a "mám krásné vlasy".`,

"clip-in-vs-tape-in-vs-keratinove-prodlouzeni": `## Tři nejpopulárnější metody prodloužení vlasů

Každá metoda má své výhody a hodí se na jiný typ klientky. Pojďme si je porovnat.

## Clip-in prodloužení

**Jak to funguje:** Prameny s kovovými sponkami nasadíte a sundáte během pár minut.

**Výhody:**
- Žádné poškození vlastních vlasů
- Nasadíte za 5 minut
- Ideální na speciální příležitosti
- Nejlevnější varianta

**Nevýhody:**
- Nelze nosit přes noc
- Sponky mohou být cítit
- Nevhodné pro každodenní nošení

**Pro koho:** Ženy, které chtějí objem a délku jen občas — na svatby, plesy, focení.

## Tape-in prodloužení

**Jak to funguje:** Ultratenké adhezivní pásky se nalepí k vlastním vlasům u kořínků. Spoj je plochý a neviditelný.

**Výhody:**
- Rychlá aplikace (60–90 minut)
- Velmi pohodlné celodenní nošení
- Plochý spoj — neviditelný pod vlasy
- Snadná přeaplikace každých 6–8 týdnů

**Nevýhody:**
- Nelze používat olejové přípravky u kořínků
- Nutná profesionální aplikace
- Pásky se mohou sklouznout při nesprávné péči

**Pro koho:** Ženy, které chtějí každodenní prodloužení s minimální údržbou.

## Keratinové prodloužení

**Jak to funguje:** Jednotlivé pramínky se spojí s vlastními vlasy keratinovou vazbou pomocí tepla.

**Výhody:**
- Nejpřirozenější výsledek
- Spoj je téměř neviditelný
- Vydrží 3–6 měsíců
- Ideální pro jemné vlasy

**Nevýhody:**
- Nejdelší aplikace (2–4 hodiny)
- Nejdražší varianta
- Sundávání vyžaduje specialistu

**Pro koho:** Ženy, které chtějí nejdiskrétnější a nejdéle trvající prodloužení.

## Naše doporučení

Pro první prodloužení doporučujeme **tape-in** — je to nejlepší kompromis mezi cenou, pohodlím a výsledkem. Pro speciální příležitosti sáhněte po **clip-in**. A pokud chcete to nejlepší a nevadí vám investice, volte **keratin**.`,

"pece-o-prodlouzene-vlasy-v-lete": `## Letní péče o prodloužené vlasy

Léto je pro prodloužené vlasy nejnáročnější období. Slunce, slaná voda, chlór a vlhkost — to vše může zkrátit životnost vašeho prodloužení. Tady je kompletní návod, jak vlasy ochránit.

## Před koupáním

- **Namočte vlasy sladkou vodou** před vstupem do moře nebo bazénu. Vlasy nasáknou čistou vodou a už tolik nepřijmou slanou nebo chlorovanou.
- **Naneste ochranný olej** na délky a konečky — vytvoří bariéru proti chemikáliím.
- **Svažte vlasy do copu nebo drdolu** — méně kontaktu s vodou = méně poškození.

## Po koupání

- **Okamžitě opláchněte** vlasy čistou vodou. Nenechávejte sůl ani chlór zaschnout.
- **Neždímejte** — jemně vyždímejte ručníkem z mikrovlákna.
- **Naneste bezoplachový kondicionér** na délky.

## Ochrana před sluncem

UV záření odbarvuje vlasy a vysušuje je. Používejte:
- Sprej s UV filtrem na vlasy
- Klobouk nebo šátek při dlouhém pobytu na slunci
- Hedvábnou šálu na pláži

## Každodenní letní rutina

1. **Ráno**: Rozčesejte vlasy od konečků speciálním kartáčem. Naneste lehký ochranný sprej.
2. **Přes den**: Noste vlasy svázané — cop, culík nebo volný uzel. Méně tření = delší životnost.
3. **Večer**: Jemně rozčesejte. Pokud byly vlasy v kontaktu s vodou, umyjte šamponem bez sulfátů.
4. **Na noc**: Zaplétejte volný cop nebo použijte hedvábný polštář.

## Čemu se vyhnout

- **Fén na horký vzduch** — nechte vlasy schnout přirozeně nebo na studený proud
- **Žehlička každý den** — v létě nechte vlasy přirozené
- **Šampony se sulfáty** — vysušují a rozpouštějí keratinové spoje
- **Kondicionér na kořínky** — může uvolnit tape-in pásky

## Tip na závěr

Investujte do kvalitního bezoplachového kondicionéru a UV spreje — jsou to dva produkty, které v létě udělají největší rozdíl.`,

"nejcastejsi-chyby-pri-vyberu-barvy-vlasu": `## 7 nejčastějších chyb při výběru barvy

Špatně zvolená barva prodloužení je důvod číslo jedna, proč klientky nejsou spokojené. Tady jsou chyby, kterým se vyhnout.

## 1. Výběr barvy pod umělým světlem

Umělé osvětlení v obchodě nebo salonu zkresluje barvy. Vždy porovnávejte vzorky u okna při denním světle. Ideálně na severní straně — přímé slunce barvy "vysvětlí".

## 2. Porovnávání s barvou na obrazovce

Každý monitor zobrazuje barvy jinak. Fotka na Instagramu nebo e-shopu je orientační — nikdy nekupujte jen podle ní. Vždy si objednejte vzorek nebo přijďte na osobní konzultaci.

## 3. Ignorování podtónu

Vlasy nemají jen "světlost" (level), ale i podtón — teplý (zlatý, měděný) nebo studený (popelavý, platinový). Pokud máte teplé vlastní vlasy a koupíte studené prodloužení, bude to vidět i na dálku.

## 4. Výběr podle kořínků místo délek

Barva kořínků je obvykle tmavší než délky. Prodloužení se ale napojuje na délky, ne na kořínky. Porovnávejte vzorek s barvou vlasů 10–15 cm od kořínků.

## 5. Kupování "přesné shody"

Paradoxně — 100% shoda často vypadá uměle. Příroda míchá několik odstínů. Zvažte mix 2–3 blízkých odstínů pro nejpřirozenější výsledek.

## 6. Zapomínání na šedé vlasy

Pokud máte vlasy s šedinami nebo melírem, jednobarevné prodloužení bude vyčnívat. Potřebujete buď prodloužení s melírem, nebo mix světlých a tmavých pramenů.

## 7. Nekomunikování s kadeřnicí

Vaše kadeřnice zná vaše vlasy nejlíp. Nechte ji pomoct s výběrem barvy — ušetříte čas, peníze i nervy.

## Jak to udělat správně

1. Přijďte na **osobní konzultaci** — porovnáme barvy přímo s vašimi vlasy
2. Objednejte si **vzorek** — za pár korun ověříte shodu doma
3. Fotku pošlete na **WhatsApp** — poradíme vám předem
4. Nebojte se **barvení** — kvalitní vlasy lze dobarvit na přesný odstín`,

"pruvodce-mytim-prodlouzenych-vlasu": `## Jak správně mýt prodloužené vlasy

Mytí je základ péče. Špatná technika může zkrátit životnost prodloužení o měsíce.

## Před mytím

1. **Rozčesejte** vlasy od konečků nahoru kartáčem s měkkými štětinami
2. **Rozplétejte** všechny uzlíky prsty — nikdy je netrhejte
3. **Skloňte hlavu dopředu** pro lepší přístup ke kořínkům

## Výběr šamponu

- **Bez sulfátů** (SLS, SLES) — sulfáty rozpouštějí keratinové spoje a lepidlo tape-in pásek
- **Bez silikonů** — silikony se hromadí na spojích a ztěžují vlasy
- **pH neutrální** (5.0–5.5) — zachovává kutikulu ve správné poloze
- **Hydratační** — prodloužené vlasy nedostávají přirozený maz z pokožky

## Technika mytí

1. **Namočte vlasy teplou vodou** (ne horkou!) — horká voda oslabuje spoje
2. **Šampon naneste na pokožku** — masírujte kořínky, ne délky
3. **Délky myjte jen proudem šamponu**, který steče z kořínků
4. **Nikdy nedrhněte** délky proti sobě — způsobuje zamotávání
5. **Opláchněte důkladně** studenou vodou — uzavírá kutikulu

## Po mytí

1. **Kondicionér** naneste od poloviny délek ke konečkům. Nikdy na kořínky nebo spoje!
2. **Nechte působit** 2–3 minuty
3. **Opláchněte studenou vodou** — opravdu studenou, vlasy budou lesklé
4. **Vyždímejte ručníkem** — netlačte, neždímejte. Zabalte do ručníku z mikrovlákna.

## Sušení

- **Přirozeně** je nejšetrnější
- Pokud fénem, vždy na **nízkou teplotu** a se **směrem dolů** (od kořínků ke konečkům)
- Použijte **termoochranný sprej** před každým sušením fénem

## Jak často mýt?

- **2–3× týdně** je ideální
- Každodenní mytí zbytečně zatěžuje spoje
- Mezi mytím použijte **suchý šampon** na kořínky

## Chyby, kterých se vyvarovat

- Mytí hlavou dolů (zamotává vlasy)
- Kartáčování mokrých vlasů (trhá je)
- Spaní s mokrými vlasy (způsobuje uzlíky)
- Používání 2v1 šamponu s kondicionérem (zůstává na spojích)`,

"idealni-hrebeny-a-kartace-pro-prodlouzene-vlasy": `## Průvodce kartáči pro prodloužené vlasy

Správný kartáč je investice, která chrání vaše prodloužení a vlastní vlasy. Špatný kartáč může spoje potrhat a vlasy zamotávat.

## Co hledat

- **Měkké, ohebné štětiny** — nesmí tahat za spoje
- **Bez kuliček na konci** — kuličky se zachytávají o spoje
- **Široký tvar** — pokryje větší plochu, méně tahání

## Doporučené kartáče

### Tangle Teezer (The Ultimate Detangler)
Nejpopulárnější volba pro prodloužené vlasy. Flexibilní zuby se přizpůsobí a nezachytávají se o spoje. Skvělý na mokré i suché vlasy.

### Kartáč s přírodními štětinami (kančí štětiny)
Ideální pro každodenní kartáčování. Rozváží přirozený maz po délkách — důležité u prodloužení, kde maz z pokožky nedosáhne ke konečkům.

### Loop brush (kartáč s drátky bez kuliček)
Speciálně navržený pro prodloužení. Drátky proklouznou kolem spojů bez zachytávání. Nutnost pro keratinové a micro ring prodloužení.

### Hřeben s širokými zuby
Na rozčesávání mokrých vlasů po mytí. Začínejte vždy od konečků a postupujte nahoru.

## Správná technika kartáčování

1. **Začněte od konečků** — rozčesejte spodních 10 cm
2. **Postupujte nahoru** po 10cm úsecích
3. **Druhou rukou přidržujte** vlasy nad místem, kde čísáte — chrání spoje
4. **U kořínků kartáčujte opatrně** — obcházejte spoje
5. **Kartáčujte 2× denně** — ráno a večer

## Co NEKUPOVAT

- **Kovové hřebeny** — trhají vlasy, poškozují kutikulu
- **Kartáče s kuličkami** — zachytávají se o tape-in, keratin i micro ring
- **Rotating brush/kulma** — příliš velké riziko zamotání kolem nástroje
- **Kartáč na mokré vlasy s tvrdými zuby** — tahá za spoje

## Údržba kartáče

Čistěte kartáč jednou týdně — odstraňte vlasy a umyjte šamponem. Špinavý kartáč = špinavé vlasy.`,

"jak-prodlouzit-zivotnost-keratinovych-spoju": `## Keratinové spoje: jak je udržet co nejdéle

Keratinové prodloužení může vydržet 3–6 měsíců. Rozdíl mezi 3 a 6 měsíci záleží hlavně na péči.

## Prvních 48 hodin

- **Nemyjte vlasy** — keratin potřebuje čas na úplné stvrdnutí
- **Nesvazujte** do culíku ani copu
- **Nepoužívejte** žehličku ani kulmu v blízkosti spojů
- **Spěte na hedvábném polštáři** — méně tření

## Denní péče

### Mytí
- Šampon **bez sulfátů** — sulfáty rozpouštějí keratin
- **Nemyjte hlavou dolů** — vlasy se zamotají kolem spojů
- Pokud fénem — **nikdy nemiřte horký vzduch přímo na spoje**

### Kartáčování
- **3× denně** jemně rozčesejte kartáčem bez kuliček
- Vždy **od konečků nahoru**
- **Přidržujte vlasy** nad spojem druhou rukou

### Styling
- Kulmu/žehličku **neaplikujte na spoj** — keratin měkne při teplotě nad 180 °C
- Používejte **termoochranný sprej**
- Vyvarujte se přílišného tahání vlasů do účesů

## Co rozpouští keratinové spoje

- **Oleje a silikonové séra** přímo na spoje
- **Horká voda** — myjte vlažnou
- **Sulfáty v šamponu**
- **Sauna a parní lázeň** — pokud chodíte pravidelně, zabalte vlasy do ručníku
- **Chlorovaná voda** — v bazénu nosit čepici nebo alespoň svázat

## Přeaplikace

Když spoje dorostou 3–4 cm od pokožky, je čas na přeaplikaci:
1. Kadeřnice rozpustí staré spoje speciálním roztokem
2. Vlasy se očistí od zbytků keratinu
3. Nové spoje se aplikují blíže ke kořínkům
4. Kvalitní vlasy zvládnou 2–3 přeaplikace

## Kdy je čas sundat

- Spoje jsou více než 5 cm od pokožky
- Vlasy se začínají zamotávat i při pravidelném kartáčování
- Spoje jsou viditelné nebo se lámou

Neodkládejte sundání — příliš dorostlé spoje zatěžují vlastní vlasy a mohou je poškodit.`,

"virgin-vs-remy-vlasy-rozdil": `## Virgin vs Remy vlasy — jaký je skutečný rozdíl?

Tyto dva pojmy jsou nejčastěji zmiňované při výběru prodloužení, ale často se zaměňují. Pojďme si je vysvětlit jednou provždy.

## Co jsou Virgin vlasy?

**Virgin = panenské vlasy** — nikdy nebyly chemicky ošetřené.

- Žádné barvení, odbarvování ani trvalá
- Kutikula je 100% zachovaná ve správném směru
- Pocházejí od jednoho dárce
- Přirozená barva (nebarvené)

Virgin vlasy jsou **nejvyšší kvalita**, kterou můžete koupit. Jsou to vlasy, které nikdy neprošly žádným chemickým procesem.

## Co jsou Remy vlasy?

**Remy = kutikula zachovaná ve správném směru.**

- Kutikula směřuje od kořínků ke konečkům (jako u vlastních vlasů)
- Mohou být chemicky ošetřené (barvené, tónované)
- Mohou pocházet od více dárců
- Klíčové je zachování směru kutikuly

Remy vlasy se **nezamotávají a netřepí**, protože kutikula leží správně. To je hlavní rozdíl oproti non-Remy vlasům.

## Co jsou Non-Remy vlasy?

- Kutikula je odstraněná nebo ve špatném směru
- Povrch je pokrytý silikonem (aby vypadaly hladké)
- Po 2–3 umytích silikon zmizí a vlasy se začnou zamotávat
- **Nejlevnější a nejméně kvalitní varianta**

## Srovnání

| Vlastnost | Virgin | Remy | Non-Remy |
|-----------|--------|------|----------|
| Kutikula | 100% zachovaná | Zachovaná | Odstraněná |
| Chemické ošetření | Žádné | Možné | Časté |
| Životnost | 12–24 měsíců | 6–12 měsíců | 1–3 měsíce |
| Přeaplikace | 2–3× | 1–2× | Ne |
| Barvení | Ano | Ano (opatrně) | Ne |
| Cena | Nejvyšší | Střední | Nejnižší |

## Jak poznat kvalitu

### Test kutikuly
Přejeďte prsty od konečků ke kořínkům:
- **Hladké** = kutikula ve správném směru (Remy/Virgin)
- **Drsné/odpor** = kutikula v protisměru (Non-Remy)

### Test vodou
Namočte pramen na 10 minut:
- **Zůstane hladký** = kvalitní
- **Zamotá se** = nekvalitní

## Naše doporučení

Pro většinu klientek doporučujeme **Virgin** vlasy — vyšší počáteční investice se vrátí v životnosti a možnosti přeaplikace. Pokud hledáte konkrétní barvu a nechcete barvit, kvalitní **Remy** vlasy jsou skvělá volba.`,

"podzimni-trendy-2026-barvy-a-delky": `## Podzimní trendy 2026: co bude kralovat

Podzim 2026 přináší návrat k přirozenosti s několika odvážnými akcenty. Tady je přehled trendů v barvách a délkách.

## Barvy podzimu 2026

### Honey Bronde
Mix medu a brondu — teplý, vícerozměrný odstín, který vypadá jako polibek posledního letního slunce. Ideální pro ženy s teplým podtónem pleti.

### Mushroom Brown
Chladná houbová hnědá s popelavým nádechem. Sofistikovaná, nenápadná, velmi žádaná v salónech. Hodí se ke studenému podtónu.

### Copper Revival
Měděné a zrzavé tóny pokračují v trendu z jara. Letos jsou tmavší — spíš karamel a skořice než jasná měď.

### Vanilla Blonde
Krémová, teplá blond bez žlutých podtónů. Přechod od platiny k teplejším odstínům je hlavní blond trend sezóny.

## Délky

### 50–60 cm — zlatá střední cesta
Nejžádanější délka sezóny. Dosahuje pod lopatky, vypadá přirozeně a snadno se udržuje.

### 35–45 cm — bob a lob prodloužení
Krátké prodloužení pro objem je překvapivý hit. Klientky chtějí hustší bob bez čekání na dorost.

### 65+ cm — statement délky
Pro odvážné. Extra dlouhé vlasy jsou stále populární na Instagramu a pro speciální příležitosti.

## Struktury

- **Rovné** zůstávají klasikou — čisté linie pro podzimní eleganci
- **Mírně vlnité** (beach waves) přetrvávají, ale jemnější než v létě
- **Přirozená textura** — nechte vlasy, jak jsou. Žádné násilné narovnávání.

## Tip pro kadeřnice

Podzim je ideální čas nabídnout klientkám **nové prodloužení** — letní poškozené vlasy sundáte a aplikujete čerstvé v podzimních trendových barvách. Objednejte zásoby včas.`,

"jak-vybrat-spravnou-delku-prodlouzeni": `## Jak si vybrat správnou délku prodloužení

Délka je druhá nejdůležitější rozhodnutí po barvě. Špatně zvolená délka vypadá nepřirozeně nebo nesplní očekávání.

## Jak se měří délka

Délka vlasů na prodloužení se měří **od spoje ke konečkům**, ne od kořínků. To znamená:
- Vaše vlastní vlasy mají délku např. 25 cm
- Prodloužení 50 cm bude celkově viset 50 cm od místa napojení
- Výsledná délka je tedy přibližně 50 cm od kořínků (ne 25 + 50)

## Průvodce délkami

### 30–35 cm
- Po ramena
- Přidává objem, ne délku
- Přirozený vzhled
- Vhodné pro ženy s vlastními vlasy 15–20 cm

### 40–45 cm
- Pod ramena / nad lopatky
- Nejuniverzálnější délka
- Vypadá přirozeně na většině postav
- Doporučujeme pro první prodloužení

### 50–55 cm
- Po lopatky
- Nejpopulárnější délka celkově
- Krásný pohyb vlasů
- Vhodné pro střední a vyšší postavy

### 60–65 cm
- Pod lopatky / do poloviny zad
- Dramatický efekt
- Vyžaduje více péče
- Potřebujete vlastní vlasy alespoň 15 cm pro přirozené napojení

### 70+ cm
- Do pasu
- Statement look
- Náročné na údržbu
- Pouze kvalitní Virgin vlasy zvládnou tuto délku bez třepení

## Na co myslet

### Vaše výška
- Drobné ženy (do 160 cm): 40–50 cm vypadá jako "hodně dlouhé"
- Vyšší ženy (170+ cm): 60 cm vypadá přiměřeně

### Váš životní styl
- Sportovkyně: kratší (40–50 cm) = méně údržby
- Kancelář: středně dlouhé = profesionální
- Instagram/focení: delší = dramatičtější efekt

### Vaše vlastní vlasy
- Jemné vlasy: kratší prodloužení (méně zátěže)
- Husté vlasy: jakákoliv délka
- Velmi krátké vlasy (pod 10 cm): konzultujte s kadeřnicí — ne všechny metody fungují

## Náš tip

Pokud váháte mezi dvěma délkami, **zvolte delší** — vždy se dají zastřihnout. Přidávat délku zpětně nejde.`,

"prodlouzeni-vlasu-pro-kadernice-jak-zacit": `## Průvodce pro kadeřnice: jak začít s prodlužováním vlasů

Prodlužování vlasů je jedna z nejziskovějších služeb v salonu. Marže jsou vysoké, klientky se vracejí pravidelně a doporučují vás dál.

## Proč přidat prodlužování do nabídky

- **Marže 50–70 %** na vlasech + práci
- **Opakovaný klient** — přeaplikace každých 6–8 týdnů
- **Upselling** — péčové produkty, barvení, styling
- **Doporučení** — spokojená klientka přivede další

## Jakou metodu se naučit první?

### Tape-in (doporučujeme začít zde)
- Nejjednodušší na naučení
- Aplikace 60–90 minut
- Nízké riziko poškození klientčiných vlasů
- Přeaplikace je snadná a rychlá

### Keratin (pokročilé)
- Vyžaduje více praxe
- Lepší výsledky, ale vyšší riziko chyby
- Delší aplikace = vyšší cena za službu

## Kde se vzdělávat

- **Online kurzy** — základ, ale nestačí pro praxi
- **Workshopy u dodavatele** — nejlepší cesta
- **Mentoring od zkušené kadeřnice** — ideální
- **Praxe na cvičné hlavě** — než vezmete první klientku

## Vybavení na start

- Kleště na keratin nebo aplikátor na tape-in
- Ochranné destičky
- Roztoky na sundávání
- Kvalitní kartáče bez kuliček
- Zrcadlo na zadní pohled pro klientku

## Kde nakupovat vlasy

Klíčem je spolehlivý dodavatel s konzistentní kvalitou:
- Ověřte si reference od jiných kadeřnic
- Začněte s menší objednávkou a otestujte kvalitu
- Žádejte vzorky před velkou objednávkou
- Hledejte dodavatele s B2B cenami a fakturací

## Cenotvorba

### Kalkulace ceny pro klientku:
1. **Nákupní cena vlasů** (vaše náklady)
2. **Marže na vlasech** (50–100 %)
3. **Cena za práci** (hodinová sazba × čas aplikace)
4. **Materiál** (keratin, pásky, ochranné pomůcky)

### Příklad:
- Vlasy: nákup 3 000 Kč → prodej 5 500 Kč
- Práce: 2 hodiny × 500 Kč = 1 000 Kč
- **Celkem pro klientku: 6 500 Kč**
- **Váš zisk: 3 500 Kč**

## Spolupráce s Hairland

Nabízíme B2B podmínky pro kadeřnice a salony — velkoobchodní ceny, osobní konzultace a možnost objednávání vzorků.`,

"nocni-rutina-pro-prodlouzene-vlasy": `## 5 kroků noční rutiny pro prodloužené vlasy

To, co děláte před spaním, rozhoduje o tom, jak vaše prodloužení vypadá ráno — a jak dlouho celkově vydrží.

## Krok 1: Rozčesání

Před spaním **vždy rozčesejte vlasy** od konečků nahoru. Použijte kartáč bez kuliček nebo Tangle Teezer. Trvá to 2 minuty a předejdete ranním uzlíkům.

## Krok 2: Volný cop

**Zaplétejte vlasy do volného copu** — ne těsného. Cop chrání vlasy před zamotáváním během spánku. Použijte gumičku z hedvábí nebo spirálovou (bez kovových částí).

Alternativy:
- **Dva copy** — pro velmi husté vlasy
- **Volný drdol** nahoře — pro dlouhé vlasy 60+ cm
- **Hedvábný šátek** — zabalte vlasy do hedvábného šátku

## Krok 3: Hedvábný polštář

Investice do **hedvábného nebo saténového povlaku** na polštář je jedna z nejlepších věcí, které můžete udělat:
- Méně tření = méně zamotávání
- Méně lámání konečků
- Vlasy méně "uletí" ráno
- Bonus: méně vrásek na obličeji

## Krok 4: Noční sérum (volitelné)

Pokud máte suché konečky, naneste **kapku arganového oleje** nebo lehkého séra na konečky. Nikdy na kořínky nebo spoje — olej může uvolnit tape-in pásky nebo oslabit keratinové spoje.

## Krok 5: Správná teplota v ložnici

Přetopená ložnice vysušuje vlasy. Ideální teplota je **18–20 °C**. V zimě přidejte zvlhčovač vzduchu — suchý vzduch od topení je nepřítel prodloužených vlasů.

## Ráno

Po probuzení:
1. Rozplétejte cop prsty (ne kartáčem)
2. Jemně rozčesejte od konečků
3. Případně stříkněte suchý šampon na kořínky
4. Hotovo — 3 minuty a jdete

## Čemu se vyhnout v noci

- **Spaní s mokrými vlasy** — největší zlo. Mokré vlasy + tření = katastrofa
- **Spaní s rozpuštěnými vlasy** — zamotání zaručeno
- **Těsné culíky a gumičky** — tahají za spoje
- **Bavlněné povlaky** — bavlna vytváří tření a elektrizuje vlasy`,

"jak-vybirat-dodavatele-vlasu": `## Kontrolní seznam: jak vybrat spolehlivého dodavatele vlasů

Špatný dodavatel = nespokojené klientky = ztráta reputace. Tady je na co se zaměřit.

## 10 otázek, které položte dodavateli

1. **Odkud přesně vlasy pocházejí?** Seriózní dodavatel zná konkrétní zemi a oblast.
2. **Jsou vlasy od jednoho dárce?** Mix od více dárců = různá kvalita v jednom prameni.
3. **Jaký typ zpracování?** Virgin, Remy nebo ošetřené?
4. **Můžu dostat vzorek?** Kdo odmítne poskytnout vzorek, něco skrývá.
5. **Jaká je reklamační politika?** Seriózní dodavatel stojí za svým zbožím.
6. **Vystavujete fakturu?** Pro podnikání nutnost.
7. **Jaké jsou dodací lhůty?** Ideálně do 7 dnů.
8. **Nabízíte B2B ceny?** Velkoobchodní slevy pro pravidelné odběratele.
9. **Jak dlouho jste na trhu?** Reference a historie firmy.
10. **Můžu navštívit sklad?** Osobní prohlídka řekne víc než jakýkoliv web.

## Červené vlajky

- **Příliš nízká cena** — kvalitní Virgin vlasy nemůžou stát 500 Kč/100 g
- **Žádné informace o původu** — "Asie" není dostatečně konkrétní
- **Nemají fyzický sklad** — dropshipping z Alibaby ≠ dodavatel vlasů
- **Žádné reference od jiných kadeřnic**
- **Odmítají reklamace** nebo nemají jasné podmínky
- **Komunikace pouze přes Instagram DM** — žádný telefon, e-mail

## Jak otestovat kvalitu

### Před nákupem:
- Objednejte **vzorek** (10–20 g)
- Proveďte **test kutikuly** — přejeďte prsty oběma směry
- **Bleach test** — zkuste malé množství odbarvit. Kvalitní vlasy zvládnou bez poškození

### Po prvním nákupu:
- **Umyjte** 3× a sledujte, zda se nezačnou třepit
- **Sledujte** po 2 týdnech nošení u klientky
- **Zdokumentujte** kvalitu pro porovnání s další objednávkou

## Proč Hairland

- Transparentní původ — u každého produktu víte, odkud vlasy jsou
- Osobní prohlídka vlasů v Praze — než koupíte, můžete si osahat
- B2B ceny pro kadeřnice a salony
- Fakturace pro firmy
- Zpracování na zakázku do 7 dnů`,

"proc-ukrajinske-vlasy-nejkvalitnejsi-v-evrope": `## Proč jsou ukrajinské vlasy považovány za nejkvalitnější v Evropě

Ukrajinské vlasy mají na trhu prodloužení výjimečnou reputaci. Není to jen marketing — za jejich kvalitou stojí konkrétní důvody.

## Genetika a struktura

Ukrajinské vlasy mají strukturu, která je nejblíže středoevropskému a západoevropskému typu:
- **Střední tloušťka** — nejsou příliš jemné ani příliš hrubé
- **Přirozený lesk** bez chemického ošetření
- **Hladká kutikula** — méně náchylná k zamotávání
- **Přirozené odstíny** od blond po tmavě hnědou — snadno se ladí s evropskými klientkami

## Klimatické podmínky

Ukrajinské podnebí (studené zimy, teplá léta) přispívá k růstu silnějších vlasů. Vlasy rostou hustší a odolnější než v tropických oblastech.

## Tradice péče

V ukrajinské kultuře jsou dlouhé, zdravé vlasy symbolem krásy. Ženy o vlasy pečují od mládí a chemické ošetření je méně běžné než v západní Evropě — proto je snazší najít neošetřené panenské vlasy.

## Srovnání s jinými původy

### Indie
- Hrubší struktura — vyžaduje více zpracování
- Často chemicky ošetřené (chrámové vlasy jsou výjimka)
- Výrazně nižší cena, ale i kvalita

### Čína
- Velmi hrubá textura
- Vyžaduje agresivní chemické ošetření
- Po zpracování ztrácí přirozenost

### Brazílie/Jižní Amerika
- Přirozeně vlnité nebo kudrnaté
- Skvělé pro kudrnaté prodloužení
- Méně vhodné pro rovné evropské typy

### Rusko
- Podobná kvalita jako ukrajinské
- Omezenější dostupnost
- Světlejší odstíny — ideální pro blond prodloužení

## Na co si dát pozor

Ne všechny vlasy prodávané jako "ukrajinské" skutečně z Ukrajiny pocházejí. Značení původu není regulované. Proto:
- Kupujte od **ověřených dodavatelů** s transparentním supply chainem
- Ptejte se na **konkrétní oblast** původu
- **Otestujte kvalitu** sami — ukrajinské vlasy mají charakteristickou jemnost a lesk

## Náš přístup

V Hairland nakupujeme vlasy přímo od prověřených sběratelů na Ukrajině. U každé dodávky sledujeme původ a kvalitu. Můžete si vlasy osobně prohlédnout a osahat v našem skladu v Praze.`,

"tape-in-prodlouzeni-pruvodce-aplikaci": `## Tape-in prodloužení: kompletní průvodce

Tape-in je dnes nejpopulárnější metoda prodloužení vlasů. Je rychlá, šetrná a výsledek vypadá přirozeně.

## Jak tape-in funguje

Dvě ultratenké adhezivní pásky se nalepí z obou stran tenkého pramene vlastních vlasů — jako sendvič. Spoj je plochý (asi 0,5 mm) a přilne těsně k pokožce.

## Příprava před aplikací

### Pro klientku:
- Umyjte si vlasy **čistým šamponem bez silikonů** den před aplikací
- **Nepoužívejte** kondicionér, masku ani oleje
- Vlasy musí být **100% čisté a suché** — jakýkoliv film na vlasech oslabí přilnutí

### Pro kadeřnici:
- Připravte si **pásky** podle konzultace (barva, délka, počet)
- Mějte po ruce **ochranné destičky** a **hřeben na předěl**
- Zkontrolujte **kvalitu lepidla** — staré pásky drží hůř

## Postup aplikace

1. **Předěl**: Oddělte tenký pramen vlastních vlasů (asi 1 cm široký)
2. **Spodní páska**: Přilepte první pásku 0,5–1 cm od pokožky
3. **Horní páska**: Přilepte druhou pásku přesně naproti
4. **Stiskněte**: Pevně stiskněte prsty na 5 sekund
5. **Opakujte**: Pokračujte po celé hlavě

### Kolik pásek?
- **Objem**: 20–30 pásek (10–15 sendvičů)
- **Objem + délka**: 40–60 pásek
- **Plné prodloužení**: 60–80 pásek

## Doba aplikace

- **Zkušená kadeřnice**: 45–60 minut
- **Začátečnice**: 90–120 minut

## Přeaplikace (každých 6–8 týdnů)

1. Naneste **rozpouštěcí roztok** na spoje
2. Jemně odlepte pásky
3. Odstraňte zbytky lepidla z vlastních vlasů
4. Vlasy umyjte a vyčesejte
5. Nalepte **nové pásky** na vyčištěné prameny
6. Aplikujte jako nové — blíže ke kořínkům

## Kolikrát lze přeaplikovat?

Kvalitní vlasy zvládnou **3–4 přeaplikace**. To znamená celkovou životnost až 6–8 měsíců ze stejných vlasů.

## Nejčastější chyby

- **Páska příliš blízko kořínkům** — tahá a bolí
- **Příliš silný pramen vlastních vlasů** — páska neudrží a sklouzne
- **Nedostatečné stisknutí** — slabý spoj
- **Aplikace na vlhké vlasy** — lepidlo nepřilne
- **Silikony na vlasech** — lepidlo nepřilne

## Péče po aplikaci

- 48 hodin nemýt
- Šampon bez sulfátů a silikonů
- Žádný olej nebo kondicionér na kořínky
- Noční cop nebo hedvábný polštář`,

"jak-poznat-kvalitni-vlasy-7-testu": `## 7 jednoduchých testů kvality vlasů

Než utratíte tisíce za prodloužení, ověřte si kvalitu vlasů těmito testy. Zvládnete je i doma.

## Test 1: Test kutikuly (prsty)

**Jak:** Přejeďte prsty po pramenu od konečků ke kořínkům.

**Výsledek:**
- ✅ Cítíte jemný odpor — kutikula je zachovaná správným směrem
- ❌ Úplně hladké oběma směry — kutikula je odstraněná (silikonový povlak)
- ❌ Drsné a hrubé — nekvalitní zpracování

## Test 2: Test vodou

**Jak:** Namočte pramen do misky s vlažnou vodou na 10 minut.

**Výsledek:**
- ✅ Vlasy zůstanou hladké a rozčesatelné
- ❌ Vlasy se okamžitě zamotají — špatná nebo žádná kutikula

## Test 3: Bleach test

**Jak:** Malý vzorek (5–10 vlasů) odbarvte peroxidem.

**Výsledek:**
- ✅ Vlasy se rovnoměrně zesvětlí — přirozené, neošetřené
- ❌ Nerovnoměrné skvrny — vlasy byly předtím chemicky ošetřené
- ❌ Vlasy se rozpadnou — extrémně nízká kvalita

## Test 4: Test ohněm

**Jak:** Zapálte 2–3 vlasy (opatrně!).

**Výsledek:**
- ✅ Hoří pomalu, páchne spálenými vlasy — pravé lidské vlasy
- ❌ Hoří rychle, smrdí plastem — syntetické nebo silně zpracované

## Test 5: Test tahem

**Jak:** Uchopte jednotlivý vlas a jemně táhněte.

**Výsledek:**
- ✅ Vlas se mírně natáhne a pak praskne — zdravý, elastický vlas
- ❌ Praskne okamžitě — poškozený, přesušený
- ❌ Natáhne se jako guma a nevrátí se — syntetická příměs

## Test 6: Test lesku

**Jak:** Položte pramen na bílý papír u okna (denní světlo).

**Výsledek:**
- ✅ Přirozený, jemný lesk s hloubkou — zdravé vlasy
- ❌ Plastický, uniformní lesk — silikonový povlak
- ❌ Matné, bez lesku — poškozené nebo přesušené

## Test 7: Test vůně

**Jak:** Přičichněte k suchým vlasům i po namočení.

**Výsledek:**
- ✅ Neutrální nebo jemná přirozená vůně
- ❌ Chemický zápach — agresivní zpracování
- ❌ Kyselý zápach — špatné skladování nebo staré vlasy

## Kdy testovat

- **Před nákupem**: Požádejte o vzorek a proveďte všechny testy
- **Po doručení**: Před aplikací zkontrolujte konzistenci s vzorkem
- **Při reklamaci**: Zdokumentujte výsledky testů

Kvalitní dodavatel se testování nebojí — naopak, vítá ho. Pokud prodejce odmítne poskytnout vzorek k testování, je to varovný signál.`,

"b2b-spoluprace-vyhody-pro-salony": `## B2B spolupráce s Hairland: výhody pro salony a kadeřnice

Pokud jste kadeřnice nebo provozujete salon a chcete nabízet prodloužení vlasů, máme pro vás připravené B2B podmínky.

## Co nabízíme

### Velkoobchodní ceny
- **Slevy až 40 %** oproti maloobchodním cenám
- Čím více odebíráte, tím lepší ceny
- Transparentní ceník bez skrytých poplatků

### Konzultace zdarma
- Pomůžeme vám s výběrem sortimentu pro váš salon
- Poradíme s cenotvorbou pro vaše klientky
- Ukážeme trendy a bestsellery

### Osobní prohlídka vlasů
- Přijeďte do našeho skladu v Praze
- Prohlédněte si a osaháte vlasy před objednáním
- Porovnejte různé kvality a původy vedle sebe

### Zpracování na zakázku
- Clip-in, tape-in, keratin, micro ring — připravíme na míru
- Dodání do 7 pracovních dnů
- Specifické barvy a délky podle vašich požadavků

### Fakturace
- Faktury pro firmy i OSVČ
- Možnost platby převodem
- Daňové doklady pro vaše účetnictví

## Jak to funguje

1. **Registrujte se** na hairland.cz/registrace
2. **Ověření** — potvrdíme vaši kadeřnickou praxi
3. **Přístup** k B2B cenám a katalogu
4. **Objednávejte** online nebo telefonicky
5. **Doručení** do 7 dnů nebo osobní odběr v Praze zdarma

## Pro koho je B2B spolupráce

- **Kadeřnice** — i jako OSVČ nebo na vedlejší činnost
- **Salony** — pravidelný odběr pro více kadeřnic
- **Vlasové studia** — specializovaná pracoviště
- **Svatební stylisti** — sezonní spolupráce

## Kontakt

- **Telefon**: +420 608 553 103
- **WhatsApp**: wa.me/420608553103
- **E-mail**: info@hairland.cz
- **Sklad**: Praha — po domluvě kdykoli`,

"zimni-pece-o-prodlouzene-vlasy": `## Zimní péče o prodloužené vlasy

Zima je pro prodloužené vlasy téměř stejně náročná jako léto. Suchý vzduch od topení, čepice a statická elektřina — to vše zkracuje životnost prodloužení.

## Hlavní nepřátelé

### Suchý vzduch
Topení vysušuje vzduch na 20–30 % vlhkosti. Vlasy ztrácejí hydrataci, stávají se křehkými a lámou se. Prodloužené vlasy to odnášejí dvojnásob — nedostávají přirozený maz z pokožky.

### Čepice a šály
Tření o vlněné a syntetické materiály vytváří statickou elektřinu a mechanicky poškozuje vlasy. U prodloužení se navíc mohou uvolnit spoje.

### Velké teplotní výkyvy
Z -5 °C venku do +25 °C uvnitř — vlasy expandují a smršťují se, což oslabuje spoje.

## Řešení

### Zvlhčovač vzduchu
Investujte do zvlhčovače pro ložnici. Udržujte vlhkost na **45–55 %**. Vaše vlasy (i pleť) vám poděkují.

### Hedvábná podšívka čepice
Kupte čepici s hedvábnou nebo saténovou podšívkou. Nebo noste pod čepicí hedvábný šátek. Méně tření = méně poškození.

### Antistatický sprej
Používejte antistatický sprej na vlasy nebo lehké sérum. Předejdete efektu "elektrických vlasů".

### Hloubková maska 1× týdně
V zimě přidejte do rutiny **hydratační masku**. Naneste na délky a konečky, nechte působit 15–20 minut pod ručníkem. Nikdy na spoje.

### Leave-in kondicionér
Každodenní bezoplachový kondicionér je v zimě nutnost, ne luxus. Chrání konečky před vysycháním.

## Zimní mytí vlasů

- **Vlažná voda** — horká vlasy vysušuje ještě víc
- **Méně časté mytí** — 2× týdně stačí, mezi tím suchý šampon
- **Důkladné sušení** — nikdy nevycházejte ven s mokrými vlasy (mráz je láme)

## Zimní styling

- Omezte žehličku a kulmu — v zimě vlasy nepotřebují další tepelný stres
- Noste **volné copy a drdoly** — chrání konečky před třením o bundu
- **Schovejte délky** pod šálu — méně kontaktu se zimním vzduchem

## Tip

Podzim je ideální čas na přeaplikaci. Nechte si sundat letní prodloužení (poškozené sluncem a slanou vodou), nechte vlastní vlasy 2 týdny odpočinout, a pak aplikujte čerstvé prodloužení na zimu.`,

"barveni-prodlouzenych-vlasu-bezpecnost": `## Barvení prodloužených vlasů: co je bezpečné a co ne

Kvalitní vlasy na prodloužení lze barvit — ale ne všechno a ne vždy. Tady je kompletní přehled.

## Co je bezpečné

### Tónování (demi-permanentní barva)
- ✅ Bezpečné pro Virgin i Remy vlasy
- Nemění strukturu vlasu
- Vydrží 6–8 umytí
- Ideální pro jemné úpravy odstínu

### Zesvětlení o 1–2 tóny
- ✅ Bezpečné u Virgin vlasů
- Použijte nízký objem peroxidu (3–6 %)
- Vždy proveďte test na malém pramenu
- Nepřesvětlujte — jděte postupně

### Barvení na tmavší
- ✅ Bezpečné u všech kvalit
- Barva lépe drží než zesvětlení
- Snadnější a méně rizikové

## Co dělat opatrně

### Zesvětlení o 3+ tóny
- ⚠️ Pouze u Virgin vlasů
- Riziko poškození — vlasy mohou ztratit elasticitu
- Vždy u profesionála
- Naneste balzám ihned po barvení

### Melír / Balayage
- ⚠️ Možné, ale komplikované
- Technika musí obejít spoje (keratin, tape-in)
- Fólie nesmí přijít do kontaktu se spoji
- Doporučujeme nechat na zkušené kadeřnici

## Co NEDĚLAT

### Barvení Non-Remy vlasů
- ❌ Vlasy jsou pokryté silikonem — barva nechytí
- ❌ Po smytí silikonu se vlasy zničí

### Trvalá ondulace
- ❌ Příliš agresivní chemie
- ❌ Poškodí kutikulu nevratně

### Odbarvování na platinu
- ❌ Extrémní zásah do struktury
- ❌ Vlasy se stanou křehkými
- ❌ Pokud chcete platinu, kupte platinové vlasy rovnou

### Barvení přes spoje
- ❌ Barva rozpouští keratinové spoje
- ❌ Lepidlo na tape-in pásek změkne

## Jak barvit prodloužené vlasy

1. **Sundejte prodloužení** (ideální varianta)
2. Obarvete prameny samostatně
3. Po obarvení důkladně opláchněte a ošetřete balzámem
4. Nechte uschnout
5. Znovu aplikujte

Alternativně: barvěte s prodloužením na hlavě, ale **chraňte spoje** alobalem nebo destičkami.

## Náš tip

Pokud víte, že budete chtít jinou barvu — kupte rovnou vlasy v požadovaném odstínu. Je to šetrnější a výsledek je jistější než dodatečné barvení.`,

"micro-ring-metoda-nejsetrnejsi-prodlouzeni": `## Micro ring: nejšetrnější metoda prodloužení vlasů

Micro ring (také nano ring nebo micro loop) je metoda, která nepoužívá teplo ani lepidlo. Spojení zajišťuje miniaturní kovový kroužek.

## Jak to funguje

1. Tenký pramen vlastních vlasů se protáhne skrz malý silikonem vystlaný kroužek
2. Pramen prodloužení se vloží do stejného kroužku
3. Kroužek se stiskne speciálními kleštěmi
4. Hotovo — žádné teplo, žádné lepidlo

## Výhody

- **Žádné teplo** — nulové riziko tepelného poškození
- **Žádné lepidlo** — žádné chemikálie v kontaktu s vlasy
- **Snadná přeaplikace** — kroužek se rozevře, posune a znovu stiskne
- **Minimální poškození** — silikonová výstelka chrání vlastní vlasy
- **Přirozený pohyb** — vlasy se pohybují přirozeně jako vlastní
- **Neomezené mytí** — žádné omezení na šampony nebo oleje

## Nevýhody

- **Delší aplikace** — 2–3 hodiny pro plné prodloužení
- **Viditelné kroužky** — u velmi jemných vlasů mohou prosvítat
- **Klouzání** — na velmi hladkých nebo jemných vlasech se kroužky mohou posunout
- **Zvuk** — kroužky mohou při pohybu hlavou lehce cinkat (minimálně)

## Pro koho je micro ring ideální

- Ženy **alergické na lepidlo** nebo keratin
- Klientky, které **nechtějí tepelné zpracování**
- Ženy se **středně hustými až hustými** vlasy
- Sportovkyně — kroužky vydrží pot i častější mytí

## Pro koho se nehodí

- Velmi jemné, řídké vlasy (kroužky mohou být viditelné)
- Velmi krátké vlasy (pod 8 cm)
- Vlasy po chemoterapii (příliš křehké)

## Údržba

- Kartáčujte 2× denně, obcházejte kroužky
- Kontrolujte polohu kroužků — pokud se posunuly, navštivte kadeřnici
- **Přeaplikace každých 8–12 týdnů**
- Kvalitní vlasy zvládnou **3–4 přeaplikace**

## Srovnání metod

| | Micro ring | Keratin | Tape-in |
|--|-----------|---------|---------|
| Teplo | Ne | Ano | Ne |
| Lepidlo | Ne | Keratin | Páska |
| Aplikace | 2–3 h | 2–4 h | 1–1,5 h |
| Přeaplikace | 8–12 týdnů | 12–16 týdnů | 6–8 týdnů |
| Šetrnost | Nejvyšší | Střední | Vysoká |
| Přirozenost | Vysoká | Nejvyšší | Vysoká |`,

"prehled-prislusenstvi-pro-prodlouzene-vlasy": `## Příslušenství pro prodloužené vlasy: co opravdu potřebujete

Ne všechno, co se prodává jako "nutnost pro prodloužené vlasy", skutečně potřebujete. Tady je upřímný přehled — co koupit a co si odpustit.

## Nutnost (musíte mít)

### Kartáč bez kuliček
**Proč:** Kuličky na konci štětin se zachytávají o spoje a trhají je.
**Doporučení:** Tangle Teezer Ultimate Detangler nebo Loop Brush. Investice kolem 300–500 Kč.

### Šampon bez sulfátů
**Proč:** Sulfáty rozpouštějí keratinové spoje a oslabují lepidlo tape-in pásek.
**Tip:** Stačí jakýkoliv šampon s označením "sulfate-free" — nemusíte kupovat drahé "speciální" šampony.

### Hedvábná/saténová gumička
**Proč:** Běžné gumičky s kovovou sponou trhají vlasy. Hedvábné gumičky kloužou.
**Cena:** 100–200 Kč za sadu.

## Velmi doporučené

### Bezoplachový kondicionér (leave-in)
**Proč:** Prodloužené vlasy nedostávají přirozený maz z pokožky — konečky jsou vždy sušší.
**Použití:** Každý den na délky a konečky. Vyhněte se kořínkům a spojům.

### Hedvábný povlak na polštář
**Proč:** Méně tření v noci = méně zamotávání = delší životnost prodloužení.
**Cena:** 500–1 500 Kč. Bonus: lepší i pro pleť.

### Termoochranný sprej
**Proč:** Pokud používáte fén, žehličku nebo kulmu — chrání vlasy před poškozením teplem.
**Důležité:** Nestříkejte přímo na spoje.

## Hezké mít

### Arganový olej
Pár kapek na konečky před spaním. Hydratuje a dodává lesk. Ale pozor — nikdy na kořínky nebo spoje (zejména tape-in).

### Suchý šampon
Na dny mezi mytím. Osvěží kořínky bez nutnosti mýt celou hlavu.

### Hřeben s širokými zuby
Na rozčesávání mokrých vlasů po mytí. Šetrnější než kartáč.

## Nepotřebujete

### Speciální "prodloužení" šampon za 800 Kč
Většinou je to marketing. Jakýkoliv kvalitní sulfate-free šampon za 200 Kč udělá stejnou práci.

### UV sprej na vlasy
Užitečný v létě, ale zbytečný v zimě. Kupujte sezónně.

### Vlasové vitamíny
Na prodloužené vlasy nemají žádný vliv — jsou to cizí vlasy. Na vlastní vlasy pod prodloužením ano, ale stačí vyvážená strava.`,

"vanocni-styling-prodlouzene-vlasy-ucesy": `## 5 slavnostních účesů s prodlouženými vlasy

Vánoce a Silvestr jsou příležitost ukázat, co vaše vlasy umí. Tady je 5 účesů od jednoduchých po wow.

## 1. Elegantní vlny (Hollywood waves)

**Obtížnost:** Snadné
**Čas:** 20 minut

Nadčasová klasika. Velké, lesklé vlny spadající přes rameno.

**Postup:**
- Natočte prameny na širokou kulmu (32 mm) vždy stejným směrem
- Po natočení všech pramenů jemně pročesejte prsty
- Zafixujte lehkým lakem
- Přehoďte vlasy na jednu stranu pro extra glamour

**Tip:** S prodlouženými vlasy 50+ cm je efekt mnohem dramatičtější než s vlastními.

## 2. Nízký elegantní cop s objemem

**Obtížnost:** Snadné
**Čas:** 10 minut

Sofistikovaný, ale nenáročný. Perfektní pro štědrovečerní večeři.

**Postup:**
- Vytupírujte vlasy na temeni pro objem
- Svažte nízký cop v týle
- Vytáhněte jemné pramínky kolem obličeje
- Omotejte gumičku pramenem vlasů a připevněte vlásenkou
- Cop lehce rozcuchejte pro "plný" efekt

## 3. Romantický polorozpuštěný účes (half-up)

**Obtížnost:** Střední
**Čas:** 15 minut

Ideální kompromis — elegance nahoře, krásné délky dole.

**Postup:**
- Oddělte horní třetinu vlasů
- Vytvořte volný twist nebo malý cop
- Připevněte ozdobnou sponou nebo vlásenkami
- Spodní vlasy nechte volné — rovné nebo s jemnými vlnami

## 4. Objemný drdol

**Obtížnost:** Střední
**Čas:** 20 minut

S prodlouženými vlasy bude drdol konečně velký a plný.

**Postup:**
- Natočte vlasy na lehké vlny (drží lépe než rovné)
- Svažte vysoký nebo nízký culík
- Obtočte vlasy kolem gumičky a připevněte vlásenkami
- Vytahujte jednotlivé pramínky pro texturu
- Zafixujte lakem

**Pozor:** U keratinového prodloužení netahejte vlasy příliš pevně nahoru — zatěžuje spoje.

## 5. Pletený účes (fishtail braid)

**Obtížnost:** Pokročilé
**Čas:** 25 minut

Rybí cop z prodloužených vlasů vypadá úchvatně díky délce a hustotě.

**Postup:**
- Rozdělte vlasy na dva díly
- Střídavě přehazujte tenké pramínky z jedné strany na druhou
- Plétejte volně — ne těsně
- Na konci zafixujte transparentní gumičkou
- Vytáhněte pletení do stran pro fuller efekt

## Doplňky sezóny

- **Ozdobné spony**: Zlaté, perleťové nebo s kamínky
- **Hedvábná stuha**: Vplétejte do copu nebo drdolu
- **Květiny**: Sušené květiny pro rustikální eleganci

## Ochrana během oslavy

- Při tanci a pohybu noste vlasy svázané — méně zamotávání
- Po večírku rozčesejte a zaplétejte na noc
- Ráno po oslavě: suchý šampon + jemné rozčesání`,

"prodlouzeni-vlasu-jako-vanocni-darek": `## Proč je prodloužení vlasů perfektní vánoční dárek

Hledáte originální dárek pro ženu, která "nic nepotřebuje"? Dárkový poukaz na prodloužení vlasů je něco, co by si sama nekoupila — ale bude z toho nadšená.

## Proč to funguje jako dárek

### Je to zážitek
Prodloužení vlasů není jen produkt — je to transformace. Klientky říkají, že se po prodloužení cítí jako jiný člověk. Sebevědomí, které z toho plyne, je k nezaplacení.

### Je to praktické
Na rozdíl od parfému nebo šperku, prodloužení vlasů klientka nosí každý den. Připomíná jí váš dárek při každém pohledu do zrcadla.

### Je to osobní
Ukazuje, že jste o dárku přemýšleli. Není to "koupil jsem první věc v obchodě" — je to dárek, který říká "chci, abys se cítila krásně."

## Jak darovat prodloužení vlasů

### Varianta 1: Dárkový poukaz s konkrétní částkou
- Obdarovaná si vybere metodu, barvu a délku sama
- Nejbezpečnější varianta — nemusíte hádat odstín

### Varianta 2: Poukaz na konzultaci + prodloužení
- Zahrnuje osobní konzultaci v našem studiu
- Expertka pomůže s výběrem
- Kompletní zážitek od A do Z

### Varianta 3: Clip-in sada
- Pokud znáte barvu a délku vlasů obdarované
- Okamžitý dárek pod stromeček
- Obdarovaná si je nasadí sama za 5 minut

## Kolik to stojí

- **Clip-in sada**: od 3 000 Kč
- **Tape-in prodloužení**: od 5 000 Kč
- **Keratinové prodloužení**: od 7 000 Kč
- **Dárkový poukaz**: libovolná částka

## Jak objednat dárkový poukaz

1. Kontaktujte nás na info@hairland.cz nebo +420 608 553 103
2. Zvolte částku nebo konkrétní službu
3. Poukaz vám pošleme e-mailem nebo vytiskneme
4. Platnost 12 měsíců

## Pro koho se hodí

- **Partnerka/manželka**: Romantický a praktický dárek
- **Dcera**: Na 18. narozeniny, maturitní ples, promoce
- **Kamarádka**: Pro tu, která o prodloužení mluví, ale sama by si ho nekoupila
- **Maminka**: Proč ne? Krásné vlasy nemají věkový limit

## Tip

Zabalte poukaz do krabičky s malým pramínkem vlasů jako "ochutnávkou" — wow efekt zaručen.`,

"rok-2026-trendy-prodlouzeni-vlasu-shrnuti": `## Rok 2026 v prodloužení vlasů: shrnutí a výhled

Jaký byl rok 2026 v oblasti prodloužení vlasů? Co se změnilo, co přetrvalo a co nás čeká v roce 2027?

## Trendy, které kralovaly v 2026

### Tape-in dominance
Tape-in prodloužení definitivně předběhlo keratinové v popularitě. Důvod je jasný — rychlejší aplikace, snadnější přeaplikace a nižší cena. V roce 2026 tvořily tape-in metody přes 60 % všech prodloužení.

### Přirozené barvy
Éra extrémních kontrastů (tmavé kořínky + platinové délky) ustoupila. Klientky chtěly přirozené, vícerozměrné odstíny — honey bronde, mushroom brown, vanilla blonde. Barvy, u kterých okolí nepozná, že jsou "umělé".

### Kratší prodloužení pro objem
Překvapivý trend: prodloužení 30–40 cm pouze pro přidání objemu, ne délky. Klientky s vlastními vlasy pod ramena chtějí hustější vlasy, ne nutně delší.

### Transparentnost původu
Zákaznice se začaly ptát, odkud vlasy pocházejí. "Asijské vlasy" přestalo stačit — chtějí vědět přesnou zemi, oblast, způsob sběru. Etický sourcing se stal prodejním argumentem.

## Co se nezměnilo

- **Ukrajinské vlasy** zůstávají zlatým standardem pro evropský trh
- **Kvalita > cena** — klientky, které jednou zkusily levné vlasy, se vracejí ke kvalitě
- **Osobní konzultace** je stále nejlepší způsob prodeje — online objednávky vlasů bez odzkoušení generují vysoké reklamace

## Co nás čeká v 2027

### Micro ring comeback
Očekáváme návrat micro ring metody díky novým, menším kroužkům, které jsou prakticky neviditelné. Kombinace šetrnosti a diskrétnosti.

### Udržitelnost
Etický sourcing, recyklace vlasů a ekologické balení budou čím dál důležitější. Klientky se ptají na celý životní cyklus produktu.

### AI konzultace
Virtuální try-on aplikace pro vyzkoušení barvy a délky před nákupem. Technologie, která sníží chybovost při výběru.

### Customizace
Méně standardních produktů, více custom objednávek — přesná barva, přesná délka, přesná metoda. Každá klientka je unikátní.

## Čísla roku 2026

- Nejprodávanější délka: **50 cm**
- Nejpopulárnější barva: **6 (Tmavě hnědá)**
- Nejžádanější metoda: **Tape-in**
- Nejrychleji rostoucí kategorie: **Clip-in pro objem**

## Děkujeme

Děkujeme všem klientkám a spolupracujícím kadeřnicím za skvělý rok. V 2027 pokračujeme v tom, co děláme nejlíp — prémiové vlasy, transparentní původ, osobní přístup.`,

"jak-udrzet-prodlouzene-vlasy-krasne-po-6-mesicich": `## Jak si udržet prodloužené vlasy krásné i po 6 měsících

Prvních pár týdnů po aplikaci vypadají vlasy úžasně. Ale jak zajistit, aby tak vypadaly i po půl roce?

## Měsíc 1–2: Budování návyků

### Denní rutina (5 minut)
1. **Ráno:** Rozčesejte od konečků nahoru (2 min)
2. **Přes den:** Noste volný cop při sportu nebo domácích pracích
3. **Večer:** Rozčesejte, naneste leave-in kondicionér na konečky, zaplétejte cop na noc

### Týdenní péče
- 2–3× mytí šamponem bez sulfátů
- 1× hydratační maska na délky (ne na spoje!)

## Měsíc 3–4: Kontrola a údržba

### Přeaplikace (tape-in)
V tomto období je čas na první přeaplikaci. Spoje dorostly 2–3 cm od pokožky:
- Objednejte se ke kadeřnici
- Staré pásky se odstraní a nahradí novými
- Vlasy se vyčistí od zbytků lepidla
- Celý proces trvá 60–90 minut

### Keratinové spoje
Pokud máte keratin, zkontrolujte stav spojů. Pokud jsou stále pevné a méně než 4 cm od pokožky, vydržte.

### Kontrola konečků
Po 3 měsících mohou konečky potřebovat lehké zastřihnutí — jen 1–2 cm. Udržíte tím čistý vzhled.

## Měsíc 5–6: Rozhodování

### Stav vlasů
Kvalitní Virgin vlasy by měly být stále v dobré kondici. Zkontrolujte:
- Zamotávají se víc než na začátku?
- Jsou konečky třepivé?
- Ztratily lesk?

Pokud ano u všech tří → je čas na výměnu.
Pokud ne → vlasy zvládnou další přeaplikaci.

### Vlastní vlasy pod prodloužením
Zkontrolujte stav vlastních vlasů:
- Jsou v místě spojů ztenčené?
- Jsou některé oblasti řidší?
- Jsou na spojích uzlíky?

Pokud ano → nechte vlastní vlasy 2–4 týdny odpočinout před další aplikací.

## Chyby, které zkracují životnost

1. **Mytí každý den** — zbytečně zatěžuje spoje
2. **Spaní s mokrými vlasy** — uzlíky a zamotávání
3. **Fén na maximum** — vysušuje a oslabuje spoje
4. **Ignorování uzlíků** — malý uzlík se za den změní ve velký
5. **Odkládání přeaplikace** — příliš dorostlé spoje tahají za vlastní vlasy

## Zlaté pravidlo

**Prevence je levnější než oprava.** 5 minut denní péče vám ušetří předčasnou výměnu prodloužení za tisíce korun.`,

"novy-rok-nove-vlasy-leden-prodlouzeni": `## Nový rok, nové vlasy: proč je leden ideální čas na prodloužení

Leden je měsíc nových začátků a předsevzetí. "Budu se víc starat o sebe" je jedno z nejčastějších — a prodloužení vlasů je skvělý první krok.

## Proč právě leden?

### Psychologický fresh start
Po svátcích máme přirozenou touhu po změně. Nový rok, nový image. Prodloužení vlasů je transformace, kterou vidíte okamžitě — žádné čekání měsíce na výsledky jako u fitka.

### Posvátečná regenerace
Pokud jste měli prodloužení přes léto a podzim, leden je ideální čas na výměnu:
- Letní poškození (slunce, moře) je za vámi
- Vánoční stres pominul
- Můžete začít s čerstvými vlasy do nového roku

### Méně shon v salónech
Říjen–prosinec je nejrušnější období (plesy, Vánoce). V lednu mají kadeřnice více času — lepší termíny, klidnější atmosféra, víc pozornosti vám.

### Výhodné ceny
Mnoho dodavatelů a salonů nabízí v lednu slevy a akce. Poptávka po svátcích klesá = lepší podmínky pro vás.

## Novoroční přeměna krok za krokem

### Týden 1: Konzultace
- Navštivte nás nebo napište na WhatsApp
- Společně vybereme metodu, barvu a délku
- Prohlédnete si vlasy osobně

### Týden 2: Příprava
- Pokud máte staré prodloužení — sundáme ho
- Vlastní vlasy necháme 3–5 dní odpočinout
- Připravíme vlasy na zakázku (pokud není skladem)

### Týden 3: Aplikace
- Aplikace v salonu nebo u nás
- 1–3 hodiny podle metody
- Odcházíte s novými vlasy

### Týden 4+: Užívání
- Dodržujte péčovou rutinu
- Užívejte si nový look
- Sdílejte fotky (s naším hashtagkem!)

## Novoroční nabídka

Kontaktujte nás v lednu a získejte:
- Bezplatnou konzultaci s ukázkou vlasů
- Osobní odběr v Praze zdarma
- Poradenství s výběrem barvy

## Kontakt

- **Telefon/WhatsApp**: +420 608 553 103
- **E-mail**: info@hairland.cz
- **Instagram**: @hairland.cz

Nový rok si zaslouží nové vlasy. A vy si zasloužíte ty nejlepší.`,

};

async function fill() {
  for (const [slug, content] of Object.entries(articles)) {
    const result = await client.execute({
      sql: `UPDATE blog_posts SET content = ?, updatedAt = ? WHERE slug = ?`,
      args: [content, new Date().toISOString(), slug],
    });
    console.log(`${result.rowsAffected > 0 ? "✅" : "⚠️  not found:"} ${slug}`);
  }
  console.log(`\nHotovo! Naplněno ${Object.keys(articles).length} článků.`);
}

fill().catch(console.error);
