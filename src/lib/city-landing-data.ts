export interface CityData {
  slug: string;
  name: { cs: string; uk: string; ru: string };
  region: { cs: string; uk: string; ru: string };
  description: { cs: string; uk: string; ru: string };
  deliveryNote: { cs: string; uk: string; ru: string };
  consultNote: { cs: string; uk: string; ru: string };
  faq: Array<{
    q: { cs: string; uk: string; ru: string };
    a: { cs: string; uk: string; ru: string };
  }>;
  geo: { lat: number; lng: number };
}

export const CITIES: CityData[] = [
  {
    slug: "brno",
    name: { cs: "Brno", uk: "Брно", ru: "Брно" },
    region: { cs: "Jihomoravský kraj", uk: "Південноморавський край", ru: "Южноморавский край" },
    description: {
      cs: "Prémiové RAW vlasy k prodloužení s doručením do Brna do 2 pracovních dnů. Clip-in, tape-in, keratin, micro-ring. Osobní konzultace po domluvě.",
      uk: "Преміальне RAW волосся для нарощування з доставкою до Брна протягом 2 робочих днів. Clip-in, tape-in, кератин, micro-ring.",
      ru: "Премиальные RAW волосы для наращивания с доставкой в Брно в течение 2 рабочих дней. Clip-in, tape-in, кератин, micro-ring.",
    },
    deliveryNote: {
      cs: "Doručení do Brna do 2 pracovních dnů přes Zásilkovnu nebo Českou poštu. Osobní vyzvednutí vzorků v Praze.",
      uk: "Доставка до Брна протягом 2 робочих днів через Zásilkovna або Česká pošta. Особистий забір зразків у Празі.",
      ru: "Доставка в Брно в течение 2 рабочих дней через Zásilkovna или Česká pošta. Личный забор образцов в Праге.",
    },
    consultNote: {
      cs: "Online konzultace přes WhatsApp nebo Telegram. Osobní konzultace v Praze — po domluvě přivezeme vzorky.",
      uk: "Онлайн-консультація через WhatsApp або Telegram. Особиста консультація в Празі — за домовленістю привеземо зразки.",
      ru: "Онлайн-консультация через WhatsApp или Telegram. Личная консультация в Праге — по договорённости привезём образцы.",
    },
    faq: [
      {
        q: { cs: "Kolik stojí prodloužení vlasů v Brně?", uk: "Скільки коштує нарощування волосся в Брні?", ru: "Сколько стоит наращивание волос в Брно?" },
        a: { cs: "Cena závisí na typu vlasů, délce a gramáži. Ceny jsou stejné pro celou ČR — viz náš ceník. Pro 150 g vlasů (nejčastější volba) počítejte od několika tisíc korun.", uk: "Ціна залежить від типу волосся, довжини та грамажу. Ціни однакові для всієї ЧР — дивіться наш прайс-лист.", ru: "Цена зависит от типа волос, длины и граммажа. Цены одинаковы для всей ЧР — смотрите наш прайс-лист." },
      },
      {
        q: { cs: "Jak dlouho trvá doručení do Brna?", uk: "Скільки часу займає доставка до Брна?", ru: "Сколько времени занимает доставка в Брно?" },
        a: { cs: "Vlasy skladem odesíláme do 24 hodin. Doručení do Brna obvykle trvá 1–2 pracovní dny přes Zásilkovnu nebo Českou poštu.", uk: "Волосся зі складу відправляємо протягом 24 годин. Доставка до Брна зазвичай займає 1–2 робочі дні.", ru: "Волосы со склада отправляем в течение 24 часов. Доставка в Брно обычно занимает 1–2 рабочих дня." },
      },
      {
        q: { cs: "Mohu si vlasy vyzkoušet osobně v Brně?", uk: "Чи можу я особисто оглянути волосся в Брні?", ru: "Могу ли я лично посмотреть волосы в Брно?" },
        a: { cs: "Osobní konzultace probíhá v naší kanceláři v Praze. Pro Brno nabízíme online konzultaci přes WhatsApp — pošlete fotku v denním světle a doporučíme správný odstín a gramáž.", uk: "Особиста консультація проходить у нашому офісі в Празі. Для Брна пропонуємо онлайн-консультацію через WhatsApp.", ru: "Личная консультация проходит в нашем офисе в Праге. Для Брно предлагаем онлайн-консультацию через WhatsApp." },
      },
      {
        q: { cs: "Jaké metody prodloužení vlasů nabízíte?", uk: "Які методи нарощування волосся ви пропонуєте?", ru: "Какие методы наращивания волос вы предлагаете?" },
        a: { cs: "Nabízíme clip-in, tape-in, keratin, micro-ring, tresy a clip-in ofiny. Každá metoda je vhodná pro jiný typ vlasů a životní styl.", uk: "Пропонуємо clip-in, tape-in, кератин, micro-ring, треси та clip-in чубчики. Кожен метод підходить для різного типу волосся.", ru: "Предлагаем clip-in, tape-in, кератин, micro-ring, трессы и clip-in чёлки. Каждый метод подходит для разного типа волос." },
      },
      {
        q: { cs: "Jsou vaše vlasy skutečně 100% pravé?", uk: "Чи ваше волосся дійсно 100% натуральне?", ru: "Ваши волосы действительно 100% натуральные?" },
        a: { cs: "Ano, prodáváme výhradně 100% pravé RAW lidské vlasy. Žádné syntetické příměsi, žádné silikonové povlaky. Každý svazek je od jedné dárkyně.", uk: "Так, ми продаємо виключно 100% натуральне RAW людське волосся. Жодних синтетичних домішок, жодних силіконових покриттів.", ru: "Да, мы продаём исключительно 100% натуральные RAW человеческие волосы. Никаких синтетических примесей, никаких силиконовых покрытий." },
      },
      {
        q: { cs: "Jak probíhá objednávka online?", uk: "Як проходить онлайн-замовлення?", ru: "Как проходит онлайн-заказ?" },
        a: { cs: "Vyberte vlasy v e-shopu, zvolte délku a gramáž, přidejte do košíku a dokončete objednávku. Platba kartou, převodem nebo dobírkou. Odeslání do 24 hodin.", uk: "Виберіть волосся в e-shop, оберіть довжину та грамаж, додайте в кошик і завершіть замовлення. Оплата карткою, переказом або накладеним платежем.", ru: "Выберите волосы в интернет-магазине, укажите длину и граммаж, добавьте в корзину и оформите заказ. Оплата картой, переводом или наложенным платежом." },
      },
    ],
    geo: { lat: 49.1951, lng: 16.6068 },
  },
  {
    slug: "ostrava",
    name: { cs: "Ostrava", uk: "Острава", ru: "Острава" },
    region: { cs: "Moravskoslezský kraj", uk: "Моравськосілезький край", ru: "Моравскосилезский край" },
    description: {
      cs: "Prémiové RAW vlasy k prodloužení s doručením do Ostravy do 2 pracovních dnů. Clip-in, tape-in, keratin, micro-ring.",
      uk: "Преміальне RAW волосся для нарощування з доставкою до Острави протягом 2 робочих днів.",
      ru: "Премиальные RAW волосы для наращивания с доставкой в Остраву в течение 2 рабочих дней.",
    },
    deliveryNote: {
      cs: "Doručení do Ostravy do 2 pracovních dnů přes Zásilkovnu nebo Českou poštu.",
      uk: "Доставка до Острави протягом 2 робочих днів через Zásilkovna або Česká pošta.",
      ru: "Доставка в Остраву в течение 2 рабочих дней через Zásilkovna или Česká pošta.",
    },
    consultNote: {
      cs: "Online konzultace přes WhatsApp nebo Telegram. Osobní konzultace v Praze.",
      uk: "Онлайн-консультація через WhatsApp або Telegram. Особиста консультація в Празі.",
      ru: "Онлайн-консультация через WhatsApp или Telegram. Личная консультация в Праге.",
    },
    faq: [
      {
        q: { cs: "Kolik stojí prodloužení vlasů v Ostravě?", uk: "Скільки коштує нарощування волосся в Остраві?", ru: "Сколько стоит наращивание волос в Остраве?" },
        a: { cs: "Cena závisí na typu vlasů, délce a gramáži. Ceny jsou stejné pro celou ČR — viz náš ceník.", uk: "Ціна залежить від типу волосся, довжини та грамажу. Ціни однакові для всієї ЧР — дивіться наш прайс-лист.", ru: "Цена зависит от типа волос, длины и граммажа. Цены одинаковы для всей ЧР — смотрите наш прайс-лист." },
      },
      {
        q: { cs: "Jak dlouho trvá doručení do Ostravy?", uk: "Скільки часу займає доставка до Острави?", ru: "Сколько времени занимает доставка в Остраву?" },
        a: { cs: "Vlasy skladem odesíláme do 24 hodin. Doručení do Ostravy obvykle trvá 1–2 pracovní dny.", uk: "Волосся зі складу відправляємо протягом 24 годин. Доставка до Острави зазвичай займає 1–2 робочі дні.", ru: "Волосы со склада отправляем в течение 24 часов. Доставка в Остраву обычно занимает 1–2 рабочих дня." },
      },
      {
        q: { cs: "Mohu si vlasy vyzkoušet osobně v Ostravě?", uk: "Чи можу я особисто оглянути волосся в Остраві?", ru: "Могу ли я лично посмотреть волосы в Остраве?" },
        a: { cs: "Osobní konzultace probíhá v Praze. Pro Ostravu nabízíme online konzultaci přes WhatsApp — pošlete fotku a doporučíme správný odstín.", uk: "Особиста консультація проходить у Празі. Для Острави пропонуємо онлайн-консультацію через WhatsApp.", ru: "Личная консультация проходит в Праге. Для Остравы предлагаем онлайн-консультацию через WhatsApp." },
      },
      {
        q: { cs: "Jaké metody prodloužení vlasů nabízíte?", uk: "Які методи нарощування волосся ви пропонуєте?", ru: "Какие методы наращивания волос вы предлагаете?" },
        a: { cs: "Nabízíme clip-in, tape-in, keratin, micro-ring, tresy a clip-in ofiny. Každá metoda je vhodná pro jiný typ vlasů.", uk: "Пропонуємо clip-in, tape-in, кератин, micro-ring, треси та clip-in чубчики.", ru: "Предлагаем clip-in, tape-in, кератин, micro-ring, трессы и clip-in чёлки." },
      },
      {
        q: { cs: "Jsou vaše vlasy skutečně 100% pravé?", uk: "Чи ваше волосся дійсно 100% натуральне?", ru: "Ваши волосы действительно 100% натуральные?" },
        a: { cs: "Ano, prodáváme výhradně 100% pravé RAW lidské vlasy bez syntetických příměsí.", uk: "Так, ми продаємо виключно 100% натуральне RAW людське волосся без синтетичних домішок.", ru: "Да, мы продаём исключительно 100% натуральные RAW человеческие волосы без синтетических примесей." },
      },
      {
        q: { cs: "Jak probíhá objednávka online?", uk: "Як проходить онлайн-замовлення?", ru: "Как проходит онлайн-заказ?" },
        a: { cs: "Vyberte vlasy v e-shopu, zvolte délku a gramáž, přidejte do košíku a dokončete objednávku. Odeslání do 24 hodin.", uk: "Виберіть волосся в e-shop, оберіть довжину та грамаж, додайте в кошик і завершіть замовлення. Відправка протягом 24 годин.", ru: "Выберите волосы в интернет-магазине, укажите длину и граммаж, добавьте в корзину. Отправка в течение 24 часов." },
      },
    ],
    geo: { lat: 49.8209, lng: 18.2625 },
  },
  {
    slug: "plzen",
    name: { cs: "Plzeň", uk: "Пльзень", ru: "Пльзень" },
    region: { cs: "Plzeňský kraj", uk: "Пльзенський край", ru: "Пльзенский край" },
    description: {
      cs: "Prémiové RAW vlasy k prodloužení s doručením do Plzně do 1–2 pracovních dnů.",
      uk: "Преміальне RAW волосся для нарощування з доставкою до Пльзня протягом 1–2 робочих днів.",
      ru: "Премиальные RAW волосы для наращивания с доставкой в Пльзень в течение 1–2 рабочих дней.",
    },
    deliveryNote: {
      cs: "Doručení do Plzně do 1–2 pracovních dnů přes Zásilkovnu nebo Českou poštu.",
      uk: "Доставка до Пльзня протягом 1–2 робочих днів.",
      ru: "Доставка в Пльзень в течение 1–2 рабочих дней.",
    },
    consultNote: {
      cs: "Online konzultace přes WhatsApp nebo Telegram. Osobní konzultace v Praze — Plzeň je blízko.",
      uk: "Онлайн-консультація через WhatsApp або Telegram. Особиста консультація в Празі — Пльзень поруч.",
      ru: "Онлайн-консультация через WhatsApp или Telegram. Личная консультация в Праге — Пльзень рядом.",
    },
    faq: [
      {
        q: { cs: "Kolik stojí prodloužení vlasů v Plzni?", uk: "Скільки коштує нарощування волосся в Пльзні?", ru: "Сколько стоит наращивание волос в Пльзени?" },
        a: { cs: "Cena závisí na typu vlasů, délce a gramáži. Ceny jsou stejné pro celou ČR — viz náš ceník.", uk: "Ціна залежить від типу волосся, довжини та грамажу. Ціни однакові для всієї ЧР.", ru: "Цена зависит от типа волос, длины и граммажа. Цены одинаковы для всей ЧР." },
      },
      {
        q: { cs: "Jak dlouho trvá doručení do Plzně?", uk: "Скільки часу займає доставка до Пльзня?", ru: "Сколько времени занимает доставка в Пльзень?" },
        a: { cs: "Vlasy skladem odesíláme do 24 hodin. Doručení do Plzně obvykle trvá 1–2 pracovní dny.", uk: "Волосся зі складу відправляємо протягом 24 годин. Доставка до Пльзня — 1–2 робочі дні.", ru: "Волосы со склада отправляем в течение 24 часов. Доставка в Пльзень — 1–2 рабочих дня." },
      },
      {
        q: { cs: "Mohu si vlasy vyzkoušet osobně v Plzni?", uk: "Чи можу я оглянути волосся особисто в Пльзні?", ru: "Могу ли я лично посмотреть волосы в Пльзени?" },
        a: { cs: "Osobní konzultace probíhá v Praze. Plzeň je jen hodinu cesty — rádi vás přivítáme. Pro vzdálenou konzultaci využijte WhatsApp.", uk: "Особиста консультація проходить у Празі. Пльзень лише годину їзди. Для дистанційної консультації використовуйте WhatsApp.", ru: "Личная консультация проходит в Праге. Пльзень всего час езды. Для удалённой консультации используйте WhatsApp." },
      },
      {
        q: { cs: "Jaké metody prodloužení vlasů nabízíte?", uk: "Які методи нарощування волосся ви пропонуєте?", ru: "Какие методы наращивания волос вы предлагаете?" },
        a: { cs: "Clip-in, tape-in, keratin, micro-ring, tresy a clip-in ofiny.", uk: "Clip-in, tape-in, кератин, micro-ring, треси та clip-in чубчики.", ru: "Clip-in, tape-in, кератин, micro-ring, трессы и clip-in чёлки." },
      },
      {
        q: { cs: "Jsou vaše vlasy skutečně 100% pravé?", uk: "Чи ваше волосся дійсно 100% натуральне?", ru: "Ваши волосы действительно 100% натуральные?" },
        a: { cs: "Ano, prodáváme výhradně 100% pravé RAW lidské vlasy bez syntetických příměsí.", uk: "Так, виключно 100% натуральне RAW людське волосся без синтетичних домішок.", ru: "Да, исключительно 100% натуральные RAW человеческие волосы без синтетических примесей." },
      },
      {
        q: { cs: "Jak probíhá objednávka online?", uk: "Як проходить онлайн-замовлення?", ru: "Как проходит онлайн-заказ?" },
        a: { cs: "Vyberte vlasy v e-shopu, zvolte délku a gramáž, přidejte do košíku a dokončete objednávku.", uk: "Виберіть волосся в e-shop, оберіть довжину та грамаж, додайте в кошик і завершіть замовлення.", ru: "Выберите волосы в интернет-магазине, укажите длину и граммаж, добавьте в корзину и оформите заказ." },
      },
    ],
    geo: { lat: 49.7384, lng: 13.3736 },
  },
  {
    slug: "liberec",
    name: { cs: "Liberec", uk: "Ліберець", ru: "Либерец" },
    region: { cs: "Liberecký kraj", uk: "Ліберецький край", ru: "Либерецкий край" },
    description: {
      cs: "Prémiové RAW vlasy k prodloužení s doručením do Liberce do 1–2 pracovních dnů.",
      uk: "Преміальне RAW волосся для нарощування з доставкою до Лібереця протягом 1–2 робочих днів.",
      ru: "Премиальные RAW волосы для наращивания с доставкой в Либерец в течение 1–2 рабочих дней.",
    },
    deliveryNote: {
      cs: "Doručení do Liberce do 1–2 pracovních dnů přes Zásilkovnu nebo Českou poštu.",
      uk: "Доставка до Лібереця протягом 1–2 робочих днів.",
      ru: "Доставка в Либерец в течение 1–2 рабочих дней.",
    },
    consultNote: {
      cs: "Online konzultace přes WhatsApp nebo Telegram. Osobní konzultace v Praze.",
      uk: "Онлайн-консультація через WhatsApp або Telegram. Особиста консультація в Празі.",
      ru: "Онлайн-консультация через WhatsApp или Telegram. Личная консультация в Праге.",
    },
    faq: [
      {
        q: { cs: "Kolik stojí prodloužení vlasů v Liberci?", uk: "Скільки коштує нарощування волосся в Ліберці?", ru: "Сколько стоит наращивание волос в Либерце?" },
        a: { cs: "Cena závisí na typu vlasů, délce a gramáži. Ceny jsou stejné pro celou ČR.", uk: "Ціна залежить від типу волосся, довжини та грамажу. Ціни однакові для всієї ЧР.", ru: "Цена зависит от типа волос, длины и граммажа. Цены одинаковы для всей ЧР." },
      },
      {
        q: { cs: "Jak dlouho trvá doručení do Liberce?", uk: "Скільки часу займає доставка до Лібереця?", ru: "Сколько времени занимает доставка в Либерец?" },
        a: { cs: "Doručení do Liberce obvykle trvá 1–2 pracovní dny.", uk: "Доставка до Лібереця зазвичай займає 1–2 робочі дні.", ru: "Доставка в Либерец обычно занимает 1–2 рабочих дня." },
      },
      {
        q: { cs: "Mohu si vlasy vyzkoušet osobně v Liberci?", uk: "Чи можу я оглянути волосся в Ліберці?", ru: "Могу ли я посмотреть волосы в Либерце?" },
        a: { cs: "Osobní konzultace probíhá v Praze. Pro Liberec nabízíme online konzultaci přes WhatsApp.", uk: "Особиста консультація в Празі. Для Лібереця пропонуємо онлайн-консультацію через WhatsApp.", ru: "Личная консультация в Праге. Для Либерца предлагаем онлайн-консультацию через WhatsApp." },
      },
      {
        q: { cs: "Jaké metody prodloužení vlasů nabízíte?", uk: "Які методи нарощування ви пропонуєте?", ru: "Какие методы наращивания вы предлагаете?" },
        a: { cs: "Clip-in, tape-in, keratin, micro-ring, tresy a clip-in ofiny.", uk: "Clip-in, tape-in, кератин, micro-ring, треси та clip-in чубчики.", ru: "Clip-in, tape-in, кератин, micro-ring, трессы и clip-in чёлки." },
      },
      {
        q: { cs: "Jsou vaše vlasy skutečně 100% pravé?", uk: "Чи ваше волосся дійсно 100% натуральне?", ru: "Ваши волосы действительно 100% натуральные?" },
        a: { cs: "Ano, výhradně 100% pravé RAW lidské vlasy bez syntetických příměsí.", uk: "Так, виключно 100% натуральне RAW людське волосся.", ru: "Да, исключительно 100% натуральные RAW человеческие волосы." },
      },
      {
        q: { cs: "Jak probíhá objednávka online?", uk: "Як проходить онлайн-замовлення?", ru: "Как проходит онлайн-заказ?" },
        a: { cs: "Vyberte vlasy v e-shopu, zvolte délku a gramáž, přidejte do košíku a dokončete objednávku.", uk: "Виберіть волосся, оберіть довжину та грамаж, додайте в кошик і завершіть замовлення.", ru: "Выберите волосы, укажите длину и граммаж, добавьте в корзину и оформите заказ." },
      },
    ],
    geo: { lat: 50.7663, lng: 15.0543 },
  },
  {
    slug: "olomouc",
    name: { cs: "Olomouc", uk: "Оломоуц", ru: "Оломоуц" },
    region: { cs: "Olomoucký kraj", uk: "Оломоуцький край", ru: "Оломоуцкий край" },
    description: {
      cs: "Prémiové RAW vlasy k prodloužení s doručením do Olomouce do 2 pracovních dnů.",
      uk: "Преміальне RAW волосся для нарощування з доставкою до Оломоуця протягом 2 робочих днів.",
      ru: "Премиальные RAW волосы для наращивания с доставкой в Оломоуц в течение 2 рабочих дней.",
    },
    deliveryNote: {
      cs: "Doručení do Olomouce do 2 pracovních dnů přes Zásilkovnu nebo Českou poštu.",
      uk: "Доставка до Оломоуця протягом 2 робочих днів.",
      ru: "Доставка в Оломоуц в течение 2 рабочих дней.",
    },
    consultNote: {
      cs: "Online konzultace přes WhatsApp nebo Telegram. Osobní konzultace v Praze.",
      uk: "Онлайн-консультація через WhatsApp або Telegram. Особиста консультація в Празі.",
      ru: "Онлайн-консультация через WhatsApp или Telegram. Личная консультация в Праге.",
    },
    faq: [
      {
        q: { cs: "Kolik stojí prodloužení vlasů v Olomouci?", uk: "Скільки коштує нарощування волосся в Оломоуці?", ru: "Сколько стоит наращивание волос в Оломоуце?" },
        a: { cs: "Cena závisí na typu vlasů, délce a gramáži. Ceny jsou stejné pro celou ČR.", uk: "Ціна залежить від типу волосся, довжини та грамажу. Ціни однакові для всієї ЧР.", ru: "Цена зависит от типа волос, длины и граммажа. Цены одинаковы для всей ЧР." },
      },
      {
        q: { cs: "Jak dlouho trvá doručení do Olomouce?", uk: "Скільки часу займає доставка до Оломоуця?", ru: "Сколько времени занимает доставка в Оломоуц?" },
        a: { cs: "Doručení do Olomouce obvykle trvá 1–2 pracovní dny.", uk: "Доставка до Оломоуця зазвичай займає 1–2 робочі дні.", ru: "Доставка в Оломоуц обычно занимает 1–2 рабочих дня." },
      },
      {
        q: { cs: "Mohu si vlasy vyzkoušet osobně v Olomouci?", uk: "Чи можу я оглянути волосся в Оломоуці?", ru: "Могу ли я посмотреть волосы в Оломоуце?" },
        a: { cs: "Osobní konzultace probíhá v Praze. Pro Olomouc nabízíme online konzultaci přes WhatsApp.", uk: "Особиста консультація в Празі. Для Оломоуця пропонуємо онлайн-консультацію через WhatsApp.", ru: "Личная консультация в Праге. Для Оломоуца предлагаем онлайн-консультацию через WhatsApp." },
      },
      {
        q: { cs: "Jaké metody prodloužení vlasů nabízíte?", uk: "Які методи нарощування ви пропонуєте?", ru: "Какие методы наращивания вы предлагаете?" },
        a: { cs: "Clip-in, tape-in, keratin, micro-ring, tresy a clip-in ofiny.", uk: "Clip-in, tape-in, кератин, micro-ring, треси та clip-in чубчики.", ru: "Clip-in, tape-in, кератин, micro-ring, трессы и clip-in чёлки." },
      },
      {
        q: { cs: "Jsou vaše vlasy skutečně 100% pravé?", uk: "Чи ваше волосся дійсно 100% натуральне?", ru: "Ваши волосы действительно 100% натуральные?" },
        a: { cs: "Ano, výhradně 100% pravé RAW lidské vlasy.", uk: "Так, виключно 100% натуральне RAW людське волосся.", ru: "Да, исключительно 100% натуральные RAW человеческие волосы." },
      },
      {
        q: { cs: "Jak probíhá objednávka online?", uk: "Як проходить онлайн-замовлення?", ru: "Как проходит онлайн-заказ?" },
        a: { cs: "Vyberte vlasy v e-shopu, zvolte délku a gramáž, přidejte do košíku a dokončete objednávku.", uk: "Виберіть волосся, оберіть довжину та грамаж, додайте в кошик і завершіть замовлення.", ru: "Выберите волосы, укажите длину и граммаж, добавьте в корзину и оформите заказ." },
      },
    ],
    geo: { lat: 49.5938, lng: 17.2509 },
  },
  {
    slug: "ceske-budejovice",
    name: { cs: "České Budějovice", uk: "Чеські Будейовіце", ru: "Ческе-Будеёвице" },
    region: { cs: "Jihočeský kraj", uk: "Південночеський край", ru: "Южночешский край" },
    description: {
      cs: "Prémiové RAW vlasy k prodloužení s doručením do Českých Budějovic do 1–2 pracovních dnů.",
      uk: "Преміальне RAW волосся для нарощування з доставкою до Чеських Будейовіц протягом 1–2 робочих днів.",
      ru: "Премиальные RAW волосы для наращивания с доставкой в Ческе-Будеёвице в течение 1–2 рабочих дней.",
    },
    deliveryNote: {
      cs: "Doručení do Českých Budějovic do 1–2 pracovních dnů.",
      uk: "Доставка до Чеських Будейовіц протягом 1–2 робочих днів.",
      ru: "Доставка в Ческе-Будеёвице в течение 1–2 рабочих дней.",
    },
    consultNote: {
      cs: "Online konzultace přes WhatsApp nebo Telegram. Osobní konzultace v Praze.",
      uk: "Онлайн-консультація через WhatsApp або Telegram. Особиста консультація в Празі.",
      ru: "Онлайн-консультация через WhatsApp или Telegram. Личная консультация в Праге.",
    },
    faq: [
      {
        q: { cs: "Kolik stojí prodloužení vlasů v Českých Budějovicích?", uk: "Скільки коштує нарощування волосся в Чеських Будейовіцях?", ru: "Сколько стоит наращивание волос в Ческе-Будеёвице?" },
        a: { cs: "Cena závisí na typu vlasů, délce a gramáži. Ceny jsou stejné pro celou ČR.", uk: "Ціна залежить від типу волосся, довжини та грамажу. Ціни однакові для всієї ЧР.", ru: "Цена зависит от типа волос, длины и граммажа. Цены одинаковы для всей ЧР." },
      },
      {
        q: { cs: "Jak dlouho trvá doručení do Českých Budějovic?", uk: "Скільки часу займає доставка до Чеських Будейовіц?", ru: "Сколько времени занимает доставка в Ческе-Будеёвице?" },
        a: { cs: "Doručení obvykle trvá 1–2 pracovní dny.", uk: "Доставка зазвичай займає 1–2 робочі дні.", ru: "Доставка обычно занимает 1–2 рабочих дня." },
      },
      {
        q: { cs: "Mohu si vlasy vyzkoušet osobně?", uk: "Чи можу я оглянути волосся особисто?", ru: "Могу ли я лично посмотреть волосы?" },
        a: { cs: "Osobní konzultace probíhá v Praze. Pro vzdálená města nabízíme online konzultaci přes WhatsApp.", uk: "Особиста консультація в Празі. Для віддалених міст пропонуємо онлайн-консультацію через WhatsApp.", ru: "Личная консультация в Праге. Для удалённых городов предлагаем онлайн-консультацию через WhatsApp." },
      },
      {
        q: { cs: "Jaké metody prodloužení nabízíte?", uk: "Які методи нарощування ви пропонуєте?", ru: "Какие методы наращивания вы предлагаете?" },
        a: { cs: "Clip-in, tape-in, keratin, micro-ring, tresy a clip-in ofiny.", uk: "Clip-in, tape-in, кератин, micro-ring, треси та clip-in чубчики.", ru: "Clip-in, tape-in, кератин, micro-ring, трессы и clip-in чёлки." },
      },
      {
        q: { cs: "Jsou vaše vlasy 100% pravé?", uk: "Чи ваше волосся 100% натуральне?", ru: "Ваши волосы 100% натуральные?" },
        a: { cs: "Ano, výhradně 100% pravé RAW lidské vlasy.", uk: "Так, виключно 100% натуральне RAW людське волосся.", ru: "Да, исключительно 100% натуральные RAW человеческие волосы." },
      },
      {
        q: { cs: "Jak objednat online?", uk: "Як замовити онлайн?", ru: "Как заказать онлайн?" },
        a: { cs: "Vyberte vlasy v e-shopu, zvolte délku a gramáž, přidejte do košíku a dokončete objednávku.", uk: "Виберіть волосся, оберіть довжину та грамаж, додайте в кошик і завершіть замовлення.", ru: "Выберите волосы, укажите длину и граммаж, добавьте в корзину и оформите заказ." },
      },
    ],
    geo: { lat: 48.9745, lng: 14.4743 },
  },
  {
    slug: "hradec-kralove",
    name: { cs: "Hradec Králové", uk: "Градець Кралове", ru: "Градец-Кралове" },
    region: { cs: "Královéhradecký kraj", uk: "Краловоградецький край", ru: "Краловеградецкий край" },
    description: {
      cs: "Prémiové RAW vlasy k prodloužení s doručením do Hradce Králové do 1–2 pracovních dnů.",
      uk: "Преміальне RAW волосся для нарощування з доставкою до Градця Кралове протягом 1–2 робочих днів.",
      ru: "Премиальные RAW волосы для наращивания с доставкой в Градец-Кралове в течение 1–2 рабочих дней.",
    },
    deliveryNote: {
      cs: "Doručení do Hradce Králové do 1–2 pracovních dnů.",
      uk: "Доставка до Градця Кралове протягом 1–2 робочих днів.",
      ru: "Доставка в Градец-Кралове в течение 1–2 рабочих дней.",
    },
    consultNote: {
      cs: "Online konzultace přes WhatsApp nebo Telegram. Osobní konzultace v Praze.",
      uk: "Онлайн-консультація через WhatsApp або Telegram. Особиста консультація в Празі.",
      ru: "Онлайн-консультация через WhatsApp или Telegram. Личная консультация в Праге.",
    },
    faq: [
      {
        q: { cs: "Kolik stojí prodloužení vlasů v Hradci Králové?", uk: "Скільки коштує нарощування в Градці Кралове?", ru: "Сколько стоит наращивание в Градец-Кралове?" },
        a: { cs: "Cena závisí na typu vlasů, délce a gramáži. Ceny jsou stejné pro celou ČR.", uk: "Ціна залежить від типу волосся. Ціни однакові для всієї ЧР.", ru: "Цена зависит от типа волос. Цены одинаковы для всей ЧР." },
      },
      {
        q: { cs: "Jak dlouho trvá doručení do Hradce Králové?", uk: "Скільки часу займає доставка до Градця Кралове?", ru: "Сколько времени занимает доставка в Градец-Кралове?" },
        a: { cs: "Doručení obvykle trvá 1–2 pracovní dny.", uk: "Доставка зазвичай займає 1–2 робочі дні.", ru: "Доставка обычно занимает 1–2 рабочих дня." },
      },
      {
        q: { cs: "Mohu si vlasy vyzkoušet osobně?", uk: "Чи можу я оглянути волосся особисто?", ru: "Могу ли я лично посмотреть волосы?" },
        a: { cs: "Osobní konzultace v Praze. Online konzultace přes WhatsApp.", uk: "Особиста консультація в Празі. Онлайн через WhatsApp.", ru: "Личная консультация в Праге. Онлайн через WhatsApp." },
      },
      {
        q: { cs: "Jaké metody prodloužení nabízíte?", uk: "Які методи нарощування ви пропонуєте?", ru: "Какие методы наращивания вы предлагаете?" },
        a: { cs: "Clip-in, tape-in, keratin, micro-ring, tresy a clip-in ofiny.", uk: "Clip-in, tape-in, кератин, micro-ring, треси та clip-in чубчики.", ru: "Clip-in, tape-in, кератин, micro-ring, трессы и clip-in чёлки." },
      },
      {
        q: { cs: "Jsou vaše vlasy 100% pravé?", uk: "Чи ваше волосся 100% натуральне?", ru: "Ваши волосы 100% натуральные?" },
        a: { cs: "Ano, výhradně 100% pravé RAW lidské vlasy.", uk: "Так, виключно 100% натуральне RAW волосся.", ru: "Да, исключительно 100% натуральные RAW волосы." },
      },
      {
        q: { cs: "Jak objednat online?", uk: "Як замовити онлайн?", ru: "Как заказать онлайн?" },
        a: { cs: "Vyberte vlasy v e-shopu, zvolte délku a gramáž, přidejte do košíku.", uk: "Виберіть волосся, оберіть довжину та грамаж, додайте в кошик.", ru: "Выберите волосы, укажите длину и граммаж, добавьте в корзину." },
      },
    ],
    geo: { lat: 50.2092, lng: 15.8328 },
  },
  {
    slug: "pardubice",
    name: { cs: "Pardubice", uk: "Пардубіце", ru: "Пардубице" },
    region: { cs: "Pardubický kraj", uk: "Пардубіцький край", ru: "Пардубицкий край" },
    description: {
      cs: "Prémiové RAW vlasy k prodloužení s doručením do Pardubic do 1–2 pracovních dnů.",
      uk: "Преміальне RAW волосся для нарощування з доставкою до Пардубіц протягом 1–2 робочих днів.",
      ru: "Премиальные RAW волосы для наращивания с доставкой в Пардубице в течение 1–2 рабочих дней.",
    },
    deliveryNote: { cs: "Doručení do Pardubic do 1–2 pracovních dnů.", uk: "Доставка до Пардубіц протягом 1–2 робочих днів.", ru: "Доставка в Пардубице в течение 1–2 рабочих дней." },
    consultNote: { cs: "Online konzultace přes WhatsApp nebo Telegram. Osobní konzultace v Praze.", uk: "Онлайн-консультація через WhatsApp або Telegram. Особиста консультація в Празі.", ru: "Онлайн-консультация через WhatsApp или Telegram. Личная консультация в Праге." },
    faq: [
      { q: { cs: "Kolik stojí prodloužení vlasů v Pardubicích?", uk: "Скільки коштує нарощування в Пардубіцях?", ru: "Сколько стоит наращивание в Пардубице?" }, a: { cs: "Cena závisí na typu vlasů, délce a gramáži. Ceny jsou stejné pro celou ČR.", uk: "Ціна залежить від типу волосся. Ціни однакові для всієї ЧР.", ru: "Цена зависит от типа волос. Цены одинаковы для всей ЧР." } },
      { q: { cs: "Jak dlouho trvá doručení do Pardubic?", uk: "Скільки часу займає доставка до Пардубіц?", ru: "Сколько времени занимает доставка в Пардубице?" }, a: { cs: "Doručení obvykle trvá 1–2 pracovní dny.", uk: "Доставка зазвичай займає 1–2 робочі дні.", ru: "Доставка обычно занимает 1–2 рабочих дня." } },
      { q: { cs: "Mohu si vlasy vyzkoušet osobně?", uk: "Чи можу я оглянути волосся особисто?", ru: "Могу ли я лично посмотреть волосы?" }, a: { cs: "Osobní konzultace v Praze. Online přes WhatsApp.", uk: "Особиста консультація в Празі. Онлайн через WhatsApp.", ru: "Личная консультация в Праге. Онлайн через WhatsApp." } },
      { q: { cs: "Jaké metody prodloužení nabízíte?", uk: "Які методи нарощування ви пропонуєте?", ru: "Какие методы наращивания вы предлагаете?" }, a: { cs: "Clip-in, tape-in, keratin, micro-ring, tresy a ofiny.", uk: "Clip-in, tape-in, кератин, micro-ring, треси та чубчики.", ru: "Clip-in, tape-in, кератин, micro-ring, трессы и чёлки." } },
      { q: { cs: "Jsou vaše vlasy 100% pravé?", uk: "Чи ваше волосся 100% натуральне?", ru: "Ваши волосы 100% натуральные?" }, a: { cs: "Ano, výhradně 100% pravé RAW lidské vlasy.", uk: "Так, виключно 100% натуральне RAW волосся.", ru: "Да, исключительно 100% натуральные RAW волосы." } },
      { q: { cs: "Jak objednat online?", uk: "Як замовити онлайн?", ru: "Как заказать онлайн?" }, a: { cs: "Vyberte vlasy v e-shopu, zvolte délku a gramáž, přidejte do košíku.", uk: "Виберіть волосся, оберіть довжину та грамаж, додайте в кошик.", ru: "Выберите волосы, укажите длину и граммаж, добавьте в корзину." } },
    ],
    geo: { lat: 50.0343, lng: 15.7812 },
  },
  {
    slug: "zlin",
    name: { cs: "Zlín", uk: "Злін", ru: "Злин" },
    region: { cs: "Zlínský kraj", uk: "Злінський край", ru: "Злинский край" },
    description: { cs: "Prémiové RAW vlasy k prodloužení s doručením do Zlína do 2 pracovních dnů.", uk: "Преміальне RAW волосся з доставкою до Зліна протягом 2 робочих днів.", ru: "Премиальные RAW волосы с доставкой в Злин в течение 2 рабочих дней." },
    deliveryNote: { cs: "Doručení do Zlína do 2 pracovních dnů.", uk: "Доставка до Зліна протягом 2 робочих днів.", ru: "Доставка в Злин в течение 2 рабочих дней." },
    consultNote: { cs: "Online konzultace přes WhatsApp nebo Telegram.", uk: "Онлайн-консультація через WhatsApp або Telegram.", ru: "Онлайн-консультация через WhatsApp или Telegram." },
    faq: [
      { q: { cs: "Kolik stojí prodloužení vlasů ve Zlíně?", uk: "Скільки коштує нарощування в Зліні?", ru: "Сколько стоит наращивание в Злине?" }, a: { cs: "Cena závisí na typu vlasů, délce a gramáži. Ceny jsou stejné pro celou ČR.", uk: "Ціна залежить від типу волосся. Ціни однакові для всієї ЧР.", ru: "Цена зависит от типа волос. Цены одинаковы для всей ЧР." } },
      { q: { cs: "Jak dlouho trvá doručení do Zlína?", uk: "Скільки часу займає доставка до Зліна?", ru: "Сколько времени занимает доставка в Злин?" }, a: { cs: "Doručení obvykle trvá 1–2 pracovní dny.", uk: "Доставка зазвичай займає 1–2 робочі дні.", ru: "Доставка обычно занимает 1–2 рабочих дня." } },
      { q: { cs: "Mohu si vlasy vyzkoušet osobně?", uk: "Чи можу я оглянути волосся?", ru: "Могу ли я посмотреть волосы?" }, a: { cs: "Osobní konzultace v Praze. Online přes WhatsApp.", uk: "Особиста консультація в Празі. Онлайн через WhatsApp.", ru: "Личная консультация в Праге. Онлайн через WhatsApp." } },
      { q: { cs: "Jaké metody prodloužení nabízíte?", uk: "Які методи нарощування ви пропонуєте?", ru: "Какие методы наращивания вы предлагаете?" }, a: { cs: "Clip-in, tape-in, keratin, micro-ring, tresy a ofiny.", uk: "Clip-in, tape-in, кератин, micro-ring, треси та чубчики.", ru: "Clip-in, tape-in, кератин, micro-ring, трессы и чёлки." } },
      { q: { cs: "Jsou vaše vlasy 100% pravé?", uk: "Чи ваше волосся 100% натуральне?", ru: "Ваши волосы 100% натуральные?" }, a: { cs: "Ano, výhradně 100% pravé RAW lidské vlasy.", uk: "Так, виключно 100% натуральне RAW волосся.", ru: "Да, исключительно 100% натуральные RAW волосы." } },
      { q: { cs: "Jak objednat online?", uk: "Як замовити онлайн?", ru: "Как заказать онлайн?" }, a: { cs: "Vyberte vlasy v e-shopu, zvolte délku a gramáž, přidejte do košíku.", uk: "Виберіть волосся, оберіть довжину та грамаж, додайте в кошик.", ru: "Выберите волосы, укажите длину и граммаж, добавьте в корзину." } },
    ],
    geo: { lat: 49.2267, lng: 17.6669 },
  },
  {
    slug: "karlovy-vary",
    name: { cs: "Karlovy Vary", uk: "Карлові Вари", ru: "Карловы Вары" },
    region: { cs: "Karlovarský kraj", uk: "Карловарський край", ru: "Карловарский край" },
    description: { cs: "Prémiové RAW vlasy k prodloužení s doručením do Karlových Varů do 1–2 pracovních dnů.", uk: "Преміальне RAW волосся з доставкою до Карлових Варів протягом 1–2 робочих днів.", ru: "Премиальные RAW волосы с доставкой в Карловы Вары в течение 1–2 рабочих дней." },
    deliveryNote: { cs: "Doručení do Karlových Varů do 1–2 pracovních dnů.", uk: "Доставка до Карлових Варів протягом 1–2 робочих днів.", ru: "Доставка в Карловы Вары в течение 1–2 рабочих дней." },
    consultNote: { cs: "Online konzultace přes WhatsApp nebo Telegram.", uk: "Онлайн-консультація через WhatsApp або Telegram.", ru: "Онлайн-консультация через WhatsApp или Telegram." },
    faq: [
      { q: { cs: "Kolik stojí prodloužení vlasů v Karlových Varech?", uk: "Скільки коштує нарощування в Карлових Варах?", ru: "Сколько стоит наращивание в Карловых Варах?" }, a: { cs: "Cena závisí na typu vlasů, délce a gramáži. Ceny jsou stejné pro celou ČR.", uk: "Ціна залежить від типу волосся. Ціни однакові для всієї ЧР.", ru: "Цена зависит от типа волос. Цены одинаковы для всей ЧР." } },
      { q: { cs: "Jak dlouho trvá doručení do Karlových Varů?", uk: "Скільки часу займає доставка до Карлових Варів?", ru: "Сколько времени занимает доставка в Карловы Вары?" }, a: { cs: "Doručení obvykle trvá 1–2 pracovní dny.", uk: "Доставка зазвичай займає 1–2 робочі дні.", ru: "Доставка обычно занимает 1–2 рабочих дня." } },
      { q: { cs: "Mohu si vlasy vyzkoušet osobně?", uk: "Чи можу я оглянути волосся?", ru: "Могу ли я посмотреть волосы?" }, a: { cs: "Osobní konzultace v Praze. Online přes WhatsApp.", uk: "Особиста консультація в Празі. Онлайн через WhatsApp.", ru: "Личная консультация в Праге. Онлайн через WhatsApp." } },
      { q: { cs: "Jaké metody prodloužení nabízíte?", uk: "Які методи нарощування ви пропонуєте?", ru: "Какие методы наращивания вы предлагаете?" }, a: { cs: "Clip-in, tape-in, keratin, micro-ring, tresy a ofiny.", uk: "Clip-in, tape-in, кератин, micro-ring, треси та чубчики.", ru: "Clip-in, tape-in, кератин, micro-ring, трессы и чёлки." } },
      { q: { cs: "Jsou vaše vlasy 100% pravé?", uk: "Чи ваше волосся 100% натуральне?", ru: "Ваши волосы 100% натуральные?" }, a: { cs: "Ano, výhradně 100% pravé RAW lidské vlasy.", uk: "Так, виключно 100% натуральне RAW волосся.", ru: "Да, исключительно 100% натуральные RAW волосы." } },
      { q: { cs: "Jak objednat online?", uk: "Як замовити онлайн?", ru: "Как заказать онлайн?" }, a: { cs: "Vyberte vlasy v e-shopu, zvolte délku a gramáž, přidejte do košíku.", uk: "Виберіть волосся, оберіть довжину та грамаж, додайте в кошик.", ru: "Выберите волосы, укажите длину и граммаж, добавьте в корзину." } },
    ],
    geo: { lat: 50.2325, lng: 12.8713 },
  },
  {
    slug: "usti-nad-labem",
    name: { cs: "Ústí nad Labem", uk: "Усті-над-Лабем", ru: "Усти-над-Лабем" },
    region: { cs: "Ústecký kraj", uk: "Устецький край", ru: "Устецкий край" },
    description: { cs: "Prémiové RAW vlasy k prodloužení s doručením do Ústí nad Labem do 1–2 pracovních dnů.", uk: "Преміальне RAW волосся з доставкою до Усті-над-Лабем протягом 1–2 робочих днів.", ru: "Премиальные RAW волосы с доставкой в Усти-над-Лабем в течение 1–2 рабочих дней." },
    deliveryNote: { cs: "Doručení do Ústí nad Labem do 1–2 pracovních dnů.", uk: "Доставка до Усті-над-Лабем протягом 1–2 робочих днів.", ru: "Доставка в Усти-над-Лабем в течение 1–2 рабочих дней." },
    consultNote: { cs: "Online konzultace přes WhatsApp nebo Telegram.", uk: "Онлайн-консультація через WhatsApp або Telegram.", ru: "Онлайн-консультация через WhatsApp или Telegram." },
    faq: [
      { q: { cs: "Kolik stojí prodloužení vlasů v Ústí nad Labem?", uk: "Скільки коштує нарощування в Усті-над-Лабем?", ru: "Сколько стоит наращивание в Усти-над-Лабем?" }, a: { cs: "Cena závisí na typu vlasů, délce a gramáži. Ceny jsou stejné pro celou ČR.", uk: "Ціна залежить від типу волосся. Ціни однакові для всієї ЧР.", ru: "Цена зависит от типа волос. Цены одинаковы для всей ЧР." } },
      { q: { cs: "Jak dlouho trvá doručení?", uk: "Скільки часу займає доставка?", ru: "Сколько времени занимает доставка?" }, a: { cs: "Doručení obvykle trvá 1–2 pracovní dny.", uk: "Доставка зазвичай займає 1–2 робочі дні.", ru: "Доставка обычно занимает 1–2 рабочих дня." } },
      { q: { cs: "Mohu si vlasy vyzkoušet osobně?", uk: "Чи можу я оглянути волосся?", ru: "Могу ли я посмотреть волосы?" }, a: { cs: "Osobní konzultace v Praze. Online přes WhatsApp.", uk: "Особиста консультація в Празі. Онлайн через WhatsApp.", ru: "Личная консультация в Праге. Онлайн через WhatsApp." } },
      { q: { cs: "Jaké metody prodloužení nabízíte?", uk: "Які методи нарощування ви пропонуєте?", ru: "Какие методы наращивания вы предлагаете?" }, a: { cs: "Clip-in, tape-in, keratin, micro-ring, tresy a ofiny.", uk: "Clip-in, tape-in, кератин, micro-ring, треси та чубчики.", ru: "Clip-in, tape-in, кератин, micro-ring, трессы и чёлки." } },
      { q: { cs: "Jsou vaše vlasy 100% pravé?", uk: "Чи ваше волосся 100% натуральне?", ru: "Ваши волосы 100% натуральные?" }, a: { cs: "Ano, výhradně 100% pravé RAW lidské vlasy.", uk: "Так, виключно 100% натуральне RAW волосся.", ru: "Да, исключительно 100% натуральные RAW волосы." } },
      { q: { cs: "Jak objednat online?", uk: "Як замовити онлайн?", ru: "Как заказать онлайн?" }, a: { cs: "Vyberte vlasy v e-shopu, zvolte délku a gramáž, přidejte do košíku.", uk: "Виберіть волосся, оберіть довжину та грамаж, додайте в кошик.", ru: "Выберите волосы, укажите длину и граммаж, добавьте в корзину." } },
    ],
    geo: { lat: 50.6607, lng: 14.0323 },
  },
  {
    slug: "jihlava",
    name: { cs: "Jihlava", uk: "Їглава", ru: "Йиглава" },
    region: { cs: "Kraj Vysočina", uk: "Край Височина", ru: "Край Высочина" },
    description: { cs: "Prémiové RAW vlasy k prodloužení s doručením do Jihlavy do 1–2 pracovních dnů.", uk: "Преміальне RAW волосся з доставкою до Їглави протягом 1–2 робочих днів.", ru: "Премиальные RAW волосы с доставкой в Йиглаву в течение 1–2 рабочих дней." },
    deliveryNote: { cs: "Doručení do Jihlavy do 1–2 pracovních dnů.", uk: "Доставка до Їглави протягом 1–2 робочих днів.", ru: "Доставка в Йиглаву в течение 1–2 рабочих дней." },
    consultNote: { cs: "Online konzultace přes WhatsApp nebo Telegram.", uk: "Онлайн-консультація через WhatsApp або Telegram.", ru: "Онлайн-консультация через WhatsApp или Telegram." },
    faq: [
      { q: { cs: "Kolik stojí prodloužení vlasů v Jihlavě?", uk: "Скільки коштує нарощування в Їглаві?", ru: "Сколько стоит наращивание в Йиглаве?" }, a: { cs: "Cena závisí na typu vlasů, délce a gramáži. Ceny jsou stejné pro celou ČR.", uk: "Ціна залежить від типу волосся. Ціни однакові для всієї ЧР.", ru: "Цена зависит от типа волос. Цены одинаковы для всей ЧР." } },
      { q: { cs: "Jak dlouho trvá doručení?", uk: "Скільки часу займає доставка?", ru: "Сколько времени занимает доставка?" }, a: { cs: "Doručení obvykle trvá 1–2 pracovní dny.", uk: "Доставка зазвичай займає 1–2 робочі дні.", ru: "Доставка обычно занимает 1–2 рабочих дня." } },
      { q: { cs: "Mohu si vlasy vyzkoušet osobně?", uk: "Чи можу я оглянути волосся?", ru: "Могу ли я посмотреть волосы?" }, a: { cs: "Osobní konzultace v Praze. Online přes WhatsApp.", uk: "Особиста консультація в Празі. Онлайн через WhatsApp.", ru: "Личная консультация в Праге. Онлайн через WhatsApp." } },
      { q: { cs: "Jaké metody prodloužení nabízíte?", uk: "Які методи нарощування ви пропонуєте?", ru: "Какие методы наращивания вы предлагаете?" }, a: { cs: "Clip-in, tape-in, keratin, micro-ring, tresy a ofiny.", uk: "Clip-in, tape-in, кератин, micro-ring, треси та чубчики.", ru: "Clip-in, tape-in, кератин, micro-ring, трессы и чёлки." } },
      { q: { cs: "Jsou vaše vlasy 100% pravé?", uk: "Чи ваше волосся 100% натуральне?", ru: "Ваши волосы 100% натуральные?" }, a: { cs: "Ano, výhradně 100% pravé RAW lidské vlasy.", uk: "Так, виключно 100% натуральне RAW волосся.", ru: "Да, исключительно 100% натуральные RAW волосы." } },
      { q: { cs: "Jak objednat online?", uk: "Як замовити онлайн?", ru: "Как заказать онлайн?" }, a: { cs: "Vyberte vlasy v e-shopu, přidejte do košíku.", uk: "Виберіть волосся, додайте в кошик.", ru: "Выберите волосы, добавьте в корзину." } },
    ],
    geo: { lat: 49.3961, lng: 15.5912 },
  },
  {
    slug: "kladno",
    name: { cs: "Kladno", uk: "Кладно", ru: "Кладно" },
    region: { cs: "Středočeský kraj", uk: "Середньочеський край", ru: "Среднечешский край" },
    description: { cs: "Prémiové RAW vlasy k prodloužení s doručením do Kladna do 1 pracovního dne.", uk: "Преміальне RAW волосся з доставкою до Кладна протягом 1 робочого дня.", ru: "Премиальные RAW волосы с доставкой в Кладно в течение 1 рабочего дня." },
    deliveryNote: { cs: "Doručení do Kladna do 1 pracovního dne — blízko Prahy.", uk: "Доставка до Кладна протягом 1 робочого дня — поруч з Прагою.", ru: "Доставка в Кладно в течение 1 рабочего дня — рядом с Прагой." },
    consultNote: { cs: "Online konzultace nebo osobní v Praze — Kladno je kousek.", uk: "Онлайн-консультація або особиста в Празі — Кладно поруч.", ru: "Онлайн-консультация или личная в Праге — Кладно рядом." },
    faq: [
      { q: { cs: "Kolik stojí prodloužení vlasů v Kladně?", uk: "Скільки коштує нарощування в Кладні?", ru: "Сколько стоит наращивание в Кладно?" }, a: { cs: "Cena závisí na typu vlasů, délce a gramáži. Ceny jsou stejné pro celou ČR.", uk: "Ціна залежить від типу волосся. Ціни однакові для всієї ЧР.", ru: "Цена зависит от типа волос. Цены одинаковы для всей ЧР." } },
      { q: { cs: "Jak dlouho trvá doručení do Kladna?", uk: "Скільки часу займає доставка до Кладна?", ru: "Сколько времени занимает доставка в Кладно?" }, a: { cs: "Doručení do Kladna obvykle trvá 1 pracovní den.", uk: "Доставка до Кладна зазвичай займає 1 робочий день.", ru: "Доставка в Кладно обычно занимает 1 рабочий день." } },
      { q: { cs: "Mohu si vlasy vyzkoušet osobně?", uk: "Чи можу я оглянути волосся?", ru: "Могу ли я посмотреть волосы?" }, a: { cs: "Ano, Kladno je blízko Prahy — osobní konzultace v Praze.", uk: "Так, Кладно поруч з Прагою — особиста консультація в Празі.", ru: "Да, Кладно рядом с Прагой — личная консультация в Праге." } },
      { q: { cs: "Jaké metody prodloužení nabízíte?", uk: "Які методи нарощування ви пропонуєте?", ru: "Какие методы наращивания вы предлагаете?" }, a: { cs: "Clip-in, tape-in, keratin, micro-ring, tresy a ofiny.", uk: "Clip-in, tape-in, кератин, micro-ring, треси та чубчики.", ru: "Clip-in, tape-in, кератин, micro-ring, трессы и чёлки." } },
      { q: { cs: "Jsou vaše vlasy 100% pravé?", uk: "Чи ваше волосся 100% натуральне?", ru: "Ваши волосы 100% натуральные?" }, a: { cs: "Ano, výhradně 100% pravé RAW lidské vlasy.", uk: "Так, виключно 100% натуральне RAW волосся.", ru: "Да, исключительно 100% натуральные RAW волосы." } },
      { q: { cs: "Jak objednat online?", uk: "Як замовити онлайн?", ru: "Как заказать онлайн?" }, a: { cs: "Vyberte vlasy v e-shopu, přidejte do košíku.", uk: "Виберіть волосся, додайте в кошик.", ru: "Выберите волосы, добавьте в корзину." } },
    ],
    geo: { lat: 50.1433, lng: 14.1053 },
  },
  {
    slug: "mlada-boleslav",
    name: { cs: "Mladá Boleslav", uk: "Млада Болеслав", ru: "Млада-Болеслав" },
    region: { cs: "Středočeský kraj", uk: "Середньочеський край", ru: "Среднечешский край" },
    description: { cs: "Prémiové RAW vlasy k prodloužení s doručením do Mladé Boleslavi do 1 pracovního dne.", uk: "Преміальне RAW волосся з доставкою до Млади Болеслав протягом 1 робочого дня.", ru: "Премиальные RAW волосы с доставкой в Младу-Болеслав в течение 1 рабочего дня." },
    deliveryNote: { cs: "Doručení do Mladé Boleslavi do 1 pracovního dne.", uk: "Доставка до Млади Болеслав протягом 1 робочого дня.", ru: "Доставка в Младу-Болеслав в течение 1 рабочего дня." },
    consultNote: { cs: "Online konzultace přes WhatsApp. Osobní konzultace v Praze.", uk: "Онлайн-консультація через WhatsApp. Особиста консультація в Празі.", ru: "Онлайн-консультация через WhatsApp. Личная консультация в Праге." },
    faq: [
      { q: { cs: "Kolik stojí prodloužení vlasů v Mladé Boleslavi?", uk: "Скільки коштує нарощування в Младій Болеслав?", ru: "Сколько стоит наращивание в Младе-Болеслав?" }, a: { cs: "Cena závisí na typu vlasů, délce a gramáži. Ceny jsou stejné pro celou ČR.", uk: "Ціна залежить від типу волосся. Ціни однакові для всієї ЧР.", ru: "Цена зависит от типа волос. Цены одинаковы для всей ЧР." } },
      { q: { cs: "Jak dlouho trvá doručení?", uk: "Скільки часу займає доставка?", ru: "Сколько времени занимает доставка?" }, a: { cs: "Doručení obvykle trvá 1 pracovní den.", uk: "Доставка зазвичай займає 1 робочий день.", ru: "Доставка обычно занимает 1 рабочий день." } },
      { q: { cs: "Mohu si vlasy vyzkoušet osobně?", uk: "Чи можу я оглянути волосся?", ru: "Могу ли я посмотреть волосы?" }, a: { cs: "Osobní konzultace v Praze. Online přes WhatsApp.", uk: "Особиста консультація в Празі. Онлайн через WhatsApp.", ru: "Личная консультация в Праге. Онлайн через WhatsApp." } },
      { q: { cs: "Jaké metody prodloužení nabízíte?", uk: "Які методи нарощування ви пропонуєте?", ru: "Какие методы наращивания вы предлагаете?" }, a: { cs: "Clip-in, tape-in, keratin, micro-ring, tresy a ofiny.", uk: "Clip-in, tape-in, кератин, micro-ring, треси та чубчики.", ru: "Clip-in, tape-in, кератин, micro-ring, трессы и чёлки." } },
      { q: { cs: "Jsou vaše vlasy 100% pravé?", uk: "Чи ваше волосся 100% натуральне?", ru: "Ваши волосы 100% натуральные?" }, a: { cs: "Ano, výhradně 100% pravé RAW lidské vlasy.", uk: "Так, виключно 100% натуральне RAW волосся.", ru: "Да, исключительно 100% натуральные RAW волосы." } },
      { q: { cs: "Jak objednat online?", uk: "Як замовити онлайн?", ru: "Как заказать онлайн?" }, a: { cs: "Vyberte vlasy v e-shopu, přidejte do košíku.", uk: "Виберіть волосся, додайте в кошик.", ru: "Выберите волосы, добавьте в корзину." } },
    ],
    geo: { lat: 50.4111, lng: 14.9069 },
  },
  {
    slug: "havirov",
    name: { cs: "Havířov", uk: "Гавіржов", ru: "Гавиржов" },
    region: { cs: "Moravskoslezský kraj", uk: "Моравськосілезький край", ru: "Моравскосилезский край" },
    description: { cs: "Prémiové RAW vlasy k prodloužení s doručením do Havířova do 2 pracovních dnů.", uk: "Преміальне RAW волосся з доставкою до Гавіржова протягом 2 робочих днів.", ru: "Премиальные RAW волосы с доставкой в Гавиржов в течение 2 рабочих дней." },
    deliveryNote: { cs: "Doručení do Havířova do 2 pracovních dnů.", uk: "Доставка до Гавіржова протягом 2 робочих днів.", ru: "Доставка в Гавиржов в течение 2 рабочих дней." },
    consultNote: { cs: "Online konzultace přes WhatsApp nebo Telegram.", uk: "Онлайн-консультація через WhatsApp або Telegram.", ru: "Онлайн-консультация через WhatsApp или Telegram." },
    faq: [
      { q: { cs: "Kolik stojí prodloužení vlasů v Havířově?", uk: "Скільки коштує нарощування в Гавіржові?", ru: "Сколько стоит наращивание в Гавиржове?" }, a: { cs: "Cena závisí na typu vlasů, délce a gramáži. Ceny jsou stejné pro celou ČR.", uk: "Ціна залежить від типу волосся. Ціни однакові для всієї ЧР.", ru: "Цена зависит от типа волос. Цены одинаковы для всей ЧР." } },
      { q: { cs: "Jak dlouho trvá doručení?", uk: "Скільки часу займає доставка?", ru: "Сколько времени занимает доставка?" }, a: { cs: "Doručení obvykle trvá 1–2 pracovní dny.", uk: "Доставка зазвичай займає 1–2 робочі дні.", ru: "Доставка обычно занимает 1–2 рабочих дня." } },
      { q: { cs: "Mohu si vlasy vyzkoušet osobně?", uk: "Чи можу я оглянути волосся?", ru: "Могу ли я посмотреть волосы?" }, a: { cs: "Osobní konzultace v Praze. Online přes WhatsApp.", uk: "Особиста консультація в Празі. Онлайн через WhatsApp.", ru: "Личная консультация в Праге. Онлайн через WhatsApp." } },
      { q: { cs: "Jaké metody prodloužení nabízíte?", uk: "Які методи нарощування ви пропонуєте?", ru: "Какие методы наращивания вы предлагаете?" }, a: { cs: "Clip-in, tape-in, keratin, micro-ring, tresy a ofiny.", uk: "Clip-in, tape-in, кератин, micro-ring, треси та чубчики.", ru: "Clip-in, tape-in, кератин, micro-ring, трессы и чёлки." } },
      { q: { cs: "Jsou vaše vlasy 100% pravé?", uk: "Чи ваше волосся 100% натуральне?", ru: "Ваши волосы 100% натуральные?" }, a: { cs: "Ano, výhradně 100% pravé RAW lidské vlasy.", uk: "Так, виключно 100% натуральне RAW волосся.", ru: "Да, исключительно 100% натуральные RAW волосы." } },
      { q: { cs: "Jak objednat online?", uk: "Як замовити онлайн?", ru: "Как заказать онлайн?" }, a: { cs: "Vyberte vlasy v e-shopu, přidejte do košíku.", uk: "Виберіть волосся, додайте в кошик.", ru: "Выберите волосы, добавьте в корзину." } },
    ],
    geo: { lat: 49.7797, lng: 18.4342 },
  },
  {
    slug: "opava",
    name: { cs: "Opava", uk: "Опава", ru: "Опава" },
    region: { cs: "Moravskoslezský kraj", uk: "Моравськосілезький край", ru: "Моравскосилезский край" },
    description: { cs: "Prémiové RAW vlasy k prodloužení s doručením do Opavy do 2 pracovních dnů.", uk: "Преміальне RAW волосся з доставкою до Опави протягом 2 робочих днів.", ru: "Премиальные RAW волосы с доставкой в Опаву в течение 2 рабочих дней." },
    deliveryNote: { cs: "Doručení do Opavy do 2 pracovních dnů.", uk: "Доставка до Опави протягом 2 робочих днів.", ru: "Доставка в Опаву в течение 2 рабочих дней." },
    consultNote: { cs: "Online konzultace přes WhatsApp nebo Telegram.", uk: "Онлайн-консультація через WhatsApp або Telegram.", ru: "Онлайн-консультация через WhatsApp или Telegram." },
    faq: [
      { q: { cs: "Kolik stojí prodloužení vlasů v Opavě?", uk: "Скільки коштує нарощування в Опаві?", ru: "Сколько стоит наращивание в Опаве?" }, a: { cs: "Cena závisí na typu vlasů, délce a gramáži. Ceny jsou stejné pro celou ČR.", uk: "Ціна залежить від типу волосся. Ціни однакові для всієї ЧР.", ru: "Цена зависит от типа волос. Цены одинаковы для всей ЧР." } },
      { q: { cs: "Jak dlouho trvá doručení?", uk: "Скільки часу займає доставка?", ru: "Сколько времени занимает доставка?" }, a: { cs: "Doručení obvykle trvá 1–2 pracovní dny.", uk: "Доставка зазвичай займає 1–2 робочі дні.", ru: "Доставка обычно занимает 1–2 рабочих дня." } },
      { q: { cs: "Mohu si vlasy vyzkoušet osobně?", uk: "Чи можу я оглянути волосся?", ru: "Могу ли я посмотреть волосы?" }, a: { cs: "Osobní konzultace v Praze. Online přes WhatsApp.", uk: "Особиста консультація в Празі. Онлайн через WhatsApp.", ru: "Личная консультация в Праге. Онлайн через WhatsApp." } },
      { q: { cs: "Jaké metody prodloužení nabízíte?", uk: "Які методи нарощування ви пропонуєте?", ru: "Какие методы наращивания вы предлагаете?" }, a: { cs: "Clip-in, tape-in, keratin, micro-ring, tresy a ofiny.", uk: "Clip-in, tape-in, кератин, micro-ring, треси та чубчики.", ru: "Clip-in, tape-in, кератин, micro-ring, трессы и чёлки." } },
      { q: { cs: "Jsou vaše vlasy 100% pravé?", uk: "Чи ваше волосся 100% натуральне?", ru: "Ваши волосы 100% натуральные?" }, a: { cs: "Ano, výhradně 100% pravé RAW lidské vlasy.", uk: "Так, виключно 100% натуральне RAW волосся.", ru: "Да, исключительно 100% натуральные RAW волосы." } },
      { q: { cs: "Jak objednat online?", uk: "Як замовити онлайн?", ru: "Как заказать онлайн?" }, a: { cs: "Vyberte vlasy v e-shopu, přidejte do košíku.", uk: "Виберіть волосся, додайте в кошик.", ru: "Выберите волосы, добавьте в корзину." } },
    ],
    geo: { lat: 49.9381, lng: 17.9026 },
  },
  {
    slug: "frydek-mistek",
    name: { cs: "Frýdek-Místek", uk: "Фридек-Містек", ru: "Фридек-Мистек" },
    region: { cs: "Moravskoslezský kraj", uk: "Моравськосілезький край", ru: "Моравскосилезский край" },
    description: { cs: "Prémiové RAW vlasy k prodloužení s doručením do Frýdku-Místku do 2 pracovních dnů.", uk: "Преміальне RAW волосся з доставкою до Фридека-Містека протягом 2 робочих днів.", ru: "Премиальные RAW волосы с доставкой во Фридек-Мистек в течение 2 рабочих дней." },
    deliveryNote: { cs: "Doručení do Frýdku-Místku do 2 pracovních dnů.", uk: "Доставка до Фридека-Містека протягом 2 робочих днів.", ru: "Доставка во Фридек-Мистек в течение 2 рабочих дней." },
    consultNote: { cs: "Online konzultace přes WhatsApp nebo Telegram.", uk: "Онлайн-консультація через WhatsApp або Telegram.", ru: "Онлайн-консультация через WhatsApp или Telegram." },
    faq: [
      { q: { cs: "Kolik stojí prodloužení vlasů ve Frýdku-Místku?", uk: "Скільки коштує нарощування у Фридеку-Містеку?", ru: "Сколько стоит наращивание во Фридек-Мистеке?" }, a: { cs: "Cena závisí na typu vlasů, délce a gramáži. Ceny jsou stejné pro celou ČR.", uk: "Ціна залежить від типу волосся. Ціни однакові для всієї ЧР.", ru: "Цена зависит от типа волос. Цены одинаковы для всей ЧР." } },
      { q: { cs: "Jak dlouho trvá doručení?", uk: "Скільки часу займає доставка?", ru: "Сколько времени занимает доставка?" }, a: { cs: "Doručení obvykle trvá 1–2 pracovní dny.", uk: "Доставка зазвичай займає 1–2 робочі дні.", ru: "Доставка обычно занимает 1–2 рабочих дня." } },
      { q: { cs: "Mohu si vlasy vyzkoušet osobně?", uk: "Чи можу я оглянути волосся?", ru: "Могу ли я посмотреть волосы?" }, a: { cs: "Osobní konzultace v Praze. Online přes WhatsApp.", uk: "Особиста консультація в Празі. Онлайн через WhatsApp.", ru: "Личная консультация в Праге. Онлайн через WhatsApp." } },
      { q: { cs: "Jaké metody prodloužení nabízíte?", uk: "Які методи нарощування ви пропонуєте?", ru: "Какие методы наращивания вы предлагаете?" }, a: { cs: "Clip-in, tape-in, keratin, micro-ring, tresy a ofiny.", uk: "Clip-in, tape-in, кератин, micro-ring, треси та чубчики.", ru: "Clip-in, tape-in, кератин, micro-ring, трессы и чёлки." } },
      { q: { cs: "Jsou vaše vlasy 100% pravé?", uk: "Чи ваше волосся 100% натуральне?", ru: "Ваши волосы 100% натуральные?" }, a: { cs: "Ano, výhradně 100% pravé RAW lidské vlasy.", uk: "Так, виключно 100% натуральне RAW волосся.", ru: "Да, исключительно 100% натуральные RAW волосы." } },
      { q: { cs: "Jak objednat online?", uk: "Як замовити онлайн?", ru: "Как заказать онлайн?" }, a: { cs: "Vyberte vlasy v e-shopu, přidejte do košíku.", uk: "Виберіть волосся, додайте в кошик.", ru: "Выберите волосы, добавьте в корзину." } },
    ],
    geo: { lat: 49.6880, lng: 18.3509 },
  },
  {
    slug: "teplice",
    name: { cs: "Teplice", uk: "Тепліце", ru: "Теплице" },
    region: { cs: "Ústecký kraj", uk: "Устецький край", ru: "Устецкий край" },
    description: { cs: "Prémiové RAW vlasy k prodloužení s doručením do Teplic do 1–2 pracovních dnů.", uk: "Преміальне RAW волосся з доставкою до Тепліце протягом 1–2 робочих днів.", ru: "Премиальные RAW волосы с доставкой в Теплице в течение 1–2 рабочих дней." },
    deliveryNote: { cs: "Doručení do Teplic do 1–2 pracovních dnů.", uk: "Доставка до Тепліце протягом 1–2 робочих днів.", ru: "Доставка в Теплице в течение 1–2 рабочих дней." },
    consultNote: { cs: "Online konzultace přes WhatsApp nebo Telegram.", uk: "Онлайн-консультація через WhatsApp або Telegram.", ru: "Онлайн-консультация через WhatsApp или Telegram." },
    faq: [
      { q: { cs: "Kolik stojí prodloužení vlasů v Teplicích?", uk: "Скільки коштує нарощування в Тепліцях?", ru: "Сколько стоит наращивание в Теплице?" }, a: { cs: "Cena závisí na typu vlasů, délce a gramáži. Ceny jsou stejné pro celou ČR.", uk: "Ціна залежить від типу волосся. Ціни однакові для всієї ЧР.", ru: "Цена зависит от типа волос. Цены одинаковы для всей ЧР." } },
      { q: { cs: "Jak dlouho trvá doručení?", uk: "Скільки часу займає доставка?", ru: "Сколько времени занимает доставка?" }, a: { cs: "Doručení obvykle trvá 1–2 pracovní dny.", uk: "Доставка зазвичай займає 1–2 робочі дні.", ru: "Доставка обычно занимает 1–2 рабочих дня." } },
      { q: { cs: "Mohu si vlasy vyzkoušet osobně?", uk: "Чи можу я оглянути волосся?", ru: "Могу ли я посмотреть волосы?" }, a: { cs: "Osobní konzultace v Praze. Online přes WhatsApp.", uk: "Особиста консультація в Празі. Онлайн через WhatsApp.", ru: "Личная консультация в Праге. Онлайн через WhatsApp." } },
      { q: { cs: "Jaké metody prodloužení nabízíte?", uk: "Які методи нарощування ви пропонуєте?", ru: "Какие методы наращивания вы предлагаете?" }, a: { cs: "Clip-in, tape-in, keratin, micro-ring, tresy a ofiny.", uk: "Clip-in, tape-in, кератин, micro-ring, треси та чубчики.", ru: "Clip-in, tape-in, кератин, micro-ring, трессы и чёлки." } },
      { q: { cs: "Jsou vaše vlasy 100% pravé?", uk: "Чи ваше волосся 100% натуральне?", ru: "Ваши волосы 100% натуральные?" }, a: { cs: "Ano, výhradně 100% pravé RAW lidské vlasy.", uk: "Так, виключно 100% натуральне RAW волосся.", ru: "Да, исключительно 100% натуральные RAW волосы." } },
      { q: { cs: "Jak objednat online?", uk: "Як замовити онлайн?", ru: "Как заказать онлайн?" }, a: { cs: "Vyberte vlasy v e-shopu, přidejte do košíku.", uk: "Виберіть волосся, додайте в кошик.", ru: "Выберите волосы, добавьте в корзину." } },
    ],
    geo: { lat: 50.6405, lng: 13.8245 },
  },
  {
    slug: "most",
    name: { cs: "Most", uk: "Мост", ru: "Мост" },
    region: { cs: "Ústecký kraj", uk: "Устецький край", ru: "Устецкий край" },
    description: { cs: "Prémiové RAW vlasy k prodloužení s doručením do Mostu do 1–2 pracovních dnů.", uk: "Преміальне RAW волосся з доставкою до Моста протягом 1–2 робочих днів.", ru: "Премиальные RAW волосы с доставкой в Мост в течение 1–2 рабочих дней." },
    deliveryNote: { cs: "Doručení do Mostu do 1–2 pracovních dnů.", uk: "Доставка до Моста протягом 1–2 робочих днів.", ru: "Доставка в Мост в течение 1–2 рабочих дней." },
    consultNote: { cs: "Online konzultace přes WhatsApp nebo Telegram.", uk: "Онлайн-консультація через WhatsApp або Telegram.", ru: "Онлайн-консультация через WhatsApp или Telegram." },
    faq: [
      { q: { cs: "Kolik stojí prodloužení vlasů v Mostě?", uk: "Скільки коштує нарощування в Мості?", ru: "Сколько стоит наращивание в Мосте?" }, a: { cs: "Cena závisí na typu vlasů, délce a gramáži. Ceny jsou stejné pro celou ČR.", uk: "Ціна залежить від типу волосся. Ціни однакові для всієї ЧР.", ru: "Цена зависит от типа волос. Цены одинаковы для всей ЧР." } },
      { q: { cs: "Jak dlouho trvá doručení?", uk: "Скільки часу займає доставка?", ru: "Сколько времени занимает доставка?" }, a: { cs: "Doručení obvykle trvá 1–2 pracovní dny.", uk: "Доставка зазвичай займає 1–2 робочі дні.", ru: "Доставка обычно занимает 1–2 рабочих дня." } },
      { q: { cs: "Mohu si vlasy vyzkoušet osobně?", uk: "Чи можу я оглянути волосся?", ru: "Могу ли я посмотреть волосы?" }, a: { cs: "Osobní konzultace v Praze. Online přes WhatsApp.", uk: "Особиста консультація в Празі. Онлайн через WhatsApp.", ru: "Личная консультация в Праге. Онлайн через WhatsApp." } },
      { q: { cs: "Jaké metody prodloužení nabízíte?", uk: "Які методи нарощування ви пропонуєте?", ru: "Какие методы наращивания вы предлагаете?" }, a: { cs: "Clip-in, tape-in, keratin, micro-ring, tresy a ofiny.", uk: "Clip-in, tape-in, кератин, micro-ring, треси та чубчики.", ru: "Clip-in, tape-in, кератин, micro-ring, трессы и чёлки." } },
      { q: { cs: "Jsou vaše vlasy 100% pravé?", uk: "Чи ваше волосся 100% натуральне?", ru: "Ваши волосы 100% натуральные?" }, a: { cs: "Ano, výhradně 100% pravé RAW lidské vlasy.", uk: "Так, виключно 100% натуральне RAW волосся.", ru: "Да, исключительно 100% натуральные RAW волосы." } },
      { q: { cs: "Jak objednat online?", uk: "Як замовити онлайн?", ru: "Как заказать онлайн?" }, a: { cs: "Vyberte vlasy v e-shopu, přidejte do košíku.", uk: "Виберіть волосся, додайте в кошик.", ru: "Выберите волосы, добавьте в корзину." } },
    ],
    geo: { lat: 50.5031, lng: 13.6364 },
  },
];

export function getCityBySlug(slug: string): CityData | undefined {
  return CITIES.find((c) => c.slug === slug);
}
