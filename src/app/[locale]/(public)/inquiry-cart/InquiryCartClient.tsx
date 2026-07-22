"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useInquiryCart, type InquiryCartItem } from "@/lib/inquiry-cart";
import { getHairColor } from "@/lib/hair-colors";
import { getReferralFromStorage, clearReferralFromStorage } from "@/components/public/ReferralTracker";


interface InquiryCartClientProps {
  mode?: "cart" | "consult";
  reason?: string;
}

function formatPrice(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function InquiryCartClient({ mode = "cart", reason }: InquiryCartClientProps) {
  const t = useTranslations("public.inquiry");
  const locale = useLocale();
  const { items, removeItem, updateQuantity, clearCart, itemCount } = useInquiryCart();

  // --- Consult mode state (kept for consult flow) ---
  const reasonMessage = mode === "consult" && reason
    ? (reason === "real-photo" ? t("reasonRealPhoto") : reason === "photo-match" ? t("reasonPhotoMatch") : "")
    : "";
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", city: "", message: reasonMessage, promoCode: "", shippingMethod: "PERSONAL_DELIVERY", paymentMethod: "CARD" });
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // --- Promo code state (used in cart mode) ---
  const [promoValidating, setPromoValidating] = useState(false);
  const [promoResult, setPromoResult] = useState<{
    valid: boolean;
    code?: string;
    discountType?: string;
    discountValue?: number;
    description?: string;
  } | null>(null);

  useEffect(() => {
    const ref = getReferralFromStorage();
    if (ref) {
      setReferralCode(ref.code);
    }
  }, []);

  const setField = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 3 - photos.length);
    const newPhotos = [...photos, ...files].slice(0, 3);
    setPhotos(newPhotos);
    const previews = newPhotos.map((f) => URL.createObjectURL(f));
    photoPreviews.forEach((p) => URL.revokeObjectURL(p));
    setPhotoPreviews(previews);
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviews[index]);
    const newPhotos = photos.filter((_, i) => i !== index);
    const newPreviews = photoPreviews.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    setPhotoPreviews(newPreviews);
  };

  const validatePromoCode = async () => {
    if (!form.promoCode.trim()) return;
    setPromoValidating(true);
    setPromoResult(null);
    try {
      const res = await fetch("/api/public/promo-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: form.promoCode.trim() }),
      });
      const data = await res.json();
      setPromoResult(data);
    } catch {
      setPromoResult({ valid: false });
    } finally {
      setPromoValidating(false);
    }
  };

  const removePromoCode = () => {
    setForm((f) => ({ ...f, promoCode: "" }));
    setPromoResult(null);
  };

  // --- Consult form submit handler ---
  const handleConsultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      let customerPhotos: string[] = [];
      if (photos.length > 0) {
        const fd = new FormData();
        photos.forEach((f) => fd.append("files", f));
        const uploadRes = await fetch("/api/public/inquiry/upload", { method: "POST", body: fd });
        if (!uploadRes.ok) throw new Error(t("photoUploadError"));
        const uploadData = await uploadRes.json();
        customerPhotos = uploadData.urls;
      }

      const res = await fetch("/api/public/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          locale,
          referralCode: referralCode || undefined,
          customerPhotos,
          items: [],
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t("submitError"));
      }

      if (referralCode) clearReferralFromStorage();
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  // --- Success state ---
  if (submitted) {
    return (
      <div className="text-center py-16">
        <svg className="w-12 h-12 mx-auto text-emerald-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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

  // --- Empty cart state ---
  if (mode === "cart" && itemCount === 0) {
    return (
      <div className="text-center py-16">
        <svg className="w-12 h-12 mx-auto text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>
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

  const isConsult = mode === "consult";

  // =====================================================
  // CONSULT MODE — full form (unchanged from original)
  // =====================================================
  if (isConsult) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-ink mb-2">{t("consultTitle")}</h1>
        <p className="text-muted mb-6">{t("consultSubtitle")}</p>

        <div className="bg-nude-50 rounded-2xl p-5">
          <h2 className="font-semibold text-ink mb-4">{t("contactInfo")}</h2>
          <form onSubmit={handleConsultSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">{t("firstNameLabel")}</label>
                <input type="text" required value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">{t("lastNameLabel")}</label>
                <input type="text" required value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">{t("emailLabel")}</label>
                <input type="email" required value={form.email} onChange={(e) => setField("email", e.target.value)} className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">{t("phoneLabel")}</label>
                <input type="tel" value={form.phone} onChange={(e) => setField("phone", e.target.value)} className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">{t("cityLabel")}</label>
                <input type="text" value={form.city} onChange={(e) => setField("city", e.target.value)} className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">{t("noteLabel")}</label>
              <textarea value={form.message} onChange={(e) => setField("message", e.target.value)} rows={3} className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose resize-none" placeholder={t("notePlaceholder")} />
            </div>
            {/* Photo upload */}
            <div className="bg-rose/5 border border-rose/20 rounded-xl p-4">
              <p className="text-sm text-ink font-medium mb-2">{t("photoCta")}</p>
              <p className="text-xs text-muted mb-3">{t("photoHint")}</p>
              {photoPreviews.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {photoPreviews.map((src, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-line">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removePhoto(i)} className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center text-xs">x</button>
                    </div>
                  ))}
                </div>
              )}
              {photos.length < 3 && (
                <label className="inline-flex items-center gap-2 px-3 py-2 border border-line rounded-lg text-sm text-muted hover:bg-white cursor-pointer transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>
                  {t("photoButton")}
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handlePhotoChange} className="hidden" />
                </label>
              )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={submitting} className="w-full py-3 bg-rose text-white font-medium rounded-xl hover:bg-rose-deep transition-colors disabled:opacity-50">
              {submitting ? t("submitting") : t("submitConsult")}
            </button>
            <p className="text-[11px] text-muted text-center">{t("disclaimer")}</p>
          </form>
        </div>
      </div>
    );
  }

  // =====================================================
  // CART MODE — clean cart page
  // =====================================================
  const hasAnyPrices = items.some((i) => i.pricePerUnit && i.pricePerUnit > 0);
  const itemsTotal = items.reduce((sum, item) => {
    const price = item.pricePerUnit ?? 0;
    return sum + price * item.quantity;
  }, 0);

  // Calculate promo discount
  let promoDiscount = 0;
  if (promoResult?.valid && promoResult.discountType === "PERCENT" && promoResult.discountValue) {
    promoDiscount = Math.round(itemsTotal * (promoResult.discountValue / 10000));
  }

  const subtotalAfterDiscount = itemsTotal - promoDiscount;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t("cartTitle")}</h1>
          <p className="text-sm text-muted mt-0.5">
            {t("cartSubtitle", { count: itemCount })}
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-muted hover:text-red-500 transition-colors"
        >
          {t("clearCart")}
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8">
        {/* Left column: Cart items */}
        <div className="space-y-3">
          {items.map((item) => (
            <CartItemCard
              key={`${item.productId}:${item.lengthCm}:${item.color}`}
              item={item}
              onRemove={() => removeItem(item.productId, item.lengthCm, item.color)}
              onUpdateQty={(qty) => updateQuantity(item.productId, item.lengthCm, item.color, qty)}
            />
          ))}

          {/* Continue shopping link */}
          <div className="pt-2">
            <Link
              href="/offer"
              className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              {t("continueShopping")}
            </Link>
          </div>
        </div>

        {/* Right column: Summary */}
        <div className="mt-6 lg:mt-0">
          <div className="bg-nude-50 rounded-2xl p-5 lg:sticky lg:top-24">
            {/* Promo code */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-muted mb-1.5">{t("promoCodeLabel")}</label>
              {promoResult?.valid ? (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-emerald-700 font-medium">{promoResult.code}</span>
                  <span className="text-xs text-emerald-600">
                    {promoResult.discountType === "PERCENT"
                      ? `−${(promoResult.discountValue ?? 0) / 100}%`
                      : t("promoApplied")}
                  </span>
                  <button
                    type="button"
                    onClick={removePromoCode}
                    className="ml-auto text-xs text-muted hover:text-red-500 transition-colors"
                  >
                    {t("promoRemove")}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.promoCode}
                    onChange={(e) => { setField("promoCode", e.target.value.toUpperCase()); setPromoResult(null); }}
                    className="flex-1 px-3 py-2.5 border border-line rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose uppercase bg-white"
                    placeholder={t("promoCodePlaceholder")}
                  />
                  <button
                    type="button"
                    onClick={validatePromoCode}
                    disabled={promoValidating || !form.promoCode.trim()}
                    className="px-4 py-2.5 bg-ink text-white text-sm font-medium rounded-xl hover:bg-ink/90 transition-colors disabled:opacity-50"
                  >
                    {promoValidating ? "..." : t("promoApply")}
                  </button>
                </div>
              )}
              {promoResult && !promoResult.valid && (
                <p className="text-xs text-red-500 mt-1">{t("promoInvalid")}</p>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-line mb-4" />

            {/* Price breakdown */}
            {hasAnyPrices && (
              <div className="space-y-2.5 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">{t("subtotal")}</span>
                  <span className="text-ink">{formatPrice(itemsTotal)} Kč</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600">{t("promoCodeLabel")}</span>
                    <span className="text-emerald-600">−{formatPrice(promoDiscount)} Kč</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted">{t("shippingEstimate")}</span>
                  <span className="text-xs text-muted">{t("shippingCalculatedAtCheckout")}</span>
                </div>
                <div className="border-t border-line pt-2.5 flex justify-between">
                  <span className="text-base font-semibold text-ink">{t("cartTotal")}</span>
                  <span className="text-base font-semibold text-ink">{formatPrice(subtotalAfterDiscount)} Kč</span>
                </div>
              </div>
            )}

            {/* Proceed to checkout */}
            <Link
              href="/checkout"
              className="block w-full py-3.5 bg-rose text-white font-medium rounded-xl hover:bg-rose-deep transition-colors text-center text-sm"
            >
              {t("proceedToCheckout")}
            </Link>

            <p className="text-[11px] text-muted text-center mt-3">
              {t("disclaimer")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// Cart item card — larger, more detailed
// =====================================================
function CartItemCard({
  item,
  onRemove,
  onUpdateQty,
}: {
  item: InquiryCartItem;
  onRemove: () => void;
  onUpdateQty: (qty: number) => void;
}) {
  const step = item.unit === "ks" ? 1 : 50;
  const minQty = item.unit === "ks" ? 1 : 50;
  const hairColor = getHairColor(item.color);
  const lineTotal = (item.pricePerUnit ?? 0) * item.quantity;
  const hasPrice = item.pricePerUnit && item.pricePerUnit > 0;

  return (
    <div className="bg-white rounded-2xl border border-line p-4 flex gap-4">
      {/* Color swatch as product image placeholder */}
      <div
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex-shrink-0 border border-line/50"
        style={{ backgroundColor: hairColor.hex }}
      />

      {/* Product info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-ink truncate">{item.productName}</h3>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
              <span className="text-xs text-muted">{item.lengthCm} cm</span>
              <span className="text-xs text-line">|</span>
              <div className="flex items-center gap-1">
                <span
                  className="w-3 h-3 rounded-full border border-line/50 inline-block"
                  style={{ backgroundColor: hairColor.hex }}
                />
                <span className="text-xs text-muted">{item.color}</span>
              </div>
              {item.sku && (
                <>
                  <span className="text-xs text-line">|</span>
                  <span className="text-xs text-muted font-mono">{item.sku}</span>
                </>
              )}
            </div>
            {hasPrice && (
              <p className="text-xs text-muted mt-1">
                {formatPrice(item.pricePerUnit!)} Kč/{item.unit}
              </p>
            )}
          </div>

          {/* Remove button */}
          <button
            onClick={onRemove}
            className="text-muted hover:text-red-500 transition-colors p-1 -mt-1 -mr-1 flex-shrink-0"
            aria-label="Remove"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>

        {/* Quantity + line total row */}
        <div className="flex items-center justify-between mt-3">
          {/* Quantity controls */}
          <div className="flex items-center gap-0">
            <button
              onClick={() => onUpdateQty(Math.max(minQty, item.quantity - step))}
              className="w-8 h-8 rounded-l-lg border border-line bg-white text-muted flex items-center justify-center hover:bg-nude-50 transition-colors text-sm font-medium"
            >
              −
            </button>
            <span className="h-8 px-3 border-t border-b border-line bg-white text-sm font-medium text-ink flex items-center justify-center min-w-[56px]">
              {item.quantity} {item.unit}
            </span>
            <button
              onClick={() => onUpdateQty(item.quantity + step)}
              className="w-8 h-8 rounded-r-lg border border-line bg-white text-muted flex items-center justify-center hover:bg-nude-50 transition-colors text-sm font-medium"
            >
              +
            </button>
          </div>

          {/* Line total */}
          {hasPrice && (
            <span className="text-sm font-semibold text-ink">
              {formatPrice(lineTotal)} Kč
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
