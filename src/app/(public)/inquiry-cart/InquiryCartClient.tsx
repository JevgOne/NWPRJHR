"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import confetti from "canvas-confetti";
import { useInquiryCart, type InquiryCartItem } from "@/lib/inquiry-cart";
import { getHairColor } from "@/lib/hair-colors";

export function InquiryCartClient() {
  const t = useTranslations("public.inquiry");
  const { items, removeItem, updateQuantity, clearCart, itemCount } = useInquiryCart();
  const [form, setForm] = useState({ name: "", email: "", phone: "", salonName: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const setField = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/public/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t("submitError"));
      }

      clearCart();
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (submitted) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { x: 0.3, y: 0.5 } }), 300);
      setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { x: 0.7, y: 0.5 } }), 600);
    }
  }, [submitted]);

  if (submitted) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-ink mb-2">{t("successTitle")}</h1>
        <p className="text-muted mb-6">
          {t("successText")}
        </p>
        <Link
          href="/offer"
          className="inline-flex px-5 py-2.5 bg-rose text-white text-sm font-medium rounded-xl hover:bg-rose-deep transition-colors"
        >
          {t("backToOffer")}
        </Link>
      </div>
    );
  }

  if (itemCount === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🛒</div>
        <h1 className="text-2xl font-bold text-ink mb-2">{t("emptyTitle")}</h1>
        <p className="text-muted mb-6">
          {t("emptyText")}
        </p>
        <Link
          href="/offer"
          className="inline-flex px-5 py-2.5 bg-rose text-white text-sm font-medium rounded-xl hover:bg-rose-deep transition-colors"
        >
          {t("viewOffer")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-6">{t("cartTitle")}</h1>

      {/* Cart items */}
      <div className="space-y-3 mb-8">
        {items.map((item) => (
          <CartItemRow
            key={`${item.productId}:${item.lengthCm}:${item.color}`}
            item={item}
            onRemove={() => removeItem(item.productId, item.lengthCm, item.color)}
            onUpdateQty={(qty) => updateQuantity(item.productId, item.lengthCm, item.color, qty)}
          />
        ))}
      </div>

      {/* Submission form */}
      <div className="bg-nude-50 rounded-2xl p-5">
        <h2 className="font-semibold text-ink mb-4">{t("contactInfo")}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">{t("nameLabel")}</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">{t("emailLabel")}</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">{t("phoneLabel")}</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">{t("salonLabel")}</label>
              <input
                type="text"
                value={form.salonName}
                onChange={(e) => setField("salonName", e.target.value)}
                className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose"
                placeholder={t("salonPlaceholder")}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">{t("noteLabel")}</label>
            <textarea
              value={form.message}
              onChange={(e) => setField("message", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose resize-none"
              placeholder={t("notePlaceholder")}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-rose text-white font-medium rounded-xl hover:bg-rose-deep transition-colors disabled:opacity-50"
          >
            {submitting ? t("submitting") : t("submitButton", { count: itemCount })}
          </button>
          <p className="text-[11px] text-muted text-center">
            {t("disclaimer")}
          </p>
        </form>
      </div>
    </div>
  );
}

function CartItemRow({
  item,
  onRemove,
  onUpdateQty,
}: {
  item: InquiryCartItem;
  onRemove: () => void;
  onUpdateQty: (qty: number) => void;
}) {
  const { hex } = getHairColor(item.color);

  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-line p-3">
      <span
        className="w-8 h-8 rounded-full border border-line flex-shrink-0"
        style={{ backgroundColor: hex }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-ink truncate">{item.productName}</div>
        <div className="text-xs text-muted">
          {item.lengthCm} cm · {item.color}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onUpdateQty(Math.max(50, item.quantity - 50))}
          className="w-7 h-7 rounded-lg border border-line bg-white text-muted flex items-center justify-center hover:bg-nude-50 text-sm"
        >
          −
        </button>
        <span className="text-sm font-medium w-12 text-center">{item.quantity}g</span>
        <button
          onClick={() => onUpdateQty(item.quantity + 50)}
          className="w-7 h-7 rounded-lg border border-line bg-white text-muted flex items-center justify-center hover:bg-nude-50 text-sm"
        >
          +
        </button>
      </div>
      <button onClick={onRemove} className="text-muted hover:text-red-500 transition-colors p-1">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
