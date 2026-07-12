import { Link } from "@/i18n/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { getAlternates, OG_LOCALES } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("metadata"), getLocale()]);
  return {
    title: t("blogTitle"),
    description: t("blogDescription"),
    alternates: getAlternates("/blog"),
    openGraph: {
      type: "website",
      title: `${t("blogTitle")} | Hairland`,
      description: t("blogDescription"),
      url: "https://www.hairland.cz/blog",
      siteName: "Hairland",
      locale: OG_LOCALES[locale] ?? "cs_CZ",
      images: [
        {
          url: "https://www.hairland.cz/hero-vzornik.png",
          width: 735,
          height: 707,
          alt: "Hairland — prémiové vlasy k prodloužení",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("blogTitle")} | Hairland`,
      description: t("blogDescription"),
      images: ["https://www.hairland.cz/hero-vzornik.png"],
    },
  };
}

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  cs: { general: "Obecné", care: "Péče o vlasy", guide: "Průvodce", trends: "Trendy", tips: "Tipy", news: "Novinky" },
  uk: { general: "Загальне", care: "Догляд", guide: "Гід", trends: "Тренди", tips: "Поради", news: "Новини" },
  ru: { general: "Общее", care: "Уход", guide: "Гид", trends: "Тренды", tips: "Советы", news: "Новости" },
};

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-nude-100 text-espresso",
  care: "bg-green-100 text-green-700",
  guide: "bg-amber-100 text-amber-700",
  trends: "bg-purple-100 text-purple-700",
  tips: "bg-blue-100 text-blue-700",
  news: "bg-rose-100 text-rose-700",
};

function localized<T extends Record<string, unknown>>(
  post: T,
  field: string,
  locale: string
): string {
  if (locale === "ru" && post[`${field}Ru`]) return post[`${field}Ru`] as string;
  if (locale === "uk" && post[`${field}Uk`]) return post[`${field}Uk`] as string;
  return (post[field] as string) ?? "";
}

const getCachedBlogPosts = unstable_cache(
  async () => {
    return prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
    });
  },
  ["blog-posts-listing"],
  { revalidate: 300, tags: ["blog"] }
);

export default async function BlogPage() {
  const [locale, tNav] = await Promise.all([getLocale(), getTranslations("public.nav")]);
  const posts = await getCachedBlogPosts();
  const catLabels = CATEGORY_LABELS[locale] ?? CATEGORY_LABELS.cs;
  const dateLocale = locale === "uk" ? "uk" : locale === "ru" ? "ru" : "cs";

  const subtitle = locale === "uk"
    ? "Тренди, поради та новини зі світу преміального волосся"
    : locale === "ru"
      ? "Тренды, советы и новости из мира премиальных волос"
      : "Trendy, tipy a novinky ze světa prémiových vlasů";
  const emptyMsg = locale === "uk"
    ? "Ми готуємо для вас статті. Слідкуйте за нами!"
    : locale === "ru"
      ? "Мы готовим для вас статьи. Следите за нами!"
      : "Připravujeme pro vás články. Sledujte nás!";
  const readMore = locale === "uk" ? "Читати" : locale === "ru" ? "Читать" : "Číst více";
  const poradnaLabel = locale === "uk" ? "Шукаєте практичні поради?" : locale === "ru" ? "Ищете практические советы?" : "Hledáte praktické návody?";
  const poradnaCta = locale === "uk" ? "Poradna — гід з нарощування" : locale === "ru" ? "Poradna — гид по наращиванию" : "Poradna — průvodce prodloužením";

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Blog | Hairland",
    description: subtitle,
    inLanguage: locale,
    url: "https://www.hairland.cz/blog",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://www.hairland.cz/blog/${p.slug}`,
        name: localized(p, "title", locale),
      })),
    },
  };

  // Split into featured (first) and rest
  const [featured, ...rest] = posts;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <Breadcrumbs items={[
        { label: tNav("home"), href: "/" },
        { label: "Blog" },
      ]} />
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-ink mb-2">Blog</h1>
        <p className="text-muted text-lg">{subtitle}</p>
      </div>

      {posts.length === 0 ? (
        <p className="text-center text-muted py-12">{emptyMsg}</p>
      ) : (
        <>
          {/* Featured article — large hero card */}
          {featured && (
            <Link
              href={`/blog/${featured.slug}`}
              className="group block mb-10 rounded-2xl overflow-hidden bg-white border border-line hover:border-blush-300 hover:shadow-lg transition-all"
            >
              <div className="grid grid-cols-1 md:grid-cols-2">
                {featured.coverImage ? (
                  <div className="aspect-[4/3] md:aspect-auto overflow-hidden relative">
                    <Image
                      src={featured.coverImage}
                      alt={localized(featured, "title", locale)}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      priority
                    />
                  </div>
                ) : (
                  <div className="aspect-[4/3] md:aspect-auto bg-gradient-to-br from-blush-50 to-nude-100 flex items-center justify-center">
                    <svg className="w-16 h-16 text-blush-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                )}
                <div className="p-6 md:p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${CATEGORY_COLORS[featured.category] ?? CATEGORY_COLORS.general}`}>
                      {catLabels[featured.category] ?? featured.category}
                    </span>
                    {featured.publishedAt && (
                      <span className="text-xs text-muted">
                        {new Date(featured.publishedAt).toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-ink group-hover:text-rose transition-colors mb-3 leading-snug">
                    {localized(featured, "title", locale)}
                  </h2>
                  {localized(featured, "excerpt", locale) && (
                    <p className="text-muted leading-relaxed mb-4 line-clamp-3">
                      {localized(featured, "excerpt", locale)}
                    </p>
                  )}
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-rose group-hover:gap-2 transition-all">
                    {readMore}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          )}

          {/* Rest of articles — grid */}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col bg-white rounded-xl border border-line hover:border-blush-300 hover:shadow-md transition-all overflow-hidden"
                >
                  {post.coverImage ? (
                    <div className="aspect-[16/9] overflow-hidden relative">
                      <Image
                        src={post.coverImage}
                        alt={localized(post, "title", locale)}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/9] bg-gradient-to-br from-nude-50 to-blush-50 flex items-center justify-center">
                      <svg className="w-10 h-10 text-blush-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                  )}
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${CATEGORY_COLORS[post.category] ?? CATEGORY_COLORS.general}`}>
                        {catLabels[post.category] ?? post.category}
                      </span>
                      {post.publishedAt && (
                        <span className="text-[10px] text-muted">
                          {new Date(post.publishedAt).toLocaleDateString(dateLocale)}
                        </span>
                      )}
                    </div>
                    <h2 className="font-semibold text-ink group-hover:text-rose transition-colors mb-1 line-clamp-2">
                      {localized(post, "title", locale)}
                    </h2>
                    {localized(post, "excerpt", locale) && (
                      <p className="text-sm text-muted line-clamp-2 flex-1">
                        {localized(post, "excerpt", locale)}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* Product type discovery */}
      <div className="mt-14 border-t border-line/50 pt-10">
        <h2 className="text-lg font-bold text-ink mb-5">
          {locale === "uk" ? "Наші типи волосся" : locale === "ru" ? "Наши типы волос" : "Naše typy vlasů"}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {([
            { href: "/clip-in", label: { cs: "Clip-in", uk: "Clip-in", ru: "Clip-in" } as Record<string, string> },
            { href: "/tape-in", label: { cs: "Tape-in", uk: "Tape-in", ru: "Tape-in" } as Record<string, string> },
            { href: "/keratin", label: { cs: "Keratin", uk: "Кератин", ru: "Кератин" } as Record<string, string> },
            { href: "/micro-ring", label: { cs: "Micro-ring", uk: "Micro-ring", ru: "Micro-ring" } as Record<string, string> },
            { href: "/tresove-vlasy", label: { cs: "Třesové vlasy", uk: "Тресове волосся", ru: "Трессовые волосы" } as Record<string, string> },
          ]).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border border-line hover:border-rose/20 hover:shadow-md transition-all text-sm font-medium text-ink hover:text-rose"
            >
              {item.label[locale] ?? item.label.cs}
              <svg className="w-3.5 h-3.5 text-muted/30 group-hover:text-rose/60 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

      {/* Link to poradna */}
      <div className="mt-10 text-center">
        <p className="text-muted mb-3">{poradnaLabel}</p>
        <Link
          href="/poradna"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-nude-100 text-espresso rounded-lg font-medium hover:bg-nude-200 transition-colors"
        >
          {poradnaCta}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
