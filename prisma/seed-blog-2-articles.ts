import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { config } from "dotenv";
config({ path: ".env.production.local" });
config({ path: ".env.local" });

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

const article1ContentCs = `## Lze prodloužit jemné vlasy?

Ano, prodloužení vlasů je možné i pro ženy s jemnými vlasy. Ne každá metoda je však vhodná — špatný výběr metody nebo příliš velká gramáž může jemné vlasy poškodit. Klíčové je zvolit šetrnou metodu, správnou gramáž a svěřit se do rukou zkušené kadeřnice.

Jemné vlasy mají menší průměr jednotlivých vlásků a často i nižší hustotu. To znamená, že nesnesou takovou zátěž jako silné, husté vlasy. Dobrá zpráva? Existují metody, které byly navrženy přesně pro tento typ vlasů.

## Nejlepší metody pro jemné vlasy

### Tape-in — ideální volba

[Tape-in vlasy](/tape-in-vlasy) jsou pro jemné vlasy naprosto ideální. Plochý profil pásek (šířka cca 4 cm, tloušťka pod 1 mm) rozloží váhu rovnoměrně a minimálně zatěžuje kořínkový systém. Sendvičová metoda — kdy se pásky lepí z obou stran pramene — zajišťuje stabilní uchycení bez tahání.

**Výhody tape-in pro jemné vlasy:**
- Minimální zátěž kořínků díky plochému profilu
- Rovnoměrné rozložení váhy na velké ploše
- Aplikace trvá jen 30-60 minut
- Přelepení každé 6-8 týdnů

### Micro ring — skvělá alternativa

[Micro ring vlasy](/micro-ring-vlasy) jsou další šetrnou možností. Malé kovové kroužky (2-3 mm) se přitěsňují k vlastním vlasům bez lepidla a bez tepla. Díky tomu nedochází k chemickému poškození vlasů.

**Pro jemné vlasy volte nejmenší kroužky** (2 mm) a menší prameny — distribuce více menších pramenů je šetrnější než málo velkých.

### Keratin — podmíněně vhodný

Keratinové prodloužení může být vhodné pro středně jemné vlasy, ale silnější bondy mohou na velmi jemné vlasy působit přílišnou zátěž. Pokud zvažujete keratin, nechte kadeřnici posoudit sílu vašich vlasů.

### Clip-in — pro zvláštní příležitosti

[Clip-in vlasy](/clip-in-vlasy) jsou bezpečné pro příležitostné nošení — na oslavu, focení nebo večer. Pro denní nošení však nejsou ideální, protože klipy mohou při opakovaném nasazování jemné vlasy namáhat.

### Tresy — nedoporučujeme

Tresové vlasy jsou pro jemné vlasy příliš těžké. Sešití na jeden pás působí vysoký tah na malé ploše, což může vést k trakční alopecii (vypadávání vlasů způsobenému tahem).

## Kolik gramů vlasů na jemné vlasy?

Správná gramáž je u jemných vlasů klíčová. Platí pravidlo: **méně je více**. Příliš těžké prodloužení působí nepřirozeným dojmem a poškozuje vlastní vlasy.

| Efekt | Silné vlasy | Jemné vlasy |
|-------|-------------|-------------|
| Lehké zhuštění | 100-120 g | 60-80 g |
| Plné prodloužení | 150-200 g | 100-130 g |
| Extra objem | 200+ g | 130-160 g |

**Tip:** Konzultace zdarma vám pomůže určit přesnou gramáž. Pošlete nám fotku vašich vlasů a doporučíme optimální množství. Více o gramáži najdete v našem [průvodci gramáží](/pruvodce-gramazi).

## Na co si dát pozor

Prodloužení jemných vlasů vyžaduje opatrnost. Zde jsou hlavní rizika, kterým je třeba předejít:

### Přetížení kořínků

Příliš velká gramáž může způsobit trakční alopecii — vypadávání vlasů způsobené dlouhodobým tahem na kořínkový systém. U jemných vlasů je tato hranice nižší než u silných vlasů.

### Nevhodná distribuce

Pásky nebo bondy musí být rovnoměrně rozloženy po celé hlavě. Koncentrace zátěže na jednom místě (např. jen na temeni) vede k nerovnoměrnému tahu a viditelným prořídlým místům.

### Špatné časování přelepení

U jemných vlasů doporučujeme přelepení nebo posunutí každé **5-6 týdnů** (oproti 6-8 týdnům u silných vlasů). Jak vlasy dorůstají, zátěž se přesouvá na kořínky — zkrácený interval předchází poškození.

### Nezkušený aplikátor

Pro jemné vlasy je zkušenost kadeřnice naprosto klíčová. Nechte si prodloužení provést u specialistky, která má zkušenosti s jemnými vlasy a ví, jak správně rozložit zátěž.

## Péče o prodloužené jemné vlasy

Specifická péče prodlouží životnost prodloužení a ochrání vaše vlastní vlasy:

### Kartáčování

Používejte speciální kartáč s měkkými štětinami. **Vždy kartáčujte od konečků směrem nahoru** — nikdy od kořínků dolů. Tím zabráníte tahání a trhání jemných vlasů.

### Mytí

Používejte šampon bez sulfátů a silikonů. Sulfáty vysušují a silikony se hromadí na páskách a bondech, což oslabuje uchycení. Kondicionér nanášejte od středních délek ke konečkům, nikdy na bondy/pásky.

### Spánek

Před spaním si udělejte volný cop nebo culík. **Nikdy neléhat s mokrými vlasy** — mokré vlasy jsou křehčí a lehce se lámou. Zvažte hedvábný polštář, který minimalizuje tření.

### Tepelná úprava

Omezte používání fénu, kulmy a žehličky. Pokud je používáte, nastavte teplotu maximálně na 160 °C a vždy použijte termoochranný sprej. Na bondy a pásky teplo nesměrujte.

## Konzultace zdarma — poradíme vám

Nejste si jistá, která metoda je pro vaše jemné vlasy nejvhodnější? **Napište nám** fotku vašich vlasů a poradíme:

- Kterou metodu zvolit
- Kolik gramů budete potřebovat
- Jaká délka je reálná
- Jak se o prodloužení starat

[Kontaktujte nás](/kontakt) nebo si prohlédněte naši [nabídku vlasů k prodloužení](/vlasy-k-prodlouzeni). Konzultace je vždy zdarma a nezávazná.`;

const article1ContentUk = `## Чи можна наростити тонке волосся?

Так, нарощування волосся можливе навіть для жінок з тонким волоссям. Але не кожен метод підходить — неправильний вибір методу або занадто велика грамажі може пошкодити тонке волосся. Ключ — обрати дбайливий метод, правильну грамаж та довірити роботу досвідченій перукарці.

## Найкращі методи для тонкого волосся

### Tape-in — ідеальний вибір

[Tape-in волосся](/tape-in-vlasy) ідеально підходить для тонкого волосся. Плоский профіль стрічок рівномірно розподіляє вагу та мінімально навантажує кореневу систему.

**Переваги tape-in для тонкого волосся:**
- Мінімальне навантаження на корені
- Рівномірний розподіл ваги
- Аплікація лише 30-60 хвилин
- Переклеювання кожні 6-8 тижнів

### Micro ring — чудова альтернатива

[Micro ring волосся](/micro-ring-vlasy) — ще один дбайливий варіант. Маленькі кільця кріпляться без клею та тепла, що не пошкоджує волосся.

### Кератин — умовно підходить

Кератинове нарощування може підходити для середньо тонкого волосся, але сильніші бонди можуть створювати зайве навантаження.

### Clip-in — для особливих нагод

[Clip-in волосся](/clip-in-vlasy) безпечне для періодичного носіння — на свято або фотосесію. Для щоденного носіння не ідеальне.

## Скільки грамів для тонкого волосся?

| Ефект | Густе волосся | Тонке волосся |
|-------|---------------|---------------|
| Легке згущення | 100-120 г | 60-80 г |
| Повне нарощування | 150-200 г | 100-130 г |
| Екстра об'єм | 200+ г | 130-160 г |

Детальніше про грамаж у нашому [гіді по вазі](/pruvodce-gramazi).

## На що звернути увагу

### Перевантаження коренів

Занадто велика грамаж може спричинити тракційну алопецію — випадіння волосся через постійне натягнення кореневої системи.

### Неправильний розподіл

Стрічки або бонди повинні бути рівномірно розподілені по всій голові.

### Своєчасне переклеювання

Для тонкого волосся рекомендуємо переклеювання кожні **5-6 тижнів**.

## Догляд за нарощеним тонким волоссям

- Розчісуйте від кінчиків вгору
- Шампунь без сульфатів та силіконів
- Сон з вільною косою, ніколи з мокрим волоссям
- Мінімум теплової обробки (макс. 160 °C)

## Безкоштовна консультація

Не впевнені, який метод підходить для вашого тонкого волосся? Надішліть нам фото і ми порадимо метод та грамаж. [Зв'яжіться з нами](/kontakt) або перегляньте [волосся для нарощування](/vlasy-k-prodlouzeni).`;

const article1ContentRu = `## Можно ли нарастить тонкие волосы?

Да, наращивание волос возможно даже для женщин с тонкими волосами. Но не каждый метод подходит — неправильный выбор метода или слишком большой граммаж может повредить тонкие волосы. Ключ — выбрать бережный метод, правильный граммаж и доверить работу опытному мастеру.

## Лучшие методы для тонких волос

### Tape-in — идеальный выбор

[Tape-in волосы](/tape-in-vlasy) идеально подходят для тонких волос. Плоский профиль лент равномерно распределяет вес и минимально нагружает корневую систему.

**Преимущества tape-in для тонких волос:**
- Минимальная нагрузка на корни
- Равномерное распределение веса
- Аппликация всего 30-60 минут
- Переклейка каждые 6-8 недель

### Micro ring — отличная альтернатива

[Micro ring волосы](/micro-ring-vlasy) — ещё один бережный вариант. Маленькие кольца крепятся без клея и тепла.

### Кератин — условно подходит

Кератиновое наращивание может подходить для средне тонких волос, но более сильные бонды могут создавать лишнюю нагрузку.

### Clip-in — для особых случаев

[Clip-in волосы](/clip-in-vlasy) безопасны для периодического ношения — на праздник или фотосессию.

## Сколько граммов для тонких волос?

| Эффект | Густые волосы | Тонкие волосы |
|--------|---------------|---------------|
| Лёгкое загущение | 100-120 г | 60-80 г |
| Полное наращивание | 150-200 г | 100-130 г |
| Экстра объём | 200+ г | 130-160 г |

Подробнее о граммаже в нашем [гиде по весу](/pruvodce-gramazi).

## На что обратить внимание

### Перегрузка корней

Слишком большой граммаж может вызвать тракционную алопецию — выпадение волос из-за постоянного натяжения.

### Неправильное распределение

Ленты или бонды должны быть равномерно распределены по всей голове.

### Своевременная переклейка

Для тонких волос рекомендуем переклейку каждые **5-6 недель**.

## Уход за наращёнными тонкими волосами

- Расчёсывайте от кончиков вверх
- Шампунь без сульфатов и силиконов
- Спать со свободной косой, никогда с мокрыми волосами
- Минимум тепловой обработки (макс. 160 °C)

## Бесплатная консультация

Не уверены, какой метод подходит для ваших тонких волос? Отправьте нам фото и мы посоветуем метод и граммаж. [Свяжитесь с нами](/kontakt) или посмотрите [волосы для наращивания](/vlasy-k-prodlouzeni).`;

// ——————— Article 2: Post-chemo ———————

const article2ContentCs = `## Kdy začít uvažovat o prodloužení vlasů po chemoterapii

Ztráta vlasů patří mezi nejnáročnější vedlejší účinky onkologické léčby. Každá žena prochází tímto obdobím jinak a neexistuje jedno správné řešení pro všechny. Prodloužení vlasů je **jednou z možností** — ne nutností.

**Důležité:** Tento článek není lékařská rada. Před jakýmkoli zásahem do vlasů po chemoterapii se vždy poraďte se svým onkologem.

### Růst vlasů po chemoterapii

Vlasy začínají růst obvykle 2-4 týdny po posledním cyklu chemoterapie. První vlasy mohou mít jinou texturu — často jsou jemnější, kudrnatější nebo tmavší než před léčbou. Toto je normální a textura se často během 6-12 měsíců stabilizuje.

### Minimální délka pro prodloužení

- **Clip-in:** možné už od 3-5 cm (přitiskají se na vlastní vlasy)
- **Tape-in:** minimálně 5-8 cm (pásky potřebují dostatečný podklad)
- **Micro ring:** minimálně 8-10 cm (kroužky se upevňují na prameny)
- **Keratin:** nedoporučujeme v raném stádiu — teplo a chemikálie na nových vlasech

### Trpělivost je klíčová

Plná hustota vlasů se vrací obvykle za 6-12 měsíců po ukončení léčby. Každá žena je jiná — některé mají husté vlasy už po 4 měsících, jiné až po roce. Neporovnávejte se s ostatními a respektujte vlastní tempo.

## Které metody prodloužení jsou bezpečné

### Clip-in — nejbezpečnější start

[Clip-in vlasy](/clip-in-vlasy) jsou ideální jako první krok po chemoterapii:
- Žádné lepidlo, žádné teplo
- Nasadíte a sundáte kdykoli
- Nulová permanentní zátěž kořínků
- Možnost postupně zvykat na delší vlasy

Clip-in jsou skvělé pro **přechodné období**, kdy vaše vlasy teprve dorůstají k dostatečné délce pro permanentní metody.

### Tape-in — šetrná permanentní metoda

Jakmile vaše vlasy dorostou na 5-8 cm a váš onkolog souhlasí, [tape-in vlasy](/tape-in-vlasy) jsou nejšetrnější permanentní metodou:
- Plochý profil minimalizuje zátěž
- Hypoalergenní lepidlo (dobré pro citlivou pokožku po léčbě)
- Snadné přelepení bez tahání

### Micro ring — podmíněně vhodné

Micro ring prodloužení je možné, pokud jsou vaše vlasy dostatečně silné (minimálně 8 cm a střední průměr). Kovové kroužky nevyžadují lepidlo ani teplo, ale zátěž na jednotlivé prameny je vyšší než u tape-in.

### Keratin — spíše nedoporučujeme

Keratin vyžaduje teplo k přitavení bondu na vlastní vlasy. Po chemoterapii jsou nové vlasy často křehké a citlivé — tepelné zpracování může způsobit další poškození. Doporučujeme počkat minimálně 12 měsíců po ukončení léčby.

### Paruky a příčesky — alternativa pro mezifázi

Pokud vaše vlasy ještě nedosahují dostatečné délky pro prodloužení, kvalitní paruka nebo příčesek mohou být skvělá alternativa. Existují paruky z pravých vlasů, které vypadají naprosto přirozeně.

## Jak vybrat správné vlasy po chemoterapii

### Barva

Nové vlasy mohou mít jiný odstín než před léčbou. **Počkejte na stabilizaci** (3-6 měsíců), než si vyberete finální barvu prodloužení. Clip-in můžete zkusit dříve — snadno je vyměnit, pokud barva nesedí.

### Textura

Pokud jsou vaše nové vlasy kudrnatější než dříve, rovné prodloužení může působit nepřirozeným dojmem. Zvažte začít s clip-in, které můžete vyzkoušet bez závazku.

### Gramáž — méně je více

Po chemoterapii doporučujeme **nižší gramáž než obvykle**:
- Začátek: 60-80 g
- Po stabilizaci (6+ měsíců): 80-120 g
- Plné prodloužení: 100-150 g

Postupné přidávání je šetrnější než okamžité velké množství. Více o gramáži v našem [průvodci](/pruvodce-gramazi).

### Kategorie vlasů

Panenské (virgin) vlasy jsou nejšetrnější k citlivé pokožce. Nebyly zpracovány chemicky, takže jsou hypoalergennější. Prohlédněte si naši [nabídku vlasů](/vlasy-k-prodlouzeni).

## Na co si dát pozor — specifická rizika

### Citlivá pokožka hlavy

Po chemoterapii může být pokožka hlavy citlivější než obvykle. **Vyhněte se lepidlu přímo na kůži** a pokud používáte tape-in, požádejte kadeřnici o hypoalergenní pásky.

### Křehké nově rostoucí vlasy

Nové vlasy jsou obvykle křehčí než před léčbou. Nepoužívejte těžké metody (tresy, velké keratinové bondy) a dávejte přednost lehčím alternativám.

### Alergie po léčbě

Chemoterapie může změnit citlivost na materiály, které vám dříve nevadily. **Testujte lepidlo na malé ploše** (za uchem) 24 hodin před aplikací.

### Častější kontroly

Doporučujeme návštěvu kadeřnice každé **4 týdny** (oproti 6-8 u běžného prodloužení). Kratší interval umožní kontrolovat stav vašich vlastních vlasů.

## Péče o prodloužené vlasy po chemoterapii

### Extra šetrné přípravky

Používejte šampony a kondicionéry **bez sulfátů, parabenů a silikonů**. Citlivá pokožka po léčbě vyžaduje maximálně jemné přípravky.

### Minimální tepelná úprava

Snižte používání fénu a žehličky na minimum. Pokud je používáte, nastavte teplotu maximálně na **150 °C** a vždy s termoochranným sprejem.

### Podpora růstu

Po konzultaci s lékařem zvažte suplementy na podporu růstu vlasů:
- **Biotin** — podporuje produkci keratinu
- **Zinek** — důležitý pro zdravý růst vlasů
- **Železo** — častá deficit po léčbě

### Masáž pokožky hlavy

Jemná masáž pokožky hlavy (2-3 minuty denně) zlepšuje prokrvení a podporuje růst nových vlasů. Použijte jemné bříšky prstů, nikdy nehty.

## Emocionální stránka — nejste v tom samy

Ztráta vlasů je pro mnoho žen jedním z nejnáročnějších vedlejších účinků léčby. Je naprosto normální cítit smutek, frustraci nebo nejistotu.

### Každá žena je jiná

Některé ženy se rozhodnou pro prodloužení hned, jak je to možné. Jiné preferují krátký střih a užívají si nový začátek. **Obojí je naprosto v pořádku.** Důležité je respektovat vlastní tempo a dělat to, co vám dělá dobře.

### Prodloužení jako jeden z nástrojů

Prodloužení vlasů může pomoci obnovit sebedůvěru a pocit normality. Není to marnivost — je to způsob, jak se cítit více jako vy sama.

### Jsme tu pro vás

V Hairlandu přistupujeme k tomuto tématu s maximální empatií. Pokud zvažujete prodloužení vlasů po chemoterapii, [napište nám](/kontakt). Nabídneme vám:

- **Bezplatnou konzultaci** — poradíme metodu, gramáž i barvu
- **Bez tlaku** — není naše role vás přesvědčovat; chceme vám pomoct najít to, co je správné pro vás
- **Diskrétnost** — vše proběhne v soukromí

Můžete nám napsat na [WhatsApp](https://wa.me/420608553103) nebo zavolat na +420 608 553 103. Konzultace je vždy zdarma.`;

const article2ContentUk = `## Коли починати нарощування волосся після хіміотерапії

Втрата волосся — один з найважчих побічних ефектів онкологічного лікування. Кожна жінка переживає цей період по-різному, і не існує єдиного правильного рішення. Нарощування волосся — це **одна з можливостей**, а не необхідність.

**Важливо:** Ця стаття не є медичною порадою. Перед будь-яким втручанням у волосся після хіміотерапії завжди порадьтеся зі своїм онкологом.

### Ріст волосся після хіміотерапії

Волосся починає рости зазвичай через 2-4 тижні після останнього циклу. Перше волосся може мати іншу текстуру — часто тонше, кучерявіше або темніше. Текстура зазвичай стабілізується протягом 6-12 місяців.

### Мінімальна довжина для нарощування

- **Clip-in:** від 3-5 см
- **Tape-in:** мінімум 5-8 см
- **Micro ring:** мінімум 8-10 см
- **Кератин:** не рекомендуємо на ранній стадії

## Які методи безпечні

### Clip-in — найбезпечніший старт

[Clip-in волосся](/clip-in-vlasy) ідеальне як перший крок:
- Жодного клею, жодного тепла
- Надіваєте та знімаєте будь-коли
- Нульове постійне навантаження на корені

### Tape-in — дбайливий постійний метод

Коли волосся доросте до 5-8 см, [tape-in](/tape-in-vlasy) — найдбайливіший постійний метод з гіпоалергенним клеєм.

### Micro ring — умовно підходить

Можливе при достатній силі волосся (мінімум 8 см).

### Кератин — скоріше не рекомендуємо

Тепло на новому волоссі після хіміотерапії може завдати додаткової шкоди.

## Як обрати правильне волосся

- **Колір:** зачекайте на стабілізацію (3-6 місяців)
- **Грамаж:** менше — краще. Початок: 60-80 г. Детальніше у [гіді по вазі](/pruvodce-gramazi)
- **Категорія:** незаймане (virgin) волосся — найдбайливіше для чутливої шкіри

## На що звернути увагу

- Чутлива шкіра голови — уникайте клею прямо на шкірі
- Крихке нове волосся — не використовуйте важкі методи
- Алергії: тестуйте клей на маленькій ділянці
- Частіші контролі: кожні 4 тижні

## Догляд

- Шампунь без сульфатів, парабенів та силіконів
- Мінімум теплової обробки (макс. 150 °C)
- Масаж шкіри голови для покращення кровообігу

## Емоційна сторона

Втрата волосся — це нормально переживати. Нарощування може допомогти відновити впевненість у собі. Кожна жінка інша — важливо поважати власний темп.

[Зв'яжіться з нами](/kontakt) — безкоштовна консультація без тиску. WhatsApp: +420 608 553 103.`;

const article2ContentRu = `## Когда начинать наращивание волос после химиотерапии

Потеря волос — один из самых тяжёлых побочных эффектов онкологического лечения. Каждая женщина переживает этот период по-своему, и нет единственного правильного решения. Наращивание волос — это **одна из возможностей**, а не необходимость.

**Важно:** Эта статья не является медицинским советом. Перед любым вмешательством в волосы после химиотерапии всегда проконсультируйтесь со своим онкологом.

### Рост волос после химиотерапии

Волосы начинают расти обычно через 2-4 недели после последнего цикла. Первые волосы могут иметь другую текстуру — часто тоньше, кудрявее или темнее. Текстура обычно стабилизируется в течение 6-12 месяцев.

### Минимальная длина для наращивания

- **Clip-in:** от 3-5 см
- **Tape-in:** минимум 5-8 см
- **Micro ring:** минимум 8-10 см
- **Кератин:** не рекомендуем на ранней стадии

## Какие методы безопасны

### Clip-in — самый безопасный старт

[Clip-in волосы](/clip-in-vlasy) идеальны как первый шаг:
- Никакого клея, никакого тепла
- Надеваете и снимаете в любое время
- Нулевая постоянная нагрузка на корни

### Tape-in — бережный постоянный метод

Когда волосы дорастут до 5-8 см, [tape-in](/tape-in-vlasy) — самый бережный постоянный метод с гипоаллергенным клеем.

### Micro ring — условно подходит

Возможно при достаточной силе волос (минимум 8 см).

### Кератин — скорее не рекомендуем

Тепло на новых волосах после химиотерапии может нанести дополнительный вред.

## Как выбрать правильные волосы

- **Цвет:** подождите стабилизации (3-6 месяцев)
- **Граммаж:** меньше — лучше. Начало: 60-80 г. Подробнее в [гиде по весу](/pruvodce-gramazi)
- **Категория:** девственные (virgin) волосы — самые бережные для чувствительной кожи

## На что обратить внимание

- Чувствительная кожа головы — избегайте клея прямо на коже
- Хрупкие новые волосы — не используйте тяжёлые методы
- Аллергии: тестируйте клей на маленьком участке
- Частые контроли: каждые 4 недели

## Уход

- Шампунь без сульфатов, парабенов и силиконов
- Минимум тепловой обработки (макс. 150 °C)
- Массаж кожи головы для улучшения кровообращения

## Эмоциональная сторона

Потеря волос — это нормально переживать. Наращивание может помочь восстановить уверенность в себе. Каждая женщина уникальна — важно уважать собственный темп.

[Свяжитесь с нами](/kontakt) — бесплатная консультация без давления. WhatsApp: +420 608 553 103.`;

async function main() {
  // Article 1: Fine hair
  const article1Data = {
    title: "Prodloužení vlasů pro jemné vlasy — jak na to bezpečně",
    titleUk: "Нарощування волосся для тонкого волосся — як зробити безпечно",
    titleRu: "Наращивание волос для тонких волос — как сделать безопасно",
    excerpt: "Máte jemné vlasy a chcete je prodloužit? Průvodce nejšetrnějšími metodami, správnou gramáží a péčí pro jemné vlasy.",
    excerptUk: "Маєте тонке волосся і хочете нарощування? Гід по найдбайливіших методах, правильній грамажі та догляду.",
    excerptRu: "У вас тонкие волосы и вы хотите наращивание? Гид по самым бережным методам, правильному граммажу и уходу.",
    content: article1ContentCs,
    contentUk: article1ContentUk,
    contentRu: article1ContentRu,
    category: "guide",
    metaTitle: "Prodloužení vlasů pro jemné vlasy | Hairland",
    metaDescription: "Máte jemné vlasy a chcete je prodloužit? Průvodce nejšetrnějšími metodami, správnou gramáží a péčí. Tape-in a micro ring jsou ideální volba.",
    published: true,
    publishedAt: new Date(),
  };
  await prisma.blogPost.upsert({
    where: { slug: "prodlouzeni-vlasu-pro-jemne-vlasy" },
    update: article1Data,
    create: { slug: "prodlouzeni-vlasu-pro-jemne-vlasy", ...article1Data },
  });

  // Article 2: Post-chemo
  const article2Data = {
    title: "Prodloužení vlasů po chemoterapii — kdy a jak začít",
    titleUk: "Нарощування волосся після хіміотерапії — коли і як почати",
    titleRu: "Наращивание волос после химиотерапии — когда и как начать",
    excerpt: "Kdy začít s prodloužením vlasů po chemoterapii? Bezpečné metody, minimální délka vlastních vlasů a šetrný přístup k prodloužení.",
    excerptUk: "Коли починати нарощування волосся після хіміотерапії? Безпечні методи, мінімальна довжина власного волосся та дбайливий підхід.",
    excerptRu: "Когда начинать наращивание волос после химиотерапии? Безопасные методы, минимальная длина собственных волос и бережный подход.",
    content: article2ContentCs,
    contentUk: article2ContentUk,
    contentRu: article2ContentRu,
    category: "care",
    metaTitle: "Vlasy po chemoterapii — kdy začít | Hairland",
    metaDescription: "Kdy začít s prodloužením vlasů po chemoterapii? Bezpečné metody, minimální délka vlastních vlasů a šetrný přístup. Konzultace zdarma.",
    published: true,
    publishedAt: new Date(),
  };
  await prisma.blogPost.upsert({
    where: { slug: "prodlouzeni-vlasu-po-chemoterapii" },
    update: article2Data,
    create: { slug: "prodlouzeni-vlasu-po-chemoterapii", ...article2Data },
  });

  console.log("2 blog articles created (published)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
