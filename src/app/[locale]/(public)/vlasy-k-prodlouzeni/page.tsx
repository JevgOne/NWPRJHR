import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { getCachedB2BSettings } from "@/lib/b2b-pricing";
import { getCachedAllProducts } from "@/lib/cached-products";
import { ProductsShowcase } from "./ProductsShowcase";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { getAlternates, getOgUrl, OG_LOCALES } from "@/lib/seo";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const [t, locale] = await Promise.all([getTranslations("public"), getLocale()]);

  const defaultTitle = t("offer.metaTitle");
  const defaultDesc = t("offer.metaDescription");

  if (!sp.category && !sp.origin && !sp.lengthCm && !sp.texture && !sp.colorTone) {
    return {
      title: defaultTitle,
      description: defaultDesc,
      alternates: getAlternates("/vlasy-k-prodlouzeni", locale),
      openGraph: {
        type: "website",
        title: `${defaultTitle} | Hairland`,
        description: defaultDesc,
        url: getOgUrl("/vlasy-k-prodlouzeni", locale),
        siteName: "Hairland",
        locale: OG_LOCALES[locale] ?? "cs_CZ",
        images: [
          {
            url: "https://www.hairland.cz/og/og-offer.jpg",
            width: 1200,
            height: 630,
            alt: t("offer.ogAltOffer"),
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${defaultTitle} | Hairland`,
        description: defaultDesc,
        images: ["https://www.hairland.cz/og/og-offer.jpg"],
      },
    };
  }

  const parts: string[] = [];
  if (sp.category && sp.category !== "ALL") parts.push(sp.category);
  if (sp.origin) parts.push(sp.origin);
  if (sp.lengthCm) parts.push(`${sp.lengthCm} cm`);
  if (sp.texture) parts.push(sp.texture);
  if (sp.colorTone) parts.push(sp.colorTone);

  const hasFilters = sp.search || sp.color || sp.category || sp.sort || sp.origin || sp.lengthCm || sp.texture || sp.colorTone;
  const title = `${parts.join(" | ")} — ${t("products.title")}`;
  const description = `${parts.join(", ")} — ${defaultDesc}`;
  return {
    title,
    description,
    ...(hasFilters && { robots: { index: false } }),
    alternates: getAlternates("/vlasy-k-prodlouzeni", locale),
    openGraph: {
      type: "website",
      title: `${title} | Hairland`,
      description,
      url: getOgUrl("/vlasy-k-prodlouzeni", locale),
      siteName: "Hairland",
      locale: OG_LOCALES[locale] ?? "cs_CZ",
      images: [{ url: "https://www.hairland.cz/og/og-offer.jpg", width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Hairland`,
      description,
      images: ["https://www.hairland.cz/og/og-offer.jpg"],
    },
  };
}

export default async function ProductsPage() {
  const [t, session, allProducts, locale] = await Promise.all([
    getTranslations("public"),
    auth(),
    getCachedAllProducts(),
    getLocale(),
  ]);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("offer.metaTitle"),
    inLanguage: locale,
    numberOfItems: allProducts.length,
    itemListElement: allProducts.slice(0, 50).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://www.hairland.cz/vlasy-k-prodlouzeni/${p.slug ?? p.id}`,
      name: p.name,
      ...(p.photos.length > 0 ? { image: p.photos[0] } : {}),
    })),
  };

  // Resolve user pricing tier
  let userRole: string | null = null;
  let discountPct = 0;

  if (session?.user?.role === "HAIRDRESSER" || session?.user?.role === "SALON") {
    userRole = session.user.role;
    const b2bSettings = await getCachedB2BSettings();
    discountPct = userRole === "SALON"
      ? b2bSettings.salonDiscountPct
      : b2bSettings.hairdresserDiscountPct;
  }

  const faqItems = [
    { q: t("offer.faq1q"), a: t("offer.faq1a") },
    { q: t("offer.faq2q"), a: t("offer.faq2a") },
    { q: t("offer.faq3q"), a: t("offer.faq3a") },
    { q: t("offer.faq4q"), a: t("offer.faq4a") },
    { q: t("offer.faq5q"), a: t("offer.faq5a") },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  const originLinks = [
    { slug: "ukrajina", label: t("offer.originUkraine") },
    { slug: "rusko", label: t("offer.originRussia") },
    { slug: "belorusko", label: t("offer.originBelarus") },
    { slug: "kazachstan", label: t("offer.originKazakhstan") },
    { slug: "turecko", label: t("offer.originTurkey") },
    { slug: "iran", label: t("offer.originIran") },
    { slug: "indie", label: t("offer.originIndia") },
    { slug: "vietnam", label: t("offer.originVietnam") },
    { slug: "moldavsko", label: t("offer.originMoldova") },
  ];

  const textureLinks = [
    { slug: "rovne", label: t("offer.textureStraight") },
    { slug: "mirne-vlnite", label: t("offer.textureSlightlyWavy") },
    { slug: "vlnite", label: t("offer.textureWavy") },
    { slug: "kudrnate", label: t("offer.textureCurly") },
  ];

  const categoryLinks = [
    { slug: "virgin", label: t("offer.categoryVirgin") },
    { slug: "luxe", label: t("offer.categoryLuxe") },
    { slug: "standard", label: t("offer.categoryStandard") },
  ];

  const lengthLinks = [
    { slug: "30cm", label: "30 cm" },
    { slug: "40cm", label: "40 cm" },
    { slug: "50cm", label: "50 cm" },
    { slug: "60cm", label: "60 cm" },
    { slug: "70cm", label: "70 cm" },
  ];

  const colorLinks = [
    { slug: "blond", label: t("offer.colorBlond") },
    { slug: "hneda", label: t("offer.colorBrown") },
    { slug: "tmave-hneda", label: t("offer.colorDarkBrown") },
    { slug: "zrzava", label: t("offer.colorRed") },
    { slug: "cerna", label: t("offer.colorBlack") },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Breadcrumbs items={[
        { label: t("nav.home"), href: "/" },
        { label: t("nav.products") },
      ]} />
      <h1 className="text-3xl font-bold text-ink mb-4">
        {t("products.title")}
      </h1>
      <p className="text-muted text-sm sm:text-base max-w-3xl mb-8 leading-relaxed">
        {t("offer.seoIntro")}
      </p>

      <Suspense fallback={<p className="text-muted">{t("offer.loadingProducts")}</p>}>
        <ProductsShowcase userRole={userRole} discountPct={discountPct} initialProducts={allProducts} />
      </Suspense>

      {/* How to choose */}
      <section className="mt-16 border-t border-line pt-10">
        <h2 className="text-xl font-bold text-ink mb-4">{t("offer.howToChooseTitle")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-nude-50 rounded-xl border border-line p-4">
              <h3 className="font-semibold text-ink text-sm mb-1">{t(`offer.choose${i}Title` as any)}</h3>
              <p className="text-xs text-muted leading-relaxed">{t(`offer.choose${i}Desc` as any)}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted">
          {t("offer.howToChooseLinks")}{" "}
          <Link href="/pruvodce-gramazi" className="text-espresso hover:underline font-medium">{t("offer.gramsGuideLink")}</Link>
        </p>
      </section>

      {/* Why Hairland */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-ink mb-4">{t("offer.whyHairlandTitle")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3 bg-nude-50 rounded-xl border border-line p-4">
              <span className="text-green-500 mt-0.5 text-lg flex-shrink-0">&#10003;</span>
              <div>
                <h3 className="font-semibold text-ink text-sm">{t(`offer.why${i}Title` as any)}</h3>
                <p className="text-xs text-muted mt-0.5">{t(`offer.why${i}Desc` as any)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Processing methods */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-ink mb-4">{t("offer.methodsTitle")}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {([
            { href: "/clip-in-vlasy", key: "clipIn" },
            { href: "/tape-in-vlasy", key: "tapeIn" },
            { href: "/keratinove-vlasy", key: "keratin" },
            { href: "/micro-ring-vlasy", key: "microRing" },
            { href: "/tresove-vlasy", key: "weft" },
          ] as const).map((m) => (
            <Link key={m.key} href={m.href} className="bg-white border border-line rounded-xl p-3 text-center hover:border-rose transition-colors">
              <h3 className="font-semibold text-ink text-sm">{t(`offer.method${m.key}Name` as any)}</h3>
              <p className="text-xs text-muted mt-1">{t(`offer.method${m.key}Desc` as any)}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* SEO: Internal links to attribute landing pages */}
      <section className="mt-16 border-t border-line pt-10">
        <h2 className="text-xl font-bold text-ink mb-6">{t("offer.seoHeading")}</h2>
        <p className="text-muted text-sm max-w-3xl mb-8 leading-relaxed">
          {t("offer.seoText")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {/* By origin */}
          <div>
            <h3 className="text-sm font-semibold text-ink mb-3">{t("offer.seoByOrigin")}</h3>
            <ul className="space-y-1.5">
              {originLinks.map((link) => (
                <li key={link.slug}>
                  <Link href={{ pathname: '/vlasy-k-prodlouzeni/[...slug]' as any, params: { slug: ['zeme', link.slug] } }} className="text-sm text-espresso hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* By texture */}
          <div>
            <h3 className="text-sm font-semibold text-ink mb-3">{t("offer.seoByTexture")}</h3>
            <ul className="space-y-1.5">
              {textureLinks.map((link) => (
                <li key={link.slug}>
                  <Link href={{ pathname: '/vlasy-k-prodlouzeni/[...slug]' as any, params: { slug: ['textura', link.slug] } }} className="text-sm text-espresso hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="text-sm font-semibold text-ink mb-3 mt-6">{t("offer.seoByCategory")}</h3>
            <ul className="space-y-1.5">
              {categoryLinks.map((link) => (
                <li key={link.slug}>
                  <Link href={{ pathname: '/vlasy-k-prodlouzeni/[...slug]' as any, params: { slug: ['kategorie', link.slug] } }} className="text-sm text-espresso hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* By length + color */}
          <div>
            <h3 className="text-sm font-semibold text-ink mb-3">{t("offer.seoByLength")}</h3>
            <ul className="space-y-1.5">
              {lengthLinks.map((link) => (
                <li key={link.slug}>
                  <Link href={{ pathname: '/vlasy-k-prodlouzeni/[...slug]' as any, params: { slug: ['delka', link.slug] } }} className="text-sm text-espresso hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="text-sm font-semibold text-ink mb-3 mt-6">{t("offer.seoByColor")}</h3>
            <ul className="space-y-1.5">
              {colorLinks.map((link) => (
                <li key={link.slug}>
                  <Link href={{ pathname: '/vlasy-k-prodlouzeni/[...slug]' as any, params: { slug: ['barva', link.slug] } }} className="text-sm text-espresso hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Useful links */}
        <div className="flex flex-wrap gap-3 mb-10">
          <Link href="/pruvodce-gramazi" className="text-sm font-medium text-espresso hover:underline">
            {t("offer.gramsGuideLink")}
          </Link>
          <Link href="/kontakt" className="text-sm font-medium text-espresso hover:underline">
            {t("offer.contactLink")}
          </Link>
          <Link href={{ pathname: '/poradna/[slug]' as any, params: { slug: 'pece-o-prodlouzene-vlasy' } }} className="text-sm font-medium text-espresso hover:underline">
            {t("offer.careGuideLink")}
          </Link>
        </div>

        {/* FAQ */}
        <h2 className="text-xl font-bold text-ink mb-5">{t("offer.faqHeading")}</h2>
        <div className="space-y-4 max-w-3xl">
          {faqItems.map((item, i) => (
            <details key={i} className="group border border-line rounded-xl">
              <summary className="flex items-center justify-between cursor-pointer px-5 py-4 text-sm font-semibold text-ink">
                {item.q}
                <svg className="w-4 h-4 text-muted transition-transform group-open:rotate-180 flex-shrink-0 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="px-5 pb-4 text-sm text-muted leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
