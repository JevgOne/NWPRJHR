import { prisma } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

async function getReviews() {
  try {
    return await prisma.review.findMany({
      where: { active: true },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 12,
    });
  } catch {
    return [];
  }
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= rating ? "text-yellow-400" : "text-line"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
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
          <linearGradient id="ig-rev" x1="0" y1="24" x2="24" y2="0">
            <stop offset="0%" stopColor="#feda75" />
            <stop offset="25%" stopColor="#fa7e1e" />
            <stop offset="50%" stopColor="#d62976" />
            <stop offset="75%" stopColor="#962fbf" />
            <stop offset="100%" stopColor="#4f5bd5" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="20" height="20" rx="5" stroke="url(#ig-rev)" strokeWidth="2" fill="none" />
        <circle cx="12" cy="12" r="5" stroke="url(#ig-rev)" strokeWidth="2" fill="none" />
        <circle cx="18" cy="6" r="1.5" fill="url(#ig-rev)" />
      </svg>
    );
  }
  return null;
}

export async function ReviewsSection() {
  const t = await getTranslations("public");
  const reviews = await getReviews();

  const hasReviews = reviews.length > 0;
  const featured = reviews.filter((r) => r.featured);
  const rest = reviews.filter((r) => !r.featured);
  const displayed = [...featured, ...rest].slice(0, 6);

  const avgRating = hasReviews
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-ink mb-2">
            {t("reviews.title")}
          </h2>
          {hasReviews && avgRating && (
            <div className="flex items-center justify-center gap-2">
              <Stars rating={Math.round(Number(avgRating))} />
              <span className="text-lg font-bold text-ink">{avgRating}</span>
              <span className="text-sm text-muted">
                ({t("reviews.reviewCount", { count: reviews.length })})
              </span>
            </div>
          )}
          {!hasReviews && (
            <p className="text-sm text-muted">{t("reviews.beFirst")}</p>
          )}
        </div>

        {/* Review cards */}
        {hasReviews && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {displayed.map((review) => (
              <div
                key={review.id}
                className="relative bg-nude-50 rounded-2xl p-5 border border-line"
              >
                {/* Quotation mark */}
                <svg className="absolute top-4 right-4 w-8 h-8 text-blush-100" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11h4v10H0z" />
                </svg>

                <p className="text-sm text-espresso leading-relaxed line-clamp-4 mb-4 relative">
                  {review.text}
                </p>

                <div className="mb-3">
                  <Stars rating={review.rating} />
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-line/50">
                  <div className="w-9 h-9 rounded-full bg-blush-100 flex items-center justify-center text-rose font-bold text-sm">
                    {review.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-ink truncate">
                        {review.authorName}
                      </span>
                      <SourceIcon source={review.source} />
                    </div>
                    {review.authorCity && (
                      <div className="text-xs text-muted">{review.authorCity}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA buttons */}
        <div className={`${hasReviews ? "" : "mt-6"} flex flex-col sm:flex-row items-center justify-center gap-3`}>
          <Link
            href="/recenze"
            className="inline-flex items-center gap-2 px-6 py-3 bg-rose hover:bg-rose-deep text-white text-sm font-medium rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {t("reviews.writeOurReview")}
          </Link>
          <a
            href="https://g.page/r/CdauuX262QcvEAE/review"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-ink text-sm font-medium rounded-xl border border-line hover:shadow-md transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {t("reviews.writeGoogleReview")}
          </a>
          {hasReviews && (
            <Link
              href="/recenze"
              className="text-sm text-rose hover:underline"
            >
              {t("reviews.viewAll")}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
