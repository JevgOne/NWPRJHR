import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { prisma } from "@/lib/db";

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  cs: { general: "Obecné", care: "Péče o vlasy", guide: "Průvodce", trends: "Trendy", tips: "Tipy", news: "Novinky" },
  uk: { general: "Загальне", care: "Догляд", guide: "Гід", trends: "Тренди", tips: "Поради", news: "Новини" },
  ru: { general: "Общее", care: "Уход", guide: "Гид", trends: "Тренды", tips: "Советы", news: "Новости" },
};

const CATEGORY_COLORS: Record<string, { badge: string; accent: string }> = {
  general: { badge: "bg-nude-100 text-espresso", accent: "from-amber-400 to-amber-200" },
  care: { badge: "bg-green-100 text-green-700", accent: "from-green-400 to-green-200" },
  guide: { badge: "bg-amber-100 text-amber-700", accent: "from-blue-400 to-blue-200" },
  trends: { badge: "bg-purple-100 text-purple-700", accent: "from-purple-400 to-purple-200" },
  tips: { badge: "bg-blue-100 text-blue-700", accent: "from-sky-400 to-sky-200" },
  news: { badge: "bg-rose-100 text-rose-700", accent: "from-rose-400 to-rose-200" },
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    select: { title: true, excerpt: true },
  });
  if (!post) return {};
  return {
    title: `${post.title} | Blog | Hairland`,
    description: post.excerpt ?? post.title,
    alternates: { canonical: `/blog/${slug}` },
  };
}

function renderMarkdown(md: string, accentGradient: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-ink mt-8 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm, `<h2 class="relative text-xl font-bold text-ink mt-12 mb-4 pl-4 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:rounded-full before:bg-gradient-to-b before:${accentGradient}">$1</h2>`)
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-ink font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-rose hover:underline font-medium">$1</a>')
    .replace(/^- (.+)$/gm, '<li class="relative pl-6 before:absolute before:left-0 before:top-[0.6em] before:w-2 before:h-2 before:rounded-full before:bg-blush-200">$1</li>')
    .split(/\n\n+/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("<h") || trimmed.startsWith("<li")) return trimmed;
      if (trimmed.includes("before:bg-blush")) {
        return `<ul class="space-y-3 my-6 list-none pl-0">${trimmed}</ul>`;
      }
      return `<p class="mb-5">${trimmed.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const locale = await getLocale();
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post || !post.published) notFound();

  const title = localized(post, "title", locale);
  const excerpt = localized(post, "excerpt", locale);
  const content = localized(post, "content", locale);
  const dateLocale = locale === "uk" ? "uk" : locale === "ru" ? "ru" : "cs";
  const catStyle = CATEGORY_COLORS[post.category] ?? CATEGORY_COLORS.general;

  const wordCount = content.split(/\s+/).length;
  const readMin = Math.max(1, Math.ceil(wordCount / 200));
  const readLabel = locale === "uk" ? "хв читання" : locale === "ru" ? "мин чтения" : "min čtení";

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: excerpt || title,
    image: post.coverImage ?? undefined,
    author: { "@type": "Organization", name: "Hairland" },
    publisher: { "@type": "Organization", name: "Hairland", url: "https://www.hairland.cz" },
    datePublished: post.publishedAt?.toISOString() ?? post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://www.hairland.cz/blog/${slug}` },
  };

  const breadcrumbHome = locale === "uk" ? "Головна" : locale === "ru" ? "Главная" : "Domů";
  const ctaTitle = locale === "uk" ? "Цікавить преміальне волосся?" : locale === "ru" ? "Интересуют премиальные волосы?" : "Máte zájem o prémiové vlasy?";
  const ctaDesc = locale === "uk" ? "Перегляньте нашу пропозицію або зв\u2019яжіться з нами." : locale === "ru" ? "Посмотрите наше предложение или свяжитесь с нами." : "Prohlédněte si naši nabídku nebo nás kontaktujte.";
  const ctaOfferBtn = locale === "uk" ? "Переглянути" : locale === "ru" ? "Смотреть" : "Prohlédnout nabídku";
  const ctaContactBtn = locale === "uk" ? "Зв\u2019язатися" : locale === "ru" ? "Связаться" : "Kontaktujte nás";
  const relatedLabel = locale === "uk" ? "Схожі статті" : locale === "ru" ? "Похожие статьи" : "Čtěte také";
  const backLabel = locale === "uk" ? "Усі статті" : locale === "ru" ? "Все статьи" : "Zpět na blog";
  const catLabels = CATEGORY_LABELS[locale] ?? CATEGORY_LABELS.cs;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ===== HERO ===== */}
      {post.coverImage ? (
        <div className="relative bg-ink">
          <div className="aspect-[3/1] sm:aspect-[3/1] max-h-[420px] overflow-hidden">
            <img src={post.coverImage} alt={title} className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
          </div>
          <div className="absolute bottom-0 left-0 right-0">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-sm border border-white/10">
                  {catLabels[post.category] ?? post.category}
                </span>
                {post.publishedAt && (
                  <span className="text-sm text-white/70">
                    {new Date(post.publishedAt).toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                )}
                <span className="text-sm text-white/50">{readMin} {readLabel}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-[1.15] tracking-tight drop-shadow-md">{title}</h1>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-b from-blush-50 via-rose/5 to-white border-b border-black/5">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
            <nav className="flex items-center gap-2 text-sm text-muted mb-8">
              <Link href="/" className="hover:text-ink transition-colors">{breadcrumbHome}</Link>
              <svg className="w-3 h-3 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              <Link href="/blog" className="hover:text-ink transition-colors">Blog</Link>
              <svg className="w-3 h-3 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              <span className="text-ink truncate">{title}</span>
            </nav>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${catStyle.badge}`}>
                {catLabels[post.category] ?? post.category}
              </span>
              {post.publishedAt && (
                <span className="text-sm text-muted">
                  {new Date(post.publishedAt).toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" })}
                </span>
              )}
              <span className="text-sm text-muted/50">{readMin} {readLabel}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-ink leading-[1.15] tracking-tight">{title}</h1>
          </div>
        </div>
      )}

      {/* ===== BODY ===== */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb below cover */}
        {post.coverImage && (
          <nav className="flex items-center gap-2 text-sm text-muted mt-6">
            <Link href="/" className="hover:text-ink transition-colors">{breadcrumbHome}</Link>
            <svg className="w-3 h-3 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            <Link href="/blog" className="hover:text-ink transition-colors">Blog</Link>
            <svg className="w-3 h-3 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            <span className="text-ink truncate">{title}</span>
          </nav>
        )}

        {/* Excerpt */}
        {excerpt && (
          <div className="mt-6 mb-2 flex gap-3">
            <div className={`w-1 flex-shrink-0 rounded-full bg-gradient-to-b ${catStyle.accent}`} />
            <p className="text-lg text-muted leading-relaxed italic">{excerpt}</p>
          </div>
        )}

        {/* Content */}
        <article
          className="py-8 max-w-none text-[15px] text-muted/90 leading-[1.85]"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(content, catStyle.accent) }}
        />

        {/* CTA */}
        <div className="relative overflow-hidden p-8 bg-gradient-to-br from-nude-50 via-blush-50 to-rose/5 rounded-2xl border border-blush-100 text-center">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose/5 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blush-100/50 rounded-full blur-2xl" />
          <div className="relative">
            <p className="text-ink font-bold text-lg mb-1">{ctaTitle}</p>
            <p className="text-sm text-muted mb-5">{ctaDesc}</p>
            <div className="flex justify-center gap-3">
              <Link
                href="/offer"
                className="px-6 py-3 bg-rose text-white rounded-xl font-semibold hover:bg-rose-deep transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                {ctaOfferBtn}
              </Link>
              <Link
                href="/contact"
                className="px-6 py-3 bg-white text-espresso border border-line rounded-xl font-medium hover:bg-nude-50 transition-colors"
              >
                {ctaContactBtn}
              </Link>
            </div>
          </div>
        </div>

        {/* Related */}
        {relatedPosts.length > 0 && (
          <div className="mt-14">
            <h2 className="text-xl font-bold text-ink mb-5">{relatedLabel}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedPosts.map((r) => {
                const rStyle = CATEGORY_COLORS[r.category] ?? CATEGORY_COLORS.general;
                return (
                  <Link
                    key={r.id}
                    href={`/blog/${r.slug}`}
                    className="group block bg-white rounded-2xl border border-line hover:border-blush-200 hover:shadow-lg transition-all overflow-hidden"
                  >
                    {r.coverImage ? (
                      <div className="aspect-[16/9] overflow-hidden">
                        <img
                          src={r.coverImage}
                          alt={localized(r, "title", locale)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[16/9] bg-gradient-to-br from-nude-50 to-blush-50 flex items-center justify-center">
                        <svg className="w-8 h-8 text-blush-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                      </div>
                    )}
                    <div className="p-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mb-2 ${rStyle.badge}`}>
                        {catLabels[r.category] ?? r.category}
                      </span>
                      <h3 className="font-semibold text-sm text-ink group-hover:text-rose transition-colors line-clamp-2">
                        {localized(r, "title", locale)}
                      </h3>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Back link */}
        <div className="mt-10 mb-16 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-muted hover:text-rose bg-nude-50 hover:bg-nude-100 rounded-xl transition-all"
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
