"use client";

import { useState } from "react";

const RATING_EMOJIS = ["👎", "😕", "👌", "🔥", "💎"] as const;

function EmojiPicker({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {RATING_EMOJIS.map((emoji, i) => {
        const val = i + 1;
        return (
          <button
            key={val}
            type="button"
            onClick={() => onChange(val)}
            className={`text-lg w-7 h-7 rounded-lg transition-all ${value === val ? "bg-blush-100 scale-110" : "opacity-30 hover:opacity-60"}`}
          >
            {emoji}
          </button>
        );
      })}
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

export function WriteReviewForm({ productId }: { productId: string }) {
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

  if (sent) {
    return (
      <div className="bg-emerald-50 rounded-xl p-4 text-center">
        <div className="text-emerald-700 font-semibold text-sm">Děkujeme za vaši recenzi!</div>
        <div className="text-xs text-emerald-600 mt-1">Recenze bude zveřejněna po schválení.</div>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-line text-sm text-muted hover:border-blush-300 hover:text-rose transition-colors"
      >
        ✍️ Napsat recenzi
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-nude-50 rounded-xl p-4 border border-line space-y-3">
      <div className="text-sm font-semibold text-ink">Napsat recenzi</div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted mb-1">Jméno *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-line rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-rose"
            placeholder="Vaše jméno"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Město</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full border border-line rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-rose"
            placeholder="Praha"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">Celkové hodnocení *</label>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-muted mb-1">✨ Kvalita</label>
          <EmojiPicker value={ratingQuality} onChange={setRatingQuality} />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">💬 Komunikace</label>
          <EmojiPicker value={ratingCommunication} onChange={setRatingCommunication} />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">📦 Dodání</label>
          <EmojiPicker value={ratingSpeed} onChange={setRatingSpeed} />
        </div>
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">Vaše zkušenost *</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="w-full border border-line rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-rose resize-none"
          placeholder="Popište vaši zkušenost s nákupem..."
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
          {sending ? "Odesílám..." : "Odeslat recenzi"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-1.5 rounded-lg border border-line text-sm text-muted hover:bg-nude-100 transition-colors"
        >
          Zrušit
        </button>
      </div>

      <p className="text-[10px] text-muted">
        Recenze bude zveřejněna po schválení administrátorem.
      </p>
    </form>
  );
}
