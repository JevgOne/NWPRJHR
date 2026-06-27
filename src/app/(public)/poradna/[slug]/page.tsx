import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { articles } from "../articles";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) return {};
  const t = await getTranslations("advice");
  return {
    title: t(article.titleKey as "typesTitle"),
    description: t(article.descKey as "typesDesc"),
    alternates: { canonical: `/poradna/${slug}` },
  };
}

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) notFound();

  const t = await getTranslations("advice");
  const contentKey = `${slug.replace(/-/g, "_")}_content` as "typesTitle";

  const currentIdx = articles.findIndex((a) => a.slug === slug);
  const prev = currentIdx > 0 ? articles[currentIdx - 1] : null;
  const next = currentIdx < articles.length - 1 ? articles[currentIdx + 1] : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Link
        href="/poradna"
        className="text-sm text-rose hover:text-rose-deep transition-colors mb-6 inline-block"
      >
        &larr; {t("backToList")}
      </Link>

      <article>
        <h1 className="text-2xl lg:text-3xl font-bold text-ink mb-4">
          {t(article.titleKey as "typesTitle")}
        </h1>
        <div className="flex items-center gap-3 mb-8 text-sm text-muted">
          <span>{article.readMin} min</span>
        </div>

        <div className="prose prose-sm max-w-none text-muted [&_h2]:text-ink [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-ink [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1 [&_strong]:text-ink">
          <div dangerouslySetInnerHTML={{ __html: t.markup(contentKey, {
            h2: (chunks) => `<h2>${chunks}</h2>`,
            p: (chunks) => `<p>${chunks}</p>`,
            ul: (chunks) => `<ul>${chunks}</ul>`,
            li: (chunks) => `<li>${chunks}</li>`,
            strong: (chunks) => `<strong>${chunks}</strong>`,
          }) }} />
        </div>
      </article>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-12 pt-6 border-t border-line">
        {prev ? (
          <Link href={`/poradna/${prev.slug}`} className="text-sm text-rose hover:text-rose-deep transition-colors">
            &larr; {t(prev.titleKey as "typesTitle")}
          </Link>
        ) : <span />}
        {next ? (
          <Link href={`/poradna/${next.slug}`} className="text-sm text-rose hover:text-rose-deep transition-colors text-right">
            {t(next.titleKey as "typesTitle")} &rarr;
          </Link>
        ) : <span />}
      </div>

      {/* CTA */}
      <div className="mt-12 bg-nude-50 rounded-xl p-6 text-center">
        <p className="font-semibold text-ink mb-2">{t("articleCta")}</p>
        <Link
          href="/offer"
          className="inline-block px-5 py-2.5 bg-rose hover:bg-rose-deep text-white text-sm font-medium rounded-lg transition-colors"
        >
          {t("articleCtaButton")}
        </Link>
      </div>
    </div>
  );
}
