import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { Link } from "@/i18n/navigation";
import { getAlternates, OG_LOCALES } from "@/lib/seo";
import { WriteReviewForm } from "../offer/[...slug]/WriteReviewForm";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("metadata"), getLocale()]);
  return {
    title: t("recenzeTitle"),
    description: t("recenzeDescription"),
    alternates: getAlternates("/recenze"),
    openGraph: {
      type: "website",
      title: `${t("recenzeTitle")} | Hairland`,
      description: t("recenzeDescription"),
      url: "https://www.hairland.cz/recenze",
      siteName: "Hairland",
      locale: OG_LOCALES[locale] ?? "cs_CZ",
      images: [{ url: "https://www.hairland.cz/og/og-recenze.jpg", width: 1200, height: 630, alt: "Hairland" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("recenzeTitle")} | Hairland`,
      description: t("recenzeDescription"),
      images: ["https://www.hairland.cz/og/og-recenze.jpg"],
    },
  };
}

const getReviewData = unstable_cache(
  async () => {
    const [reviews, stats] = await Promise.all([
      prisma.review.findMany({
        where: { active: true },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          authorName: true,
          authorPhoto: true,
          authorCity: true,
          salonName: true,
          rating: true,
          ratingQuality: true,
          ratingCommunication: true,
          ratingSpeed: true,
          text: true,
          source: true,
          sourceUrl: true,
        },
      }),
      prisma.review.aggregate({
        where: { active: true },
        _avg: { rating: true },
        _count: true,
      }),
    ]);
    return { reviews, stats };
  },
  ["public-reviews-page"],
  { revalidate: 60, tags: ["reviews"] }
);

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "w-6 h-6" : "w-4 h-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} className={`${cls} ${star <= rating ? "text-yellow-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function RatingBar({ label, avg, count }: { label: string; avg: number; count: number }) {
  if (count === 0) return null;
  const pct = Math.round((avg / 5) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted w-36 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-blush-100/50 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold text-ink w-12 text-right">{avg.toFixed(1)}/5</span>
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  if (source === "GOOGLE") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
        <svg className="w-3 h-3" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Google
      </span>
    );
  }
  if (source === "INSTAGRAM") {
    return <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-pink-50 text-pink-600">Instagram</span>;
  }
  return <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600">Hairland</span>;
}

type FilterSource = "all" | "GOOGLE" | "INSTAGRAM" | "MANUAL";

function buildFilterUrl(source: FilterSource, stars: number | null): string {
  const params = new URLSearchParams();
  if (source !== "all") params.set("source", source);
  if (stars) params.set("stars", String(stars));
  const qs = params.toString();
  return `/recenze${qs ? `?${qs}` : ""}`;
}

export default async function RecenzePage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; stars?: string }>;
}) {
  const params = await searchParams;
  const t = await getTranslations("public.reviewsPage");
  const { reviews, stats } = await getReviewData();

  const sourceFilter = (params.source as FilterSource) || "all";
  const starFilter = params.stars ? parseInt(params.stars) : null;

  const filtered = reviews.filter((r) => {
    if (sourceFilter !== "all" && r.source !== sourceFilter) return false;
    if (starFilter && r.rating !== starFilter) return false;
    return true;
  });

  const avgRating = stats._avg.rating ?? 0;
  const totalCount = stats._count;

  const qualityRatings = reviews.filter((r) => r.ratingQuality != null);
  const commRatings = reviews.filter((r) => r.ratingCommunication != null);
  const speedRatings = reviews.filter((r) => r.ratingSpeed != null);

  const avgQuality = qualityRatings.length > 0
    ? qualityRatings.reduce((s, r) => s + r.ratingQuality!, 0) / qualityRatings.length : 0;
  const avgComm = commRatings.length > 0
    ? commRatings.reduce((s, r) => s + r.ratingCommunication!, 0) / commRatings.length : 0;
  const avgSpeed = speedRatings.length > 0
    ? speedRatings.reduce((s, r) => s + r.ratingSpeed!, 0) / speedRatings.length : 0;

  const jsonLd = totalCount > 0 ? {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Hairland",
    url: "https://www.hairland.cz",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: avgRating.toFixed(1),
      reviewCount: totalCount,
      bestRating: "5",
      worstRating: "1",
    },
    review: reviews.slice(0, 10).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.authorName },
      reviewRating: {
        "@type": "Rating",
        ratingValue: String(r.rating),
        bestRating: "5",
        worstRating: "1",
      },
      reviewBody: r.text.slice(0, 200),
      ...(r.source === "GOOGLE" && r.sourceUrl ? { url: r.sourceUrl } : {}),
    })),
  } : null;

  const sourceFilters: { key: FilterSource; label: string }[] = [
    { key: "all", label: t("filterAll") },
    { key: "GOOGLE", label: t("filterGoogle") },
    { key: "INSTAGRAM", label: t("filterInstagram") },
    { key: "MANUAL", label: t("filterOur") },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}

      {/* H1 */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-ink mb-3 tracking-tight">{t("title")}</h1>
        <p className="text-muted">{t("subtitle")}</p>
      </div>

      {/* Aggregate overview */}
      {totalCount > 0 && (
        <div className="bg-gradient-to-br from-nude-50 via-white to-blush-50/40 rounded-3xl p-8 sm:p-10 mb-10 border border-blush-100/40 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
            <div className="text-center sm:text-left flex-shrink-0">
              <div className="text-6xl font-bold text-ink tracking-tight">{avgRating.toFixed(1)}</div>
              <Stars rating={Math.round(avgRating)} size="lg" />
              <div className="text-sm text-muted mt-2">
                {totalCount} {t("reviewCount", { count: totalCount })}
              </div>
            </div>
            <div className="flex-1 space-y-4 w-full">
              <RatingBar label={t("qualityLabel")} avg={avgQuality} count={qualityRatings.length} />
              <RatingBar label={t("communicationLabel")} avg={avgComm} count={commRatings.length} />
              <RatingBar label={t("speedLabel")} avg={avgSpeed} count={speedRatings.length} />
            </div>
          </div>
        </div>
      )}

      {/* Filters — server-side via URL params */}
      <div className="flex flex-wrap gap-2 mb-8">
        {sourceFilters.map((f) => (
          <Link
            key={f.key}
            href={buildFilterUrl(f.key, starFilter)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              sourceFilter === f.key
                ? "bg-espresso text-white shadow-sm"
                : "bg-nude-50 text-muted hover:bg-nude-100 hover:text-ink"
            }`}
          >
            {f.label}
          </Link>
        ))}
        <div className="w-px bg-line/50 mx-1" />
        {[5, 4, 3].map((stars) => (
          <Link
            key={stars}
            href={buildFilterUrl(sourceFilter, starFilter === stars ? null : stars)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
              starFilter === stars
                ? "bg-espresso text-white shadow-sm"
                : "bg-nude-50 text-muted hover:bg-nude-100 hover:text-ink"
            }`}
          >
            {stars}
            <svg className={`w-3.5 h-3.5 ${starFilter === stars ? "text-yellow-300" : "text-yellow-400"}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </Link>
        ))}
      </div>

      {/* Review cards — fully server-rendered */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
          {filtered.map((review) => (
            <div key={review.id} className="group relative bg-gradient-to-br from-nude-50 to-blush-50/30 rounded-2xl p-7 border border-blush-100/50 shadow-sm hover:shadow-md transition-shadow">
              <span className="absolute top-5 left-6 text-5xl leading-none text-rose/10 font-serif select-none">&ldquo;</span>

              <div className="pt-5">
                <p className="text-base text-ink leading-relaxed mb-5 italic">{review.text}</p>

                <div className="flex items-center gap-3 mb-1">
                  <Stars rating={review.rating} />
                  {(review.ratingQuality || review.ratingCommunication || review.ratingSpeed) && (
                    <span className="text-[11px] text-muted">
                      {[
                        review.ratingQuality && `${t("qualityLabel")} ${review.ratingQuality}/5`,
                        review.ratingCommunication && `${t("communicationLabel")} ${review.ratingCommunication}/5`,
                        review.ratingSpeed && `${t("speedLabel")} ${review.ratingSpeed}/5`,
                      ].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-blush-100/60">
                  {review.authorPhoto ? (
                    <img src={review.authorPhoto} alt={review.authorName} className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-sm" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-rose/80 to-rose-deep/80 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white">
                      {review.authorName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-ink truncate">{review.authorName}</span>
                      <SourceBadge source={review.source} />
                    </div>
                    {review.authorCity && <div className="text-xs text-muted mt-0.5">{review.authorCity}</div>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 mb-12">
          <div className="text-4xl mb-3 opacity-30">&#x2606;</div>
          <p className="text-muted">{t("noReviews")}</p>
          <p className="text-muted text-sm mt-1">{t("noReviewsDesc")}</p>
        </div>
      )}

      {/* Write review section — asymmetric: form 2/3, Google CTA 1/3 */}
      <div className="border-t border-line/50 pt-12">
        <h2 className="text-xl font-bold text-ink mb-6">{t("writeReview")}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 items-stretch">
          {/* Our review form (only client component — needs interactivity) */}
          <div className="min-h-[160px]">
            <WriteReviewForm />
          </div>

          {/* Google CTA */}
          <a
            href="https://g.page/r/CdauuX262QcvEAE/review"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border border-blue-100/50 hover:shadow-lg transition-all flex flex-col items-center justify-center text-center gap-4 min-h-[160px]"
          >
            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:shadow-md transition-shadow">
              <svg className="w-8 h-8" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </div>
            <div>
              <span className="block text-sm font-semibold text-ink">{t("writeOnGoogle")}</span>
              <span className="block text-xs text-muted mt-1">{t("googleReviews")}</span>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 group-hover:gap-2 transition-all">
              {t("openLink")}
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
