"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import confetti from "canvas-confetti";

interface Review {
  id: string;
  authorName: string;
  authorPhoto: string | null;
  authorCity: string | null;
  salonName: string | null;
  rating: number;
  ratingQuality: number | null;
  ratingCommunication: number | null;
  ratingSpeed: number | null;
  text: string;
  source: string;
  sourceUrl: string | null;
}

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "w-5 h-5" : "w-4 h-4";
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

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" onClick={() => onChange(star)} className={`text-xl transition-colors ${star <= value ? "text-yellow-400" : "text-gray-300 hover:text-yellow-200"}`}>★</button>
      ))}
    </div>
  );
}

function SubStarPicker({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" onClick={() => onChange(star)} className={`text-base transition-colors ${star <= (value ?? 0) ? "text-yellow-400" : "text-gray-300 hover:text-yellow-200"}`}>★</button>
      ))}
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
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-pink-50 text-pink-600">IG</span>
    );
  }
  return (
    <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600">Hairland</span>
  );
}

type FilterSource = "all" | "GOOGLE" | "INSTAGRAM" | "MANUAL";

export function ReviewsClient({ reviews }: { reviews: Review[] }) {
  const t = useTranslations("public.reviewsPage");
  const tForm = useTranslations("public.reviewForm");

  const [sourceFilter, setSourceFilter] = useState<FilterSource>("all");
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [rating, setRating] = useState(5);
  const [ratingQuality, setRatingQuality] = useState<number | null>(null);
  const [ratingCommunication, setRatingCommunication] = useState<number | null>(null);
  const [ratingSpeed, setRatingSpeed] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const filtered = reviews.filter((r) => {
    if (sourceFilter !== "all" && r.source !== sourceFilter) return false;
    if (starFilter && r.rating !== starFilter) return false;
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim() || text.length < 5) return;
    setSending(true);
    try {
      const res = await fetch("/api/public/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: name.trim(),
          authorCity: city.trim() || undefined,
          rating,
          ratingQuality,
          ratingCommunication,
          ratingSpeed,
          text: text.trim(),
        }),
      });
      if (res.ok) setSent(true);
    } catch {}
    setSending(false);
  };

  useEffect(() => {
    if (sent) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }
  }, [sent]);

  const sourceFilters: { key: FilterSource; label: string }[] = [
    { key: "all", label: t("filterAll") },
    { key: "GOOGLE", label: t("filterGoogle") },
    { key: "INSTAGRAM", label: t("filterInstagram") },
    { key: "MANUAL", label: t("filterOur") },
  ];

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {sourceFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => setSourceFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              sourceFilter === f.key
                ? "bg-espresso text-white"
                : "bg-nude-50 text-muted hover:bg-nude-100"
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="w-px bg-line mx-1" />
        {[5, 4, 3].map((stars) => (
          <button
            key={stars}
            onClick={() => setStarFilter(starFilter === stars ? null : stars)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
              starFilter === stars
                ? "bg-espresso text-white"
                : "bg-nude-50 text-muted hover:bg-nude-100"
            }`}
          >
            {stars}
            <svg className={`w-3.5 h-3.5 ${starFilter === stars ? "text-yellow-300" : "text-yellow-400"}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>

      {/* Review cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {filtered.map((review) => (
            <div key={review.id} className="relative bg-nude-50 rounded-2xl p-5 border border-line">
              <svg className="absolute top-4 right-4 w-8 h-8 text-blush-100" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11h4v10H0z" />
              </svg>

              <p className="text-sm text-espresso leading-relaxed mb-4 relative">{review.text}</p>

              <div className="flex items-center gap-2 mb-3">
                <Stars rating={review.rating} />
                {(review.ratingQuality || review.ratingCommunication || review.ratingSpeed) && (
                  <span className="text-xs text-muted">
                    {[
                      review.ratingQuality && `${t("qualityLabel")} ${review.ratingQuality}/5`,
                      review.ratingCommunication && `${t("communicationLabel")} ${review.ratingCommunication}/5`,
                      review.ratingSpeed && `${t("speedLabel")} ${review.ratingSpeed}/5`,
                    ].filter(Boolean).join(" · ")}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-line/50">
                <div className="w-9 h-9 rounded-full bg-blush-100 flex items-center justify-center text-rose font-bold text-sm">
                  {review.authorName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm text-ink truncate">{review.authorName}</span>
                    <SourceBadge source={review.source} />
                  </div>
                  {review.authorCity && <div className="text-xs text-muted">{review.authorCity}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 mb-10">
          <p className="text-muted text-sm">{t("noReviews")}</p>
        </div>
      )}

      {/* Write review section */}
      <div className="border-t border-line pt-10">
        <h2 className="text-lg font-bold text-ink mb-4">{t("writeReview")}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Our review form */}
          <div className="bg-nude-50 rounded-2xl p-5 border border-line">
            <h3 className="text-sm font-semibold text-ink mb-1">Hairland</h3>
            <p className="text-xs text-muted mb-4">{t("noReviewsDesc")}</p>

            {sent ? (
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <div className="text-emerald-700 font-semibold text-sm">{tForm("thankYou")}</div>
                <div className="text-xs text-emerald-600 mt-1">{tForm("pendingApproval")}</div>
              </div>
            ) : !showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-rose text-white text-sm font-medium hover:bg-rose-deep transition-colors"
              >
                {t("writeReview")}
              </button>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted mb-1">{tForm("nameLabel")}</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-line rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-rose" required />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">{tForm("cityLabel")}</label>
                    <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full border border-line rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-rose" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-muted mb-1">{tForm("overallRating")}</label>
                  <StarPicker value={rating} onChange={setRating} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-muted mb-1">{tForm("qualityLabel")}</label>
                    <SubStarPicker value={ratingQuality} onChange={setRatingQuality} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">{tForm("communicationLabel")}</label>
                    <SubStarPicker value={ratingCommunication} onChange={setRatingCommunication} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">{tForm("speedLabel")}</label>
                    <SubStarPicker value={ratingSpeed} onChange={setRatingSpeed} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-muted mb-1">{tForm("experienceLabel")}</label>
                  <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="w-full border border-line rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-rose resize-none" required minLength={5} />
                </div>

                <div className="flex gap-2">
                  <button type="submit" disabled={sending || !name.trim() || text.length < 5} className="px-4 py-1.5 rounded-lg bg-rose text-white text-sm font-medium hover:bg-rose-deep transition-colors disabled:opacity-50">
                    {sending ? tForm("sending") : tForm("submit")}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-1.5 rounded-lg border border-line text-sm text-muted hover:bg-nude-100 transition-colors">
                    {tForm("cancel")}
                  </button>
                </div>
                <p className="text-[10px] text-muted">{tForm("adminNote")}</p>
              </form>
            )}
          </div>

          {/* Google review CTA */}
          <a
            href="https://g.page/r/CdauuX262QcvEAE/review"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-2xl p-5 border border-line hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-3"
          >
            <svg className="w-10 h-10" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <div>
              <span className="block text-sm font-semibold text-ink">{t("writeOnGoogle")}</span>
              <span className="block text-xs text-muted mt-0.5">Google recenze</span>
            </div>
            <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
