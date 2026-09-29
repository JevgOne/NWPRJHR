import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["cs", "uk", "ru", "en"],
  defaultLocale: "cs",
  localePrefix: {
    mode: "as-needed",
    prefixes: {
      uk: "/ua",
      ru: "/rus",
      en: "/en",
    },
  },
  localeCookie: false,
  localeDetection: false,
  alternateLinks: true,
  pathnames: {
    "/": "/",

    // === P1: Hlavní obchodní stránky ===
    "/vlasy-k-prodlouzeni": {
      cs: "/vlasy-k-prodlouzeni",
      ru: "/волосы-для-наращивания",
      uk: "/волосся-для-нарощування",
      en: "/hair-extensions",
    },
    "/vlasy-k-prodlouzeni/[...slug]": {
      cs: "/vlasy-k-prodlouzeni/[...slug]",
      ru: "/волосы-для-наращивания/[...slug]",
      uk: "/волосся-для-нарощування/[...slug]",
      en: "/hair-extensions/[...slug]",
    },
    "/cenik-vlasy": {
      cs: "/cenik-vlasy",
      ru: "/прайс-лист",
      uk: "/прайс-лист",
      en: "/price-list",
    },
    "/prodlouzeni-vlasu": {
      cs: "/prodlouzeni-vlasu",
      ru: "/наращивание-волос",
      uk: "/нарощування-волосся",
      en: "/hair-extensions-cities",
    },
    "/prodlouzeni-vlasu/[city]": {
      cs: "/prodlouzeni-vlasu/[city]",
      ru: "/наращивание-волос/[city]",
      uk: "/нарощування-волосся/[city]",
      en: "/hair-extensions-cities/[city]",
    },
    "/prodlouzeni-vlasu-praha": {
      cs: "/prodlouzeni-vlasu-praha",
      ru: "/наращивание-волос-прага",
      uk: "/нарощування-волосся-прага",
      en: "/hair-extensions-prague",
    },

    // === P2: Produktové a servisní stránky ===
    "/clip-in-vlasy": {
      cs: "/clip-in-vlasy",
      ru: "/clip-in-волосы",
      uk: "/clip-in-волосся",
      en: "/clip-in-hair",
    },
    "/tape-in-vlasy": {
      cs: "/tape-in-vlasy",
      ru: "/tape-in-волосы",
      uk: "/tape-in-волосся",
      en: "/tape-in-hair",
    },
    "/keratinove-vlasy": {
      cs: "/keratinove-vlasy",
      ru: "/кератиновые-волосы",
      uk: "/кератинове-волосся",
      en: "/keratin-hair",
    },
    "/micro-ring-vlasy": {
      cs: "/micro-ring-vlasy",
      ru: "/micro-ring-волосы",
      uk: "/micro-ring-волосся",
      en: "/micro-ring-hair",
    },
    "/tresove-vlasy": {
      cs: "/tresove-vlasy",
      ru: "/трессовые-волосы",
      uk: "/тресове-волосся",
      en: "/weft-hair",
    },
    "/ofiny": {
      cs: "/ofiny",
      ru: "/чёлки",
      uk: "/чубчики",
      en: "/bangs",
    },
    "/pricesky": {
      cs: "/pricesky",
      ru: "/шиньоны",
      uk: "/шиньйони",
      en: "/hairpieces",
    },
    "/vlasove-pasky": {
      cs: "/vlasove-pasky",
      ru: "/волосяные-ленты",
      uk: "/волосяні-стрічки",
      en: "/hair-tapes",
    },
    "/panenske-vlasy": {
      cs: "/panenske-vlasy",
      ru: "/девственные-волосы",
      uk: "/незаймане-волосся",
      en: "/virgin-hair",
    },
    "/slovanske-vlasy": {
      cs: "/slovanske-vlasy",
      ru: "/славянские-волосы",
      uk: "/словянське-волосся",
      en: "/slavic-hair",
    },
    "/ukrajinske-vlasy": {
      cs: "/ukrajinske-vlasy",
      ru: "/украинские-волосы",
      uk: "/українське-волосся",
      en: "/ukrainian-hair",
    },
    "/pece-o-vlasy": {
      cs: "/pece-o-vlasy",
      ru: "/уход-за-волосами",
      uk: "/догляд-за-волоссям",
      en: "/hair-care",
    },
    "/kadernice": {
      cs: "/kadernice",
      ru: "/парикмахеры",
      uk: "/перукарки",
      en: "/stylists",
    },
    "/kadernice/[slug]": {
      cs: "/kadernice/[slug]",
      ru: "/парикмахеры/[slug]",
      uk: "/перукарки/[slug]",
      en: "/stylists/[slug]",
    },
    "/poradna": {
      cs: "/poradna",
      ru: "/консультация",
      uk: "/консультація",
      en: "/advice",
    },
    "/poradna/[slug]": {
      cs: "/poradna/[slug]",
      ru: "/консультация/[slug]",
      uk: "/консультація/[slug]",
      en: "/advice/[slug]",
    },

    // === P3: Informační a právní stránky ===
    "/blog": {
      cs: "/blog",
      ru: "/блог",
      uk: "/блог",
      en: "/blog",
    },
    "/blog/[slug]": {
      cs: "/blog/[slug]",
      ru: "/блог/[slug]",
      uk: "/блог/[slug]",
      en: "/blog/[slug]",
    },
    "/prislusenstvi": {
      cs: "/prislusenstvi",
      ru: "/аксессуары",
      uk: "/аксесуари",
      en: "/accessories",
    },
    "/pruvodce-gramazi": {
      cs: "/pruvodce-gramazi",
      ru: "/гид-по-весу",
      uk: "/гід-по-вазі",
      en: "/weight-guide",
    },
    "/recenze": {
      cs: "/recenze",
      ru: "/отзывы",
      uk: "/відгуки",
      en: "/reviews",
    },
    "/vykup": {
      cs: "/vykup",
      ru: "/выкуп-волос",
      uk: "/викуп-волосся",
      en: "/hair-buyback",
    },
    "/pro": {
      cs: "/pro",
      ru: "/для-профессионалов",
      uk: "/для-професіоналів",
      en: "/for-professionals",
    },
    "/kontakt": {
      cs: "/kontakt",
      ru: "/контакт",
      uk: "/контакт",
      en: "/contact",
    },
    "/o-nas": {
      cs: "/o-nas",
      ru: "/о-нас",
      uk: "/про-нас",
      en: "/about",
    },
    "/doprava": {
      cs: "/doprava",
      ru: "/доставка",
      uk: "/доставка",
      en: "/shipping",
    },
    "/obchodni-podminky": {
      cs: "/obchodni-podminky",
      ru: "/условия",
      uk: "/умови",
      en: "/terms",
    },
    "/reklamacni-rad": {
      cs: "/reklamacni-rad",
      ru: "/рекламации",
      uk: "/рекламації",
      en: "/complaints",
    },
    "/odstoupeni-od-smlouvy": {
      cs: "/odstoupeni-od-smlouvy",
      ru: "/возврат",
      uk: "/повернення",
      en: "/withdrawal",
    },
    "/ochrana-udaju": {
      cs: "/ochrana-udaju",
      ru: "/конфиденциальность",
      uk: "/конфіденційність",
      en: "/privacy",
    },
    "/promeny": {
      cs: "/promeny",
      ru: "/преображения",
      uk: "/перетворення",
      en: "/transformations",
    },
    "/registrace": {
      cs: "/registrace",
      ru: "/регистрация",
      uk: "/реєстрація",
      en: "/register",
    },
    "/pokladna": {
      cs: "/pokladna",
      ru: "/оформление",
      uk: "/оформлення",
      en: "/checkout",
    },
    "/oblibene": {
      cs: "/oblibene",
      ru: "/избранное",
      uk: "/обране",
      en: "/favorites",
    },
    "/kosik": {
      cs: "/kosik",
      ru: "/корзина",
      uk: "/кошик",
      en: "/cart",
    },
    "/platba/vysledek": {
      cs: "/platba/vysledek",
      ru: "/оплата/результат",
      uk: "/оплата/результат",
      en: "/payment/result",
    },
  },
});
