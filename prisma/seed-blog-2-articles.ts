import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { config } from "dotenv";
config({ path: ".env.local" });

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

const article1ContentCs = `## Lze prodlouzit jemne vlasy?

Ano, prodlouzeni vlasu je mozne i pro zeny s jemnymi vlasy. Ne kazda metoda je vsak vhodna — spatny vyber metody nebo prilis velka gramaz muze jemne vlasy poskodit. Klicove je zvolit setrnou metodu, spravnou gramaz a sveri se do rukou zkusene kadernice.

Jemne vlasy maji mensi prumer jednotlivych vlasku a casto i nizsi hustotu. To znamena, ze nesnesou takovou zatez jako silne, huste vlasy. Dobra zprava? Existuji metody, ktere byly navrzeny presne pro tento typ vlasu.

## Nejlepsi metody pro jemne vlasy

### Tape-in — idealni volba

[Tape-in vlasy](/tape-in-vlasy) jsou pro jemne vlasy naprosto idealni. Plochy profil pasek (sirka cca 4 cm, tlouska pod 1 mm) rozlozi vahu rovnomerne a minimalne zatezuje korinkovy system. Sendvicova metoda — kdy se pasky lepi z obou stran pramene — zajistuje stabilni uchyceni bez tahani.

**Vyhody tape-in pro jemne vlasy:**
- Minimalni zatez korinku diky plochemu profilu
- Rovnomerne rozlozeni vahy na velke plose
- Aplikace trvá jen 30-60 minut
- Prelepeni kazde 6-8 tydnu

### Micro ring — skvela alternativa

[Micro ring vlasy](/micro-ring-vlasy) jsou dalsi setrnou moznosti. Male kovove krouzky (2-3 mm) se pritesuji k vlastnim vlasum bez lepidla a bez tepla. Diky tomu nedochazi k chemickemu poskozenivlasu.

**Pro jemne vlasy volte nejmensi krouzky** (2 mm) a mensiprameny — distribuce vice mensich pramenu je setrnejsi nez malo velkych.

### Keratin — podmínene vhodny

Keratinove prodlouzeni muze byt vhodne pro stredne jemne vlasy, ale silnejsi bondy mohou na velmi jemne vlasy pusobit prilisnou zatez. Pokud zvazujete keratin, nechte kadernici posoudit silu vasich vlasu.

### Clip-in — pro zvlastni prilezitosti

[Clip-in vlasy](/clip-in-vlasy) jsou bezpecne pro prilezitostne noseni — na oslavu, foceni nebo vecer. Pro denni noseni vsak nejsou idealni, protoze klipy mohou pri opakovanem nasazovani jemne vlasy namáhat.

### Tresy — nedoporucujeme

Tresove vlasy jsou pro jemne vlasy prilis tezke. Sesiti na jeden pas pusobí vysoky tah na male plose, coz muze vest k trakcni alopecii (vypadavani vlasu zpusobenemu tahem).

## Kolik gramu vlasu na jemne vlasy?

Spravna gramaz je u jemnych vlasu klicova. Platí pravidlo: **mene je vice**. Prilis tezke prodlouzeni pusobi neprirozenym dojmem a poškozuje vlastni vlasy.

| Efekt | Silne vlasy | Jemne vlasy |
|-------|-------------|-------------|
| Lehke zhusteni | 100-120 g | 60-80 g |
| Plne prodlouzeni | 150-200 g | 100-130 g |
| Extra objem | 200+ g | 130-160 g |

**Tip:** Konzultace zdarma vam pomuze urcit presnou gramaz. Poslete nam fotku vasich vlasu a doporucíme optimalni mnozstvi. Vice o gramazi najdete v nasem [pruvodci gramazi](/pruvodce-gramazi).

## Na co si dat pozor

Prodlouzeni jemnych vlasu vyzaduje opatrnost. Zde jsou hlavni rizika, kterym je treba predejit:

### Pretizeni korinku

Prilis velka gramaz muze zpusobit trakcni alopecii — vypadavani vlasu zpusobene dlouhodobym tahem na korinkovy system. U jemnych vlasu je tato hranice nizsi nez u silnych vlasu.

### Nevhodna distribuce

Paskyenbo bondy musi byt rovnomerne rozlozeny po cele hlave. Koncentrace zateze na jednom miste (napr. jen na temeni) vede k nerovnomernemu tahu a viditelnym proridlym mistum.

### Spatne casovani prelepeni

U jemnych vlasu doporucujeme prelepení nebo posunuti kazde **5-6 tydnu** (oproti 6-8 tydnum u silnych vlasu). Jak vlasy dorustaji, zatez se presouva na korinky — zkraceny interval predchazi poskozeni.

### Nezkuseny aplikator

Pro jemne vlasy je zkusenost kadernice naprosto klicova. Nechte si prodlouzeni provest u specialistky, ktera ma zkusenosti s jemnymi vlasy a vi, jak spravne rozlozit zatez.

## Pece o prodlouzene jemne vlasy

Specificka pece prodlouzi zivotnost prodlouzeni a ochrání vase vlastni vlasy:

### Kartacovani

Pouzivejte specialni kartac s mekkymi stetinami. **Vzdy kartacujte od konecku smerem nahoru** — nikdy od korinku dolu. Tim zabranite tahani a trhani jemnych vlasu.

### Myti

Pouzivejte sampon bez sulfatu a silikonu. Sulfaty vysusují a silikony se hromadi na paskach a bondech, coz oslabuje uchyceni. Kondicioner nanasejte od stredních delek ke koneckum, nikdy na bondy/pasky.

### Spanek

Pred spankem si udelejte volny cop nebo culík. **Nikdy nelehat s mokrymi vlasy** — mokre vlasy jsou krehci a lehce se lámou. Zvaztehedvabny polstar, ktery minimalizuje treni.

### Tepelna uprava

Omezte pouzivani fehu, kulmy a zehlicky. Pokud je pouzivate, nastavte teplotu maximalne na 160 °C a vzdy pouzijte termoochronny sprej. Na bondy a pasky teplo nesmerujte.

## Konzultace zdarma — poradime vam

Nejste si jista, ktera metoda je pro vase jemne vlasy nejvhodnejsi? **Napiste nam** fotku vasich vlasu a poradime:

- Kterou metodu zvolit
- Kolik gramu budete potrebovat
- Jaka delka je realna
- Jak se o prodlouzení starat

[Kontaktujte nas](/kontakt) nebo si prohlédnete nasi [nabidku vlasu k prodlouzeni](/vlasy-k-prodlouzeni). Konzultace je vzdy zdarma a nezavazna.`;

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

const article2ContentCs = `## Kdy zacit uvazovat o prodlouzeni vlasu po chemoterapii

Ztrata vlasu patri mezi nejnárocnejsi vedlejsi ucinky onkologicke lecby. Kazda zena prochazi timto obdobim jinak a neexistuje jedno spravne reseni pro vsechny. Prodlouzeni vlasu je **jednou z moznosti** — ne nutnosti.

**Dulezite:** Tento clanek neni lekarska rada. Pred jakymkoli zasahem do vlasu po chemoterapii se vzdy poradte se svym onkologem.

### Rust vlasu po chemoterapii

Vlasy zacinaji rust obvykle 2-4 tydny po poslednim cyklu chemoterapie. Prvni vlasy mohou mit jinou texturu — casto jsou jemnejsi, kudrnatejsi nebo tmavsi nez pred lecbou. Toto je normalni a textura se casto behem 6-12 mesicu stabilizuje.

### Minimalni delka pro prodlouzeni

- **Clip-in:** mozne uz od 3-5 cm (pritiskaji se na vlastni vlasy)
- **Tape-in:** minimalne 5-8 cm (pasky potrebuji dostatecny podklad)
- **Micro ring:** minimalne 8-10 cm (krouzky se upevnuji na prameny)
- **Keratin:** nedoporucujeme v ranemsitadiu — teplo a chemikalie na novych vlasech

### Trpelivost je klicova

Plna hustota vlasu se vraci obvykle za 6-12 mesicu po ukonceni lecby. Kazda zena je jina — nektere maji huste vlasy uz po 4 mesicich, jine az po roce. Neporovnavejte se s ostatnimia respektujte vlastni tempo.

## Ktere metody prodlouzeni jsou bezpecne

### Clip-in — nejbezpecnejsi start

[Clip-in vlasy](/clip-in-vlasy) jsou idealni jako prvni krok po chemoterapii:
- Zadne lepidlo, zadne teplo
- Nasadite a sundáte kdykoli
- Nulova permanentni zatez korinku
- Moznost postupne zvykat na delsi vlasy

Clip-in jsou skvele pro **prechodne obdobi**, kdy vase vlasy teprve dorustavaji k dostatecne delce pro permanentni metody.

### Tape-in — setrna permanentní metoda

Jakmile vase vlasy dorostou na 5-8 cm a vas onkolog souhlasi, [tape-in vlasy](/tape-in-vlasy) jsou nejsetrnejsi permanentni metodou:
- Plochy profil minimalizuje zatez
- Hypoalergenni lepidlo (dobre pro citlivou pokozku po lecbe)
- Snadne prelepeni bez tahani

### Micro ring — podmínene vhodne

Micro ring prodlouzeni je mozne, pokud jsou vase vlasy dostatecne silne (minimalne 8 cm a stredni prumer). Kovove krouzky nevyzaduji lepidlo ani teplo, ale zatez na jednotlive prameny je vyssi nez u tape-in.

### Keratin — spise nedoporucujeme

Keratin vyzaduje teplo k pritaveni bondu na vlastni vlasy. Po chemoterapii jsou novych vlasy casto krehke a citlive — tepelne zpracovani muze zpusobit dalsi poskozeni. Doporucujeme pockat minimalne 12 mesicu po ukonceni lecby.

### Paruky a pricesky — alternativa pro mezifázi

Pokud vase vlasy jeste nedosahuji dostatecne delky pro prodlouzeni, kvalitni paruka nebo pricesek mohou byt skvela alternativa. Existuji paruky z pravych vlasu, ktere vypadaji naprosto prirozene.

## Jak vybrat spravne vlasy po chemoterapii

### Barva

Nove vlasy mohou mit jiny odstin nez pred lecbou. **Pockejte na stabilizaci** (3-6 mesicu), nez si vyberte finalni barvu prodlouzeni. Clip-in muzete zkusit drive — snadno je vymenit, pokud barva nesedi.

### Textura

Pokud jsou vase nove vlasy kudrnatejsi nez drive, rovne prodlouzeni muze pusobit neprirozenym dojmem. Zvaztebudzacinat s clip-in, ktere muzete vyzkouset bez zavazku.

### Gramaz — mene je vice

Po chemoterapii doporucujeme **nizsi gramaz nez obvykle**:
- Zacatek: 60-80 g
- Po stabilizaci (6+ mesicu): 80-120 g
- Plne prodlouzeni: 100-150 g

Postupne pridavani je setrnejsi nez okamzite velke mnozstvi. Vice o gramazi v nasem [pruvodci](/pruvodce-gramazi).

### Kategorie vlasu

Panenske (virgin) vlasy jsou nejsetrnejsi k citlive pokozce. Nebylyzpracovany chemicky, takze jsou hypoalergennejsi. Prohlédnete si nasi [nabidku vlasu](/vlasy-k-prodlouzeni).

## Na co si dat pozor — specificka rizika

### Citliva pokozka hlavy

Po chemoterapii muze byt pokozka hlavy citlivejsi nez obvykle. **Vyhnete se lepidlu primo na kuzi** a pokud pouzivate tape-in, pozadejte kadernici o hypoalergenni pasky.

### Krehke noverostouci vlasy

Nove vlasy jsou obvykle krehci nez pred lecbou. Nepouzivejte tezke metody (tresy, velke keratinove bondy) a dávejte prednost lehcim alternativam.

### Alergie po lecbe

Chemoterapie muze zmenit citlivost na materialy, ktere vam drive nevadily. **Testujte lepidlo na male plose** (za uchem) 24 hodin pred aplikaci.

### Castejsi kontroly

Doporucujeme navstevu kadernice kazde **4 tydny** (oproti 6-8 u bezneho prodlouzeni). Kratsi interval umozni kontrolovat stav vasich vlastnich vlasu.

## Pece o prodlouzene vlasy po chemoterapii

### Extra setrne pripravky

Pouzivejte sampony a kondicionery **bez sulfatu, parabenu a silikonu**. Citliva pokozka po lecbe vyzaduje maximalne jemne pripravky.

### Minimalni tepelna uprava

Sniztepoužití fehu a zehlicky na minimum. Pokud je pouzivate, nastavte teplotu maximalne na **150 °C** a vzdy s termoochrannym sprejem.

### Podpora rustu

Po konzultaci s lekarem zvaztesuplementy na podporu rustu vlasu:
- **Biotin** — podporuje produkci keratinu
- **Zinek** — dulezity pro zdravy rust vlasu
- **Zelizo** — casta deficit po lecbe

### Masaz pokozky hlavy

Jemna masaz pokozky hlavy (2-3 minuty denne) zlepsuje prokrveni a podporuje rust novych vlasu. Pouzijte jemne břísky prstu, nikdy nehty.

## Emocialni stranka — nejste v tom samy

Ztrata vlasu je pro mnoho zen jednim z nejnarocnejsich vedlejsich ucinku lecby. Je naprosto normalni citit smutek, frustraci nebo nejistotu.

### Kazda zena je jina

Nektere zeny se rozhodnou pro prodlouzeni hned, jak je to mozne. Jine preferuji kratky strich a uzivaji si novy zacatek. **Oboji je naprosto v poradku.** Dulezite je respektovat vlastni tempo a delat to, co vam dela dobře.

### Prodlouzeni jako jeden z nastroju

Prodlouzeni vlasu muze pomoci obnovit sebeduveru a pocit normality. Neni to marnivost — je to zpusob, jak se citit vice jako vy sama.

### Jsme tu pro vas

V Hairlandu pristupujeme k tomuto tematu s maximalni empatii. Pokud zvazujete prodlouzeni vlasu po chemoterapii, [napiste nam](/kontakt). Nabidneme vam:

- **Bezplatnou konzultaci** — poradime metodu, gramaz i barvu
- **Bez tlaku** — neni nase role vas presvedcovat; chceme vam pomoct najit to, co je spravne pro vas
- **Diskretnost** — vse probehne v soukromi

Muzete nam napsat na [WhatsApp](https://wa.me/420608553103) nebo zavolat na +420 608 553 103. Konzultace je vzdy zdarma.`;

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
  await prisma.blogPost.upsert({
    where: { slug: "prodlouzeni-vlasu-pro-jemne-vlasy" },
    update: {},
    create: {
      slug: "prodlouzeni-vlasu-pro-jemne-vlasy",
      title: "Prodlouzeni vlasu pro jemne vlasy — jak na to bezpecne",
      titleUk: "Нарощування волосся для тонкого волосся — як зробити безпечно",
      titleRu: "Наращивание волос для тонких волос — как сделать безопасно",
      excerpt: "Mate jemne vlasy a chcete je prodlouzit? Pruvodce nejsetrnejsimi metodami, spravnou gramazi a peci pro jemne vlasy.",
      excerptUk: "Маєте тонке волосся і хочете нарощування? Гід по найдбайливіших методах, правильній грамажі та догляду.",
      excerptRu: "У вас тонкие волосы и вы хотите наращивание? Гид по самым бережным методам, правильному граммажу и уходу.",
      content: article1ContentCs,
      contentUk: article1ContentUk,
      contentRu: article1ContentRu,
      category: "guide",
      metaTitle: "Prodloužení vlasů pro jemné vlasy | Hairland",
      metaDescription: "Mate jemne vlasy a chcete je prodlouzit? Pruvodce nejsetrnejsimi metodami, spravnou gramazi a peci. Tape-in a micro ring jsou idealni volba.",
      published: true,
      publishedAt: new Date(),
    },
  });

  // Article 2: Post-chemo
  await prisma.blogPost.upsert({
    where: { slug: "prodlouzeni-vlasu-po-chemoterapii" },
    update: {},
    create: {
      slug: "prodlouzeni-vlasu-po-chemoterapii",
      title: "Prodlouzeni vlasu po chemoterapii — kdy a jak zacit",
      titleUk: "Нарощування волосся після хіміотерапії — коли і як почати",
      titleRu: "Наращивание волос после химиотерапии — когда и как начать",
      excerpt: "Kdy zacit s prodlouzenim vlasu po chemoterapii? Bezpecne metody, minimalni delka vlastnich vlasu a setrny pristup k prodlouzeni.",
      excerptUk: "Коли починати нарощування волосся після хіміотерапії? Безпечні методи, мінімальна довжина власного волосся та дбайливий підхід.",
      excerptRu: "Когда начинать наращивание волос после химиотерапии? Безопасные методы, минимальная длина собственных волос и бережный подход.",
      content: article2ContentCs,
      contentUk: article2ContentUk,
      contentRu: article2ContentRu,
      category: "care",
      metaTitle: "Vlasy po chemoterapii — kdy začít | Hairland",
      metaDescription: "Kdy zacit s prodlouzenim vlasu po chemoterapii? Bezpecne metody, minimalni delka vlastnich vlasu a setrny pristup. Konzultace zdarma.",
      published: true,
      publishedAt: new Date(),
    },
  });

  console.log("2 blog articles created (published)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
