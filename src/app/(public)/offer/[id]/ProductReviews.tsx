import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { WriteReviewForm } from "./WriteReviewForm";

function MiniStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-px">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={`text-[10px] ${s <= rating ? "text-yellow-400" : "text-gray-300"}`}>★</span>
      ))}
    </span>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3.5 h-3.5 ${star <= rating ? "text-yellow-400" : "text-line"}`}
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
      <span className="text-xs text-muted w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-nude-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-ink w-10 text-right">{avg.toFixed(1)}/5</span>
    </div>
  );
}

function SourceIcon({ source }: { source: string }) {
  if (source === "GOOGLE") {
    return (
      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    );
  }
  if (source === "INSTAGRAM") {
    return (
      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
        <defs>
          <linearGradient id="ig-prod" x1="0" y1="24" x2="24" y2="0">
            <stop offset="0%" stopColor="#feda75" />
            <stop offset="25%" stopColor="#fa7e1e" />
            <stop offset="50%" stopColor="#d62976" />
            <stop offset="75%" stopColor="#962fbf" />
            <stop offset="100%" stopColor="#4f5bd5" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="20" height="20" rx="5" stroke="url(#ig-prod)" strokeWidth="2" fill="none" />
        <circle cx="12" cy="12" r="5" stroke="url(#ig-prod)" strokeWidth="2" fill="none" />
        <circle cx="18" cy="6" r="1.5" fill="url(#ig-prod)" />
      </svg>
    );
  }
  return null;
}

export async function ProductReviews({ productId }: { productId: string }) {
  const t = await getTranslations("public.reviews");

  // Fetch product-specific reviews + global reviews as fallback
  const [productReviews, globalReviews] = await Promise.all([
    prisma.review.findMany({
      where: { active: true, productId },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 10,
    }),
    prisma.review.findMany({
      where: { active: true, productId: null },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 4,
    }),
  ]);

  const reviews = productReviews.length > 0
    ? productReviews
    : globalReviews;

  // Aggregate calculations
  const allForStats = [...productReviews, ...globalReviews];
  const totalCount = allForStats.length;

  const avgRating = totalCount > 0
    ? allForStats.reduce((s, r) => s + r.rating, 0) / totalCount
    : 0;

  const qualityRatings = allForStats.filter((r) => r.ratingQuality != null);
  const commRatings = allForStats.filter((r) => r.ratingCommunication != null);
  const speedRatings = allForStats.filter((r) => r.ratingSpeed != null);

  const avgQuality = qualityRatings.length > 0
    ? qualityRatings.reduce((s, r) => s + r.ratingQuality!, 0) / qualityRatings.length
    : 0;
  const avgComm = commRatings.length > 0
    ? commRatings.reduce((s, r) => s + r.ratingCommunication!, 0) / commRatings.length
    : 0;
  const avgSpeed = speedRatings.length > 0
    ? speedRatings.reduce((s, r) => s + r.ratingSpeed!, 0) / speedRatings.length
    : 0;

  return (
    <div className="mt-10 border-t border-line pt-8">
      <h2 className="text-lg font-bold text-ink mb-5">
        {t("title")}
      </h2>

      {/* Aggregate rating overview */}
      {totalCount > 0 && (
        <div className="bg-nude-50 rounded-2xl p-5 mb-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Left: big number */}
            <div className="text-center sm:text-left flex-shrink-0">
              <div className="text-4xl font-bold text-ink">{avgRating.toFixed(1)}</div>
              <Stars rating={Math.round(avgRating)} />
              <div className="text-xs text-muted mt-1">
                {totalCount} {t("reviewCount", { count: totalCount })}
              </div>
            </div>

            {/* Right: category bars */}
            <div className="flex-1 space-y-2">
              <RatingBar label={t("qualityLabel")} avg={avgQuality} count={qualityRatings.length} />
              <RatingBar label={t("communicationLabel")} avg={avgComm} count={commRatings.length} />
              <RatingBar label={t("speedLabel")} avg={avgSpeed} count={speedRatings.length} />
            </div>
          </div>
        </div>
      )}

      {/* Review cards */}
      {reviews.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl p-4 border border-line"
            >
              <div className="flex items-center gap-2.5 mb-2">
                {review.authorPhoto ? (
                  <img
                    src={review.authorPhoto}
                    alt={review.authorName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blush-100 flex items-center justify-center text-rose font-bold text-xs">
                    {review.authorName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm text-ink truncate">
                      {review.authorName}
                    </span>
                    <SourceIcon source={review.source} />
                  </div>
                  <div className="text-xs text-muted">
                    {[review.salonName, review.authorCity].filter(Boolean).join(" • ")}
                  </div>
                </div>
              </div>
              <Stars rating={review.rating} />
              {(review.ratingQuality || review.ratingCommunication || review.ratingSpeed) && (
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted">
                  {review.ratingQuality && <span>✨ {review.ratingQuality}/5</span>}
                  {review.ratingCommunication && <span>💬 {review.ratingCommunication}/5</span>}
                  {review.ratingSpeed && <span>📦 {review.ratingSpeed}/5</span>}
                </div>
              )}
              <p className="text-sm text-espresso mt-1.5 leading-relaxed line-clamp-3">
                {review.text}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Write review form */}
      <WriteReviewForm productId={productId} />
    </div>
  );
}
