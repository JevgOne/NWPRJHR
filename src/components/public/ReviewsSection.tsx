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
    <section className="py-20 bg-nude-50/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose mb-3">
            {t("reviews.title")}
          </p>
          {hasReviews && avgRating && (
            <>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Stars rating={Math.round(Number(avgRating))} />
              </div>
              <p className="text-sm text-muted">
                {avgRating} / 5 &middot; {t("reviews.reviewCount", { count: reviews.length })}
              </p>
            </>
          )}
          {!hasReviews && (
            <p className="text-muted">{t("reviews.beFirst")}</p>
          )}
        </div>

        {/* Review cards */}
        {hasReviews && (
          <div className={`${displayed.length === 1 ? "max-w-sm mx-auto" : displayed.length === 2 ? "grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"} mb-14`}>
            {displayed.map((review) => (
              <div
                key={review.id}
                className="relative bg-white rounded-xl px-6 py-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-shadow duration-300"
              >
                <div className="flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-3 h-3 ${star <= review.rating ? "text-amber-400" : "text-nude-200"}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                <p className="text-sm text-ink/85 leading-relaxed mb-4">
                  &ldquo;{review.text}&rdquo;
                </p>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-espresso/5 flex items-center justify-center text-espresso font-semibold text-xs">
                    {review.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-xs text-ink block truncate">
                      {review.authorName}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-muted">
                      {review.authorCity && <span>{review.authorCity}</span>}
                      {review.authorCity && review.source && <span>&middot;</span>}
                      <SourceIcon source={review.source} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA buttons */}
        <div className={`${hasReviews ? "" : "mt-8"} flex flex-col sm:flex-row items-center justify-center gap-4`}>
          <Link
            href="/recenze"
            className="inline-flex items-center gap-2 px-8 py-3 bg-espresso hover:bg-ink text-white text-sm font-medium rounded-full transition-colors"
          >
            {t("reviews.writeOurReview")}
          </Link>
          <a
            href="https://g.page/r/CdauuX262QcvEAE/review"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3 text-ink text-sm font-medium rounded-full border border-ink/15 hover:border-ink/30 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              className="text-sm text-muted hover:text-ink font-medium transition-colors"
            >
              {t("reviews.viewAll")} &rarr;
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
