import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Recenze — Hairland.cz",
  description:
    "Přečtěte si recenze zákaznic Hairland na prémiové vlasy k prodloužení. Skutečné zkušenosti s kvalitou, komunikací a dodáním.",
  alternates: { canonical: "/recenze" },
  openGraph: {
    type: "website",
    title: "Recenze zákaznic | Hairland",
    description:
      "Skutečné recenze zákaznic Hairland. Prémiové vlasy k prodloužení — kvalita ověřená stovkami spokojených žen.",
    url: "https://www.hairland.cz/recenze",
    siteName: "Hairland",
    locale: "cs_CZ",
  },
};

const getReviewData = unstable_cache(
  async () => {
    const [reviews, stats] = await Promise.all([
      prisma.review.findMany({
        where: { active: true },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
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
  const cls = size === "lg" ? "w-5 h-5" : "w-4 h-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${cls} ${star <= rating ? "text-yellow-400" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
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
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted w-36 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2.5 bg-nude-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
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
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-pink-50 text-pink-600">
        <svg className="w-3 h-3" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="ig-page" x1="0" y1="24" x2="24" y2="0">
              <stop offset="0%" stopColor="#feda75" />
              <stop offset="25%" stopColor="#fa7e1e" />
              <stop offset="50%" stopColor="#d62976" />
              <stop offset="75%" stopColor="#962fbf" />
              <stop offset="100%" stopColor="#4f5bd5" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="20" height="20" rx="5" stroke="url(#ig-page)" strokeWidth="2" fill="none" />
          <circle cx="12" cy="12" r="5" stroke="url(#ig-page)" strokeWidth="2" fill="none" />
          <circle cx="18" cy="6" r="1.5" fill="url(#ig-page)" />
        </svg>
        Instagram
      </span>
    );
  }
  return null;
}

export default async function RecenzePage() {
  const t = await getTranslations("public.reviewsPage");
  const { reviews, stats } = await getReviewData();

  const avgRating = stats._avg.rating ?? 0;
  const totalCount = stats._count;

  const qualityRatings = reviews.filter((r) => r.ratingQuality != null);
  const commRatings = reviews.filter((r) => r.ratingCommunication != null);
  const speedRatings = reviews.filter((r) => r.ratingSpeed != null);

  const avgQuality = qualityRatings.length > 0
    ? qualityRatings.reduce((s, r) => s + r.ratingQuality!, 0) / qualityRatings.length
    : 0;
  const avgComm = commRatings.length > 0
    ? commRatings.reduce((s, r) => s + r.ratingCommunication!, 0) / commRatings.length
    : 0;
  const avgSpeed = speedRatings.length > 0
    ? speedRatings.reduce((s, r) => s + r.ratingSpeed!, 0) / speedRatings.length
    : 0;

  // AggregateRating JSON-LD
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
  } : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-2">
          {t("title")}
        </h1>
        <p className="text-muted text-sm">
          {t("subtitle")}
        </p>
      </div>

      {/* Aggregate overview */}
      {totalCount > 0 && (
        <div className="bg-nude-50 rounded-2xl p-6 sm:p-8 mb-10">
          <div className="flex flex-col sm:flex-row gap-8">
            <div className="text-center sm:text-left flex-shrink-0">
              <div className="text-5xl font-bold text-ink">{avgRating.toFixed(1)}</div>
              <Stars rating={Math.round(avgRating)} size="lg" />
              <div className="text-sm text-muted mt-1">
                {totalCount} {t("reviewCount", { count: totalCount })}
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <RatingBar label={t("qualityLabel")} avg={avgQuality} count={qualityRatings.length} />
              <RatingBar label={t("communicationLabel")} avg={avgComm} count={commRatings.length} />
              <RatingBar label={t("speedLabel")} avg={avgSpeed} count={speedRatings.length} />
            </div>
          </div>
        </div>
      )}

      {/* Reviews grid */}
      {reviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl p-5 border border-line"
            >
              <div className="flex items-center gap-3 mb-3">
                {review.authorPhoto ? (
                  <img
                    src={review.authorPhoto}
                    alt={review.authorName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blush-100 flex items-center justify-center text-rose font-bold text-sm">
                    {review.authorName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm text-ink truncate">
                      {review.authorName}
                    </span>
                    <SourceBadge source={review.source} />
                  </div>
                  <div className="text-xs text-muted">
                    {[review.salonName, review.authorCity].filter(Boolean).join(" \u2022 ")}
                  </div>
                </div>
              </div>
              <Stars rating={review.rating} />
              {(review.ratingQuality || review.ratingCommunication || review.ratingSpeed) && (
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-xs text-muted">
                  {review.ratingQuality && <span>{t("qualityLabel")} {review.ratingQuality}/5</span>}
                  {review.ratingCommunication && <span>{t("communicationLabel")} {review.ratingCommunication}/5</span>}
                  {review.ratingSpeed && <span>{t("speedLabel")} {review.ratingSpeed}/5</span>}
                </div>
              )}
              <p className="text-sm text-espresso mt-2 leading-relaxed">
                {review.text}
              </p>
              {review.sourceUrl && (
                <a
                  href={review.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-rose hover:underline mt-2"
                >
                  Zdroj
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted py-16">
          {t("noReviews")}
        </div>
      )}

      {/* CTA */}
      <div className="text-center mt-12">
        <Link
          href="/offer"
          className="inline-block px-6 py-3 bg-rose text-white font-medium rounded-xl hover:bg-rose-deep transition-colors"
        >
          {t("writeReview")}
        </Link>
      </div>
    </div>
  );
}
