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

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-nude-100 text-espresso",
  care: "bg-green-100 text-green-700",
  guide: "bg-amber-100 text-amber-700",
  trends: "bg-purple-100 text-purple-700",
  tips: "bg-blue-100 text-blue-700",
  news: "bg-rose-100 text-rose-700",
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

function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-ink mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-ink mt-8 mb-3">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-rose hover:underline">$1</a>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .split(/\n\n+/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("<h") || trimmed.startsWith("<li")) return trimmed;
      if (trimmed.includes('<li class="ml-4')) {
        return `<ul class="space-y-1 my-3">${trimmed}</ul>`;
      }
      return `<p class="text-muted leading-relaxed mb-4">${trimmed.replace(/\n/g, "<br/>")}</p>`;
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

  const related = await prisma.blogPost.findMany({
    where: { published: true, id: { not: post.id }, category: post.category },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  // If not enough same-category, fill with recent
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
  const ctaDesc = locale === "uk" ? "Перегляньте нашу пропозицію або зв\u2019яжіться з нами для консультації." : locale === "ru" ? "Посмотрите наше предложение или свяжитесь с нами для консультации." : "Prohlédněte si naši nabídku nebo nás kontaktujte pro osobní konzultaci.";
  const ctaOfferBtn = locale === "uk" ? "Переглянути пропозицію" : locale === "ru" ? "Смотреть предложение" : "Prohlédnout nabídku";
  const ctaContactBtn = locale === "uk" ? "Зв\u2019язатися" : locale === "ru" ? "Связаться" : "Kontaktujte nás";
  const relatedTitle = locale === "uk" ? "Схожі статті" : locale === "ru" ? "Похожие статьи" : "Další články";
  const backLabel = locale === "uk" ? "Усі статті" : locale === "ru" ? "Все статьи" : "Zpět na blog";
  const catLabels = CATEGORY_LABELS[locale] ?? CATEGORY_LABELS.cs;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted mb-8">
        <Link href="/" className="hover:text-ink transition-colors">{breadcrumbHome}</Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-ink transition-colors">Blog</Link>
        <span>/</span>
        <span className="text-ink truncate">{title}</span>
      </nav>

      {/* Cover image */}
      {post.coverImage && (
        <div className="aspect-[2/1] overflow-hidden rounded-2xl mb-8 shadow-sm">
          <img
            src={post.coverImage}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Category + Date badge */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${CATEGORY_COLORS[post.category] ?? CATEGORY_COLORS.general}`}>
          {catLabels[post.category] ?? post.category}
        </span>
        {post.publishedAt && (
          <span className="text-sm text-muted">
            {new Date(post.publishedAt).toLocaleDateString(dateLocale, {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        )}
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-ink mb-4 leading-tight">{title}</h1>

      {excerpt && (
        <p className="text-lg text-muted mb-8 leading-relaxed border-l-4 border-blush-200 pl-4">{excerpt}</p>
      )}

      {/* Content */}
      <article
        className="prose-hairland"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      />

      {/* CTA */}
      <div className="mt-12 p-6 bg-gradient-to-br from-nude-50 to-blush-50 rounded-2xl border border-blush-100 text-center">
        <p className="text-ink font-semibold mb-2">{ctaTitle}</p>
        <p className="text-sm text-muted mb-4">{ctaDesc}</p>
        <div className="flex justify-center gap-3">
          <Link
            href="/offer"
            className="px-5 py-2.5 bg-rose text-white rounded-lg font-medium hover:bg-rose-deep transition-colors"
          >
            {ctaOfferBtn}
          </Link>
          <Link
            href="/contact"
            className="px-5 py-2.5 bg-white text-espresso border border-line rounded-lg font-medium hover:bg-nude-50 transition-colors"
          >
            {ctaContactBtn}
          </Link>
        </div>
      </div>

      {/* Related */}
      {relatedPosts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-ink mb-4">{relatedTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedPosts.map((r) => (
              <Link
                key={r.id}
                href={`/blog/${r.slug}`}
                className="group block bg-white rounded-xl border border-line hover:border-blush-300 hover:shadow-md transition-all overflow-hidden"
              >
                {r.coverImage && (
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={r.coverImage}
                      alt={localized(r, "title", locale)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold mb-1.5 ${CATEGORY_COLORS[r.category] ?? CATEGORY_COLORS.general}`}>
                    {catLabels[r.category] ?? r.category}
                  </span>
                  <h3 className="font-medium text-sm text-ink group-hover:text-rose transition-colors line-clamp-2">
                    {localized(r, "title", locale)}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Back link */}
      <div className="mt-8 text-center">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-rose transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {backLabel}
        </Link>
      </div>
    </div>
  );
}
