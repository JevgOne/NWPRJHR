import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

interface Props {
  params: Promise<{ slug: string }>;
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
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-ink mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-ink mt-8 mb-3">$1</h2>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-rose hover:underline">$1</a>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    // Paragraphs (double newline)
    .split(/\n\n+/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("<h") || trimmed.startsWith("<li")) return trimmed;
      // Wrap list items in <ul>
      if (trimmed.includes('<li class="ml-4')) {
        return `<ul class="space-y-1 my-3">${trimmed}</ul>`;
      }
      return `<p class="text-muted leading-relaxed mb-4">${trimmed.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post || !post.published) notFound();

  // Get related posts
  const related = await prisma.blogPost.findMany({
    where: { published: true, id: { not: post.id } },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  // Article JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? post.title,
    image: post.coverImage ?? undefined,
    author: { "@type": "Organization", name: "Hairland" },
    publisher: {
      "@type": "Organization",
      name: "Hairland",
      url: "https://www.hairland.cz",
    },
    datePublished: post.publishedAt?.toISOString() ?? post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.hairland.cz/blog/${slug}`,
    },
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted mb-8">
        <Link href="/" className="hover:text-ink transition-colors">
          Domů
        </Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-ink transition-colors">
          Blog
        </Link>
        <span>/</span>
        <span className="text-ink truncate">{post.title}</span>
      </nav>

      {/* Cover image */}
      {post.coverImage && (
        <div className="aspect-[16/9] overflow-hidden rounded-xl mb-8">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Meta */}
      <div className="flex items-center gap-3 mb-4">
        {post.publishedAt && (
          <span className="text-sm text-muted">
            {new Date(post.publishedAt).toLocaleDateString("cs", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        )}
      </div>

      <h1 className="text-3xl font-bold text-ink mb-6">{post.title}</h1>

      {/* Content */}
      <article
        className="prose-hairland"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
      />

      {/* CTA */}
      <div className="mt-12 p-6 bg-nude-50 rounded-xl border border-line text-center">
        <p className="text-ink font-semibold mb-2">
          Máte zájem o prémiové vlasy?
        </p>
        <p className="text-sm text-muted mb-4">
          Prohlédněte si naši nabídku nebo nás kontaktujte pro osobní konzultaci.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/offer"
            className="px-5 py-2.5 bg-rose text-white rounded-lg font-medium hover:bg-rose-deep transition-colors"
          >
            Prohlédnout nabídku
          </Link>
          <Link
            href="/contact"
            className="px-5 py-2.5 bg-white text-espresso border border-line rounded-lg font-medium hover:bg-nude-50 transition-colors"
          >
            Kontaktujte nás
          </Link>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-ink mb-4">
            Další články
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/blog/${r.slug}`}
                className="group block bg-white rounded-xl border border-line hover:border-blush-300 hover:shadow-md transition-all overflow-hidden"
              >
                {r.coverImage && (
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={r.coverImage}
                      alt={r.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-3">
                  <h3 className="font-medium text-sm text-ink group-hover:text-rose transition-colors line-clamp-2">
                    {r.title}
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
          className="text-sm text-muted hover:text-rose transition-colors"
        >
          ← Zpět na blog
        </Link>
      </div>
    </div>
  );
}
