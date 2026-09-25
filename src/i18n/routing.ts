import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["cs", "uk", "ru"],
  defaultLocale: "cs",
  localePrefix: {
    mode: "as-needed",
    prefixes: {
      uk: "/ua",
      ru: "/rus",
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
    },
    "/vlasy-k-prodlouzeni/[...slug]": {
      cs: "/vlasy-k-prodlouzeni/[...slug]",
      ru: "/волосы-для-наращивания/[...slug]",
      uk: "/волосся-для-нарощування/[...slug]",
    },
    "/cenik-vlasy": {
      cs: "/cenik-vlasy",
      ru: "/прайс-лист",
      uk: "/прайс-лист",
    },
    "/prodlouzeni-vlasu": {
      cs: "/prodlouzeni-vlasu",
      ru: "/наращивание-волос",
      uk: "/нарощування-волосся",
    },
    "/prodlouzeni-vlasu/[city]": {
      cs: "/prodlouzeni-vlasu/[city]",
      ru: "/наращивание-волос/[city]",
      uk: "/нарощування-волосся/[city]",
    },
    "/prodlouzeni-vlasu-praha": {
      cs: "/prodlouzeni-vlasu-praha",
      ru: "/наращивание-волос-прага",
      uk: "/нарощування-волосся-прага",
    },

    // === P2: Produktové a servisní stránky ===
    "/clip-in-vlasy": {
      cs: "/clip-in-vlasy",
      ru: "/clip-in-волосы",
      uk: "/clip-in-волосся",
    },
    "/tape-in-vlasy": {
      cs: "/tape-in-vlasy",
      ru: "/tape-in-волосы",
      uk: "/tape-in-волосся",
    },
    "/keratinove-vlasy": {
      cs: "/keratinove-vlasy",
      ru: "/кератиновые-волосы",
      uk: "/кератинове-волосся",
    },
    "/micro-ring-vlasy": {
      cs: "/micro-ring-vlasy",
      ru: "/micro-ring-волосы",
      uk: "/micro-ring-волосся",
    },
    "/tresove-vlasy": {
      cs: "/tresove-vlasy",
      ru: "/трессовые-волосы",
      uk: "/тресове-волосся",
    },
    "/ofiny": {
      cs: "/ofiny",
      ru: "/чёлки",
      uk: "/чубчики",
    },
    "/pricesky": {
      cs: "/pricesky",
      ru: "/шиньоны",
      uk: "/шиньйони",
    },
    "/vlasove-pasky": {
      cs: "/vlasove-pasky",
      ru: "/волосяные-ленты",
      uk: "/волосяні-стрічки",
    },
    "/panenske-vlasy": {
      cs: "/panenske-vlasy",
      ru: "/девственные-волосы",
      uk: "/незаймане-волосся",
    },
    "/slovanske-vlasy": {
      cs: "/slovanske-vlasy",
      ru: "/славянские-волосы",
      uk: "/словянське-волосся",
    },
    "/ukrajinske-vlasy": {
      cs: "/ukrajinske-vlasy",
      ru: "/украинские-волосы",
      uk: "/українське-волосся",
    },
    "/pece-o-vlasy": {
      cs: "/pece-o-vlasy",
      ru: "/уход-за-волосами",
      uk: "/догляд-за-волоссям",
    },
    "/kadernice": {
      cs: "/kadernice",
      ru: "/парикмахеры",
      uk: "/перукарки",
    },
    "/kadernice/[slug]": {
      cs: "/kadernice/[slug]",
      ru: "/парикмахеры/[slug]",
      uk: "/перукарки/[slug]",
    },
    "/poradna": {
      cs: "/poradna",
      ru: "/консультация",
      uk: "/консультація",
    },
    "/poradna/[slug]": {
      cs: "/poradna/[slug]",
      ru: "/консультация/[slug]",
      uk: "/консультація/[slug]",
    },

    // === P3: Informační a právní stránky ===
    "/blog": {
      cs: "/blog",
      ru: "/блог",
      uk: "/блог",
    },
    "/blog/[slug]": {
      cs: "/blog/[slug]",
      ru: "/блог/[slug]",
      uk: "/блог/[slug]",
    },
    "/prislusenstvi": {
      cs: "/prislusenstvi",
      ru: "/аксессуары",
      uk: "/аксесуари",
    },
    "/pruvodce-gramazi": {
      cs: "/pruvodce-gramazi",
      ru: "/гид-по-весу",
      uk: "/гід-по-вазі",
    },
    "/recenze": {
      cs: "/recenze",
      ru: "/отзывы",
      uk: "/відгуки",
    },
    "/vykup": {
      cs: "/vykup",
      ru: "/выкуп-волос",
      uk: "/викуп-волосся",
    },
    "/pro": {
      cs: "/pro",
      ru: "/для-профессионалов",
      uk: "/для-професіоналів",
    },
    "/kontakt": {
      cs: "/kontakt",
      ru: "/контакт",
      uk: "/контакт",
    },
    "/o-nas": {
      cs: "/o-nas",
      ru: "/о-нас",
      uk: "/про-нас",
    },
    "/doprava": {
      cs: "/doprava",
      ru: "/доставка",
      uk: "/доставка",
    },
    "/obchodni-podminky": {
      cs: "/obchodni-podminky",
      ru: "/условия",
      uk: "/умови",
    },
    "/reklamacni-rad": {
      cs: "/reklamacni-rad",
      ru: "/рекламации",
      uk: "/рекламації",
    },
    "/odstoupeni-od-smlouvy": {
      cs: "/odstoupeni-od-smlouvy",
      ru: "/возврат",
      uk: "/повернення",
    },
    "/ochrana-udaju": {
      cs: "/ochrana-udaju",
      ru: "/конфиденциальность",
      uk: "/конфіденційність",
    },
    "/faq": "/faq",
    "/registrace": {
      cs: "/registrace",
      ru: "/регистрация",
      uk: "/реєстрація",
    },
    "/pokladna": {
      cs: "/pokladna",
      ru: "/оформление",
      uk: "/оформлення",
    },
    "/oblibene": {
      cs: "/oblibene",
      ru: "/избранное",
      uk: "/обране",
    },
    "/poptavka": {
      cs: "/poptavka",
      ru: "/запрос",
      uk: "/запит",
    },
    "/platba/vysledek": {
      cs: "/platba/vysledek",
      ru: "/оплата/результат",
      uk: "/оплата/результат",
    },
  },
});
