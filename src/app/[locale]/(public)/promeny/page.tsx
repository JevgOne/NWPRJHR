import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { getAlternates, getOgUrl, OG_LOCALES } from "@/lib/seo";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { TransformationFilter } from "./TransformationFilter";

const NAMESPACE = "promeny";
const PATH = "/promeny";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([
    getTranslations(NAMESPACE),
    getLocale(),
  ]);
  const title = t("metaTitle");
  const desc = t("metaDesc");
  return {
    title,
    description: desc,
    alternates: getAlternates(PATH, locale),
    openGraph: {
      type: "website",
      title: `${title} | Hairland`,
      description: desc,
      url: getOgUrl(PATH, locale),
      siteName: "Hairland",
      locale: OG_LOCALES[locale] ?? "cs_CZ",
      images: [
        {
          url: "https://www.hairland.cz/og/og-offer.jpg",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Hairland`,
      description: desc,
      images: ["https://www.hairland.cz/og/og-offer.jpg"],
    },
  };
}

const getCachedTransformations = unstable_cache(
  async () =>
    prisma.transformation.findMany({
      where: { active: true },
      orderBy: [
        { featured: "desc" },
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    }),
  ["public-transformations"],
  { revalidate: 60, tags: ["transformations"] },
);

const METHOD_LABELS: Record<string, Record<string, string>> = {
  cs: {
    CLIP_IN: "Clip-in",
    TAPE_IN: "Tape-in",
    KERATIN: "Keratin",
    WEFT: "Tresy",
    MICRO_RING: "Micro ring",
    BANGS: "Ofiny",
    OTHER: "Ostatní",
  },
  uk: {
    CLIP_IN: "Clip-in",
    TAPE_IN: "Tape-in",
    KERATIN: "Кератин",
    WEFT: "Тресове",
    MICRO_RING: "Micro ring",
    BANGS: "Чубчики",
    OTHER: "Інше",
  },
  ru: {
    CLIP_IN: "Clip-in",
    TAPE_IN: "Tape-in",
    KERATIN: "Кератин",
    WEFT: "Трессы",
    MICRO_RING: "Micro ring",
    BANGS: "Чёлки",
    OTHER: "Другое",
  },
};

export default async function PromenyPage() {
  const [t, tNav, locale, transformations] = await Promise.all([
    getTranslations(NAMESPACE),
    getTranslations("public.nav"),
    getLocale(),
    getCachedTransformations(),
  ]);

  const methodLabels = METHOD_LABELS[locale] ?? METHOD_LABELS.cs;

  const localize = (
    item: { title: string; titleUk: string | null; titleRu: string | null; description: string | null; descriptionUk: string | null; descriptionRu: string | null },
  ) => ({
    title:
      locale === "uk" && item.titleUk
        ? item.titleUk
        : locale === "ru" && item.titleRu
          ? item.titleRu
          : item.title,
    description:
      locale === "uk" && item.descriptionUk
        ? item.descriptionUk
        : locale === "ru" && item.descriptionRu
          ? item.descriptionRu
          : item.description,
  });

  const localizedItems = transformations.map((item) => {
    const loc = localize(item);
    return {
      id: item.id,
      title: loc.title,
      description: loc.description,
      photoBefore: item.photoBefore,
      photoAfter: item.photoAfter,
      processingType: item.processingType,
      lengthCm: item.lengthCm,
      weightGrams: item.weightGrams,
      hairOrigin: item.hairOrigin,
    };
  });

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Hairland",
        item: "https://www.hairland.cz",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t("heroTitle"),
        item: getOgUrl(PATH, locale),
      },
    ],
  };

  const galleryJsonLd =
    localizedItems.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ImageGallery",
          name: t("heroTitle"),
          description: t("metaDesc"),
          url: getOgUrl(PATH, locale),
          image: localizedItems.map((item) => ({
            "@type": "ImageObject",
            name: item.title,
            contentUrl: item.photoAfter,
          })),
        }
      : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {galleryJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(galleryJsonLd) }}
        />
      )}

      <Breadcrumbs
        items={[
          { label: tNav("home"), href: "/" },
          { label: t("heroTitle") },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight mb-3">
          {t("heroTitle")}
        </h1>
        <p className="text-muted max-w-2xl leading-relaxed">
          {t("heroSubtitle")}
        </p>
      </div>

      {/* Gallery or empty state */}
      {localizedItems.length > 0 ? (
        <section className="mb-14">
          <TransformationFilter
            items={localizedItems}
            methodLabels={methodLabels}
            filterAllLabel={t("filterAll")}
            beforeLabel={t("beforeLabel")}
            afterLabel={t("afterLabel")}
            lengthLabel={t("lengthLabel")}
            weightLabel={t("weightLabel")}
          />
        </section>
      ) : (
        <section className="mb-14 text-center py-16">
          <div className="w-16 h-16 rounded-full bg-rose/10 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-rose"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-ink mb-2">
            {t("emptyTitle")}
          </h2>
          <p className="text-muted text-sm mb-5 max-w-md mx-auto">
            {t("emptyText")}
          </p>
          <a
            href="https://www.instagram.com/hairland.cz/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-5 py-2.5 border border-line text-ink text-sm font-medium rounded-lg hover:bg-nude-100 transition-colors"
          >
            {t("instagramCta")}
          </a>
        </section>
      )}

      {/* CTA */}
      <div className="text-center bg-nude-50 rounded-xl border border-line p-8">
        <h2 className="text-xl font-semibold text-ink mb-2">
          {t("ctaTitle")}
        </h2>
        <p className="text-muted text-sm mb-5 max-w-lg mx-auto">
          {t("ctaText")}
        </p>
        <Link
          href="/vlasy-k-prodlouzeni"
          className="inline-flex items-center justify-center px-6 py-2.5 bg-rose text-white text-sm font-medium rounded-lg hover:bg-rose-deep transition-colors"
        >
          {t("ctaButton")}
        </Link>
      </div>
    </div>
  );
}
