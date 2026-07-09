import { Link } from "@/i18n/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { getAlternates, OG_LOCALES } from "@/lib/seo";

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  cs: { general: "Obecné", care: "Péče o vlasy", guide: "Průvodce", trends: "Trendy", tips: "Tipy", news: "Novinky" },
  uk: { general: "Загальне", care: "Догляд", guide: "Гід", trends: "Тренди", tips: "Поради", news: "Новини" },
  ru: { general: "Общее", care: "Уход", guide: "Гид", trends: "Тренды", tips: "Советы", news: "Новости" },
};

interface Props {
  params: Promise<{ slug: string }>;
}

function localized<T extends Record<string, unknown>>(
  post: T,
  field: string,
  locale: string
): string {
  if (locale === "ru" && post[`${field}Ru`]) return post[`${field}Ru`] as string;
  if (locale === "uk" && post[`${field}Uk`]) return post[`${field}Uk`] as string;
  return (post[field] as string) ?? "";
}

const getCachedBlogPost = unstable_cache(
  async (slug: string) => {
    return prisma.blogPost.findUnique({ where: { slug } });
  },
  ["blog-post-detail"],
  { revalidate: 300, tags: ["blog"] }
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [post, locale] = await Promise.all([getCachedBlogPost(slug), getLocale()]);
  if (!post) return {};
  const seoTitle = post.metaTitle || post.title;
  const seoDesc = post.metaDescription || post.excerpt || post.title;
  const seoImage = post.ogImage || post.coverImage;
  return {
    title: `${seoTitle} | Blog`,
    description: seoDesc,
    alternates: getAlternates(`/blog/${slug}`),
    openGraph: {
      type: "article",
      title: seoTitle,
      description: seoDesc,
      url: `https://www.hairland.cz/blog/${slug}`,
      siteName: "Hairland",
      locale: OG_LOCALES[locale] ?? "cs_CZ",
      ...(seoImage && {
        images: [{ url: seoImage, alt: seoTitle, width: 1200, height: 630 }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDesc,
      ...(seoImage && { images: [seoImage] }),
    },
  };
}

function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-ink mt-8 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-ink font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-rose hover:underline font-medium">$1</a>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .split(/\n\n+/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("<h") || trimmed.startsWith("<li")) return trimmed;
      if (trimmed.includes("<li>")) {
        return `<ul>${trimmed}</ul>`;
      }
      return `<p>${trimmed.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const locale = await getLocale();
  const post = await getCachedBlogPost(slug);
  if (!post || !post.published) notFound();

  const title = localized(post, "title", locale);
  const excerpt = localized(post, "excerpt", locale);
  const content = localized(post, "content", locale);
  const dateLocale = locale === "uk" ? "uk" : locale === "ru" ? "ru" : "cs";

  const wordCount = content.split(/\s+/).length;
  const readMin = Math.max(1, Math.ceil(wordCount / 200));
  const readLabel = locale === "uk" ? "хв" : locale === "ru" ? "мин" : "min";

  const related = await prisma.blogPost.findMany({
    where: { published: true, id: { not: post.id }, category: post.category },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });
  let relatedPosts = related;
  if (related.length < 3) {
    const more = await prisma.blogPost.findMany({
      where: { published: true, id: { notIn: [post.id, ...related.map((r) => r.id)] } },
      orderBy: { publishedAt: "desc" },
      take: 3 - related.length,
    });
    relatedPosts = [...related, ...more];
  }

  const breadcrumbHome = locale === "uk" ? "Головна" : locale === "ru" ? "Главная" : "Domů";
  const ctaTitle = locale === "uk" ? "Готові до змін?" : locale === "ru" ? "Готовы к переменам?" : "Připravená na proměnu?";
  const ctaDesc = locale === "uk" ? "Перегляньте наші преміальні волосся або замовте безкоштовну консультацію." : locale === "ru" ? "Посмотрите наши премиальные волосы или закажите бесплатную консультацию." : "Prohlédněte si naše prémiové vlasy nebo si objednejte bezplatnou konzultaci.";
  const ctaOfferBtn = locale === "uk" ? "Переглянути колекцію" : locale === "ru" ? "Смотреть коллекцию" : "Prohlédnout kolekci";
  const ctaContactBtn = locale === "uk" ? "Безкоштовна консультація" : locale === "ru" ? "Бесплатная консультация" : "Bezplatná konzultace";
  const relatedLabel = locale === "uk" ? "Читайте також" : locale === "ru" ? "Читайте также" : "Čtěte také";
  const backLabel = locale === "uk" ? "Усі статті" : locale === "ru" ? "Все статьи" : "Zpět na blog";
  const shareLabel = locale === "uk" ? "Поділіться з подругою" : locale === "ru" ? "Поделитесь с подругой" : "Sdílejte s kamarádkou";
  const catLabels = CATEGORY_LABELS[locale] ?? CATEGORY_LABELS.cs;
  const articleUrl = `https://www.hairland.cz/blog/${slug}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description: excerpt || title,
      image: post.coverImage ?? undefined,
      author: { "@type": "Organization", name: "Hairland", url: "https://www.hairland.cz" },
      publisher: {
        "@type": "Organization",
        name: "Hairland",
        url: "https://www.hairland.cz",
        logo: { "@type": "ImageObject", url: "https://www.hairland.cz/og-image.jpg" },
      },
      datePublished: post.publishedAt?.toISOString() ?? post.createdAt.toISOString(),
      dateModified: post.updatedAt.toISOString(),
      mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
      url: articleUrl,
      inLanguage: locale === "uk" ? "uk" : locale === "ru" ? "ru" : "cs",
      wordCount,
      articleSection: catLabels[post.category] ?? post.category,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: breadcrumbHome, item: "https://www.hairland.cz" },
        { "@type": "ListItem", position: 2, name: "Blog", item: "https://www.hairland.cz/blog" },
        { "@type": "ListItem", position: 3, name: title, item: articleUrl },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ===== HERO ===== */}
      {post.coverImage ? (
        <div className="relative bg-ink">
          <div className="aspect-[3/1] sm:aspect-[3/1] max-h-[420px] overflow-hidden relative">
            <Image src={post.coverImage} alt={title} fill className="object-cover opacity-75" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/5" />
          </div>
          <div className="absolute bottom-0 left-0 right-0">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-white backdrop-blur-sm border border-white/10">
                  {catLabels[post.category] ?? post.category}
                </span>
                {post.publishedAt && (
                  <span className="text-sm text-white/60">
                    {new Date(post.publishedAt).toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                )}
                <span className="text-sm text-white/40">{readMin} {readLabel}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-[1.1] tracking-tight drop-shadow-md" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>{title}</h1>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden bg-gradient-to-br from-[#fdf2f0] via-[#fef6f3] to-[#fdf8f5]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-rose/10 to-transparent rounded-full -translate-y-1/3 translate-x-1/4 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blush-100/60 to-transparent rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl" />

          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-14">
            <nav className="flex items-center gap-2 text-sm text-muted/70 mb-10">
              <Link href="/" className="hover:text-rose transition-colors">{breadcrumbHome}</Link>
              <span className="text-rose/30">/</span>
              <Link href="/blog" className="hover:text-rose transition-colors">Blog</Link>
              <span className="text-rose/30">/</span>
              <span className="text-ink/60 truncate">{title}</span>
            </nav>
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-white/80 text-rose border border-rose/10 shadow-sm">
                {catLabels[post.category] ?? post.category}
              </span>
              {post.publishedAt && (
                <span className="text-sm text-muted/60">
                  {new Date(post.publishedAt).toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" })}
                </span>
              )}
              <span className="text-sm text-muted/40">{readMin} {readLabel}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-ink leading-[1.1] tracking-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>{title}</h1>
          </div>
          <svg className="absolute bottom-0 w-full h-8 text-white" viewBox="0 0 1440 32" preserveAspectRatio="none">
            <path d="M0,32 L0,16 Q360,0 720,16 Q1080,32 1440,12 L1440,32 Z" fill="currentColor" />
          </svg>
        </div>
      )}

      {/* ===== BODY ===== */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {post.coverImage && (
          <nav className="flex items-center gap-2 text-sm text-muted/70 mt-6">
            <Link href="/" className="hover:text-rose transition-colors">{breadcrumbHome}</Link>
            <span className="text-rose/30">/</span>
            <Link href="/blog" className="hover:text-rose transition-colors">Blog</Link>
            <span className="text-rose/30">/</span>
            <span className="text-ink/60 truncate">{title}</span>
          </nav>
        )}

        {excerpt && (
          <div className="mt-6 mb-2 flex gap-3">
            <div className="w-[3px] flex-shrink-0 rounded-full bg-gradient-to-b from-rose to-blush-200" />
            <p className="text-lg text-[#7a6b66] leading-relaxed italic">{excerpt}</p>
          </div>
        )}

        {/* Content */}
        <article className="py-8 max-w-none text-[15.5px] text-[#6b5e5a] leading-[1.9]
          [&_h2]:text-[1.35rem] [&_h2]:font-bold [&_h2]:text-ink
          [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:pl-5
          [&_h2]:relative [&_h2]:before:absolute [&_h2]:before:left-0 [&_h2]:before:top-0 [&_h2]:before:bottom-0
          [&_h2]:before:w-[3px] [&_h2]:before:rounded-full [&_h2]:before:bg-gradient-to-b [&_h2]:before:from-rose [&_h2]:before:to-blush-200
          [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-ink [&_h3]:mt-8 [&_h3]:mb-3
          [&_p]:mb-5
          [&_ul]:mb-6 [&_ul]:list-none [&_ul]:pl-0 [&_ul]:space-y-2.5
          [&_li]:relative [&_li]:pl-5 [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-[0.65em]
          [&_li]:before:w-1.5 [&_li]:before:h-1.5 [&_li]:before:rounded-full [&_li]:before:bg-rose/40
          [&_strong]:text-ink [&_strong]:font-semibold
          [&_a]:text-rose [&_a]:hover:underline [&_a]:font-medium"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
        />

        {/* ===== SHARE ===== */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-[#fdf8f6] border border-rose/8">
          <span className="text-sm text-muted/60">{shareLabel}</span>
          <div className="flex items-center gap-2">
            <Link
              href={`https://wa.me/?text=${encodeURIComponent(title + " — " + articleUrl)}`}
              target="_blank"
              className="w-9 h-9 rounded-full bg-white border border-rose/10 flex items-center justify-center text-muted/50 hover:text-green-600 hover:border-green-200 transition-all"
              title="WhatsApp"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </Link>
            <Link
              href={`https://t.me/share/url?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(title)}`}
              target="_blank"
              className="w-9 h-9 rounded-full bg-white border border-rose/10 flex items-center justify-center text-muted/50 hover:text-[#229ED9] hover:border-[#229ED9]/30 transition-all"
              title="Telegram"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            </Link>
            <button
              className="w-9 h-9 rounded-full bg-white border border-rose/10 flex items-center justify-center text-muted/50 hover:text-rose hover:border-rose/30 transition-all"
              title="Copy link"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            </button>
          </div>
        </div>

        {/* ===== CTA ===== */}
        <div className="mt-10 relative overflow-hidden rounded-2xl border border-rose/10">
          <div className="absolute inset-0 bg-gradient-to-br from-[#fdf2f0] via-[#fef6f3] to-rose/5" />
          <div className="absolute -top-20 -right-20 w-56 h-56 bg-rose/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-blush-100/50 rounded-full blur-3xl" />
          <div className="relative px-6 py-10 sm:py-12 text-center">
            <p className="font-extrabold text-ink text-xl sm:text-2xl mb-2" style={{ fontFamily: "Georgia, serif" }}>{ctaTitle}</p>
            <p className="text-sm text-muted/60 mb-7 max-w-md mx-auto">{ctaDesc}</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link
                href="/offer"
                className="px-7 py-3.5 bg-rose hover:bg-rose-deep text-white font-semibold rounded-full transition-all shadow-lg shadow-rose/20 hover:shadow-xl hover:shadow-rose/30 hover:-translate-y-0.5"
              >
                {ctaOfferBtn}
              </Link>
              <Link
                href="/contact"
                className="px-7 py-3.5 bg-white text-ink border border-rose/15 rounded-full font-medium hover:border-rose/30 hover:bg-rose/[0.02] transition-all"
              >
                {ctaContactBtn}
              </Link>
            </div>
          </div>
        </div>

        {/* ===== RELATED ===== */}
        {relatedPosts.length > 0 && (
          <div className="mt-14">
            <h2 className="text-xl font-bold text-ink mb-5" style={{ fontFamily: "Georgia, serif" }}>{relatedLabel}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedPosts.map((r) => (
                <Link
                  key={r.id}
                  href={`/blog/${r.slug}`}
                  className="group block bg-white rounded-2xl border border-line hover:border-rose/20 hover:shadow-lg transition-all overflow-hidden"
                >
                  {r.coverImage ? (
                    <div className="aspect-[16/9] overflow-hidden relative">
                      <Image
                        src={r.coverImage}
                        alt={localized(r, "title", locale)}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/9] bg-gradient-to-br from-[#fdf2f0] to-[#fef8f6] flex items-center justify-center">
                      <svg className="w-8 h-8 text-rose/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                  )}
                  <div className="p-4">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose/8 text-rose mb-2">
                      {catLabels[r.category] ?? r.category}
                    </span>
                    <h3 className="font-semibold text-sm text-ink group-hover:text-rose transition-colors line-clamp-2" style={{ fontFamily: "Georgia, serif" }}>
                      {localized(r, "title", locale)}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back */}
        <div className="mt-10 mb-16 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-muted/60 hover:text-rose bg-[#fdf8f6] hover:bg-rose/5 rounded-full border border-rose/8 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {backLabel}
          </Link>
        </div>
      </div>
    </>
  );
}
