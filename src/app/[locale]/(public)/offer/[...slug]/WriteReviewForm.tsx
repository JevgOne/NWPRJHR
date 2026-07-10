"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import confetti from "canvas-confetti";

function SubStarPicker({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-base transition-colors ${star <= (value ?? 0) ? "text-yellow-400" : "text-gray-300 hover:text-yellow-200"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-xl transition-colors ${star <= value ? "text-yellow-400" : "text-gray-300 hover:text-yellow-200"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function WriteReviewForm({ productId }: { productId?: string }) {
  const t = useTranslations("public.reviewForm");
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [rating, setRating] = useState(5);
  const [ratingQuality, setRatingQuality] = useState<number | null>(null);
  const [ratingCommunication, setRatingCommunication] = useState<number | null>(null);
  const [ratingSpeed, setRatingSpeed] = useState<number | null>(null);
  const [text, setText] = useState("");

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
          productId,
        }),
      });
      if (res.ok) {
        setSent(true);
      }
    } catch {
      // silent
    }
    setSending(false);
  };

  useEffect(() => {
    if (sent) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { x: 0.3, y: 0.5 } }), 300);
      setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { x: 0.7, y: 0.5 } }), 600);
    }
  }, [sent]);

  if (sent) {
    return (
      <div className="bg-emerald-50 rounded-xl p-4 text-center">
        <div className="text-emerald-700 font-semibold text-sm">{t("thankYou")}</div>
        <div className="text-xs text-emerald-600 mt-1">{t("pendingApproval")}</div>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-gradient-to-br from-nude-50 to-blush-50/30 rounded-2xl p-6 border border-blush-100/50 hover:shadow-lg transition-all flex flex-col items-center justify-center text-center gap-4 h-full min-h-[160px]"
      >
        <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center">
          <svg className="w-7 h-7 text-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        </div>
        <div>
          <span className="block text-sm font-semibold text-ink">{t("writeReview")}</span>
          <span className="block text-xs text-muted mt-1">Hairland.cz</span>
        </div>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-nude-50 rounded-xl p-4 border border-line space-y-3">
      <div className="text-sm font-semibold text-ink">{t("formTitle")}</div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted mb-1">{t("nameLabel")}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-line rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-rose"
            placeholder={t("namePlaceholder")}
            required
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">{t("cityLabel")}</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full border border-line rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-rose"
            placeholder={t("cityPlaceholder")}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">{t("overallRating")}</label>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-muted mb-1">{t("qualityLabel")}</label>
          <SubStarPicker value={ratingQuality} onChange={setRatingQuality} />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">{t("communicationLabel")}</label>
          <SubStarPicker value={ratingCommunication} onChange={setRatingCommunication} />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">{t("speedLabel")}</label>
          <SubStarPicker value={ratingSpeed} onChange={setRatingSpeed} />
        </div>
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">{t("experienceLabel")}</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="w-full border border-line rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-rose resize-none"
          placeholder={t("experiencePlaceholder")}
          required
          minLength={5}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={sending || !name.trim() || text.length < 5}
          className="px-4 py-1.5 rounded-lg bg-rose text-white text-sm font-medium hover:bg-rose-deep transition-colors disabled:opacity-50"
        >
          {sending ? t("sending") : t("submit")}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-1.5 rounded-lg border border-line text-sm text-muted hover:bg-nude-100 transition-colors"
        >
          {t("cancel")}
        </button>
      </div>

      <p className="text-[10px] text-muted">
        {t("adminNote")}
      </p>
    </form>
  );
}
