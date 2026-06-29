import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Blog | Hairland",
  description:
    "Články a tipy o prodloužení vlasů, péči, trendech a kvalitě. Rady od odborníků na prémiové vlasy.",
  alternates: { canonical: "/blog" },
};

const CATEGORY_LABELS: Record<string, string> = {
  general: "Obecné",
  care: "Péče o vlasy",
  guide: "Průvodce",
  trends: "Trendy",
  tips: "Tipy",
  news: "Novinky",
};

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-nude-100 text-espresso",
  care: "bg-green-100 text-green-700",
  guide: "bg-amber-100 text-amber-700",
  trends: "bg-purple-100 text-purple-700",
  tips: "bg-blue-100 text-blue-700",
  news: "bg-rose-100 text-rose-700",
};

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-ink mb-3">Blog</h1>
        <p className="text-muted max-w-xl mx-auto">
          Tipy, trendy a odborné rady z&nbsp;oblasti prodloužení a péče o vlasy.
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="text-center text-muted py-12">
          Připravujeme pro vás články. Sledujte nás!
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group block bg-white rounded-xl border border-line hover:border-blush-300 hover:shadow-md transition-all overflow-hidden"
            >
              {post.coverImage && (
                <div className="aspect-[16/9] overflow-hidden">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      CATEGORY_COLORS[post.category] ?? CATEGORY_COLORS.general
                    }`}
                  >
                    {CATEGORY_LABELS[post.category] ?? post.category}
                  </span>
                  {post.publishedAt && (
                    <span className="text-[10px] text-muted">
                      {new Date(post.publishedAt).toLocaleDateString("cs")}
                    </span>
                  )}
                </div>
                <h2 className="font-semibold text-ink group-hover:text-rose transition-colors mb-1">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-sm text-muted line-clamp-2">
                    {post.excerpt}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Link to poradna */}
      <div className="mt-12 text-center">
        <p className="text-muted mb-3">Hledáte praktické návody?</p>
        <Link
          href="/poradna"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-nude-100 text-espresso rounded-lg font-medium hover:bg-nude-200 transition-colors"
        >
          Poradna — průvodce prodloužením vlasů
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
