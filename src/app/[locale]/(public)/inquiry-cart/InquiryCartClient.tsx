"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import confetti from "canvas-confetti";
import { useInquiryCart, type InquiryCartItem } from "@/lib/inquiry-cart";
import { getHairColor } from "@/lib/hair-colors";
import { getReferralFromStorage, clearReferralFromStorage } from "@/components/public/ReferralTracker";
import { PacketaWidget, type PacketaPoint } from "@/components/public/PacketaWidget";


interface InquiryCartClientProps {
  mode?: "cart" | "consult";
  reason?: string;
}

export function InquiryCartClient({ mode = "cart", reason }: InquiryCartClientProps) {
  const t = useTranslations("public.inquiry");
  const locale = useLocale();
  const { items, removeItem, updateQuantity, clearCart, itemCount } = useInquiryCart();
  const reasonMessage = mode === "consult" && reason
    ? (reason === "real-photo" ? t("reasonRealPhoto") : reason === "photo-match" ? t("reasonPhotoMatch") : "")
    : "";
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", city: "", message: reasonMessage, promoCode: "", shippingMethod: "PERSONAL_DELIVERY", paymentMethod: "TRANSFER" });
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [packetaPoint, setPacketaPoint] = useState<{
    id: string; name: string; city: string;
  } | null>(null);

  // Auto-load referral code from localStorage
  useEffect(() => {
    const ref = getReferralFromStorage();
    if (ref) {
      setReferralCode(ref.code);
    }
  }, []);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [promoValidating, setPromoValidating] = useState(false);
  const [promoResult, setPromoResult] = useState<{
    valid: boolean;
    code?: string;
    discountType?: string;
    discountValue?: number;
    description?: string;
  } | null>(null);

  const setField = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 3 - photos.length);
    const newPhotos = [...photos, ...files].slice(0, 3);
    setPhotos(newPhotos);
    // Generate previews
    const previews = newPhotos.map((f) => URL.createObjectURL(f));
    // Revoke old previews
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "cart" && items.length === 0) return;
    if (form.shippingMethod === "PACKETA" && !packetaPoint) {
      setError(t("packetaRequired"));
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      // Upload photos first if any
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
          promoCode: promoResult?.valid ? promoResult.code : form.promoCode || undefined,
          referralCode: referralCode || undefined,
          customerPhotos,
          items: isConsult ? [] : items,
          shippingMethod: isConsult ? undefined : form.shippingMethod || undefined,
          paymentMethod: isConsult ? undefined : form.paymentMethod || undefined,
          packetaPointId: packetaPoint?.id || undefined,
          packetaPointName: packetaPoint?.name || undefined,
          packetaPointCity: packetaPoint?.city || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t("submitError"));
      }

      clearCart();
      if (referralCode) clearReferralFromStorage();
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-2">
        {isConsult ? t("consultTitle") : t("cartTitle")}
      </h1>
      {isConsult && (
        <p className="text-muted mb-6">{t("consultSubtitle")}</p>
      )}

      {/* Cart items — hidden in consult mode */}
      {!isConsult && (
        <div className="space-y-3 mb-4">
          {items.map((item) => (
            <CartItemRow
              key={`${item.productId}:${item.lengthCm}:${item.color}`}
              item={item}
              onRemove={() => removeItem(item.productId, item.lengthCm, item.color)}
              onUpdateQty={(qty) => updateQuantity(item.productId, item.lengthCm, item.color, qty)}
            />
          ))}
        </div>
      )}

      {/* Quick checkout button */}
      {!isConsult && items.some((i) => i.pricePerUnit && i.pricePerUnit > 0) && (
        <div className="mb-8">
          <Link
            href="/checkout"
            className="block w-full py-3 bg-rose text-white font-medium rounded-xl hover:bg-rose-deep transition-colors text-center text-sm"
          >
            {t("proceedToCheckout")}
          </Link>
          <p className="text-[11px] text-muted text-center mt-2">{t("orSendInquiry")}</p>
        </div>
      )}

      {/* Submission form */}
      <div className="bg-nude-50 rounded-2xl p-5">
        <h2 className="font-semibold text-ink mb-4">{t("contactInfo")}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">{t("firstNameLabel")}</label>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={(e) => setField("firstName", e.target.value)}
                className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">{t("lastNameLabel")}</label>
              <input
                type="text"
                required
                value={form.lastName}
                onChange={(e) => setField("lastName", e.target.value)}
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
              <label className="block text-xs font-medium text-muted mb-1">{t("cityLabel")}</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setField("city", e.target.value)}
                className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose"
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
          {/* Photo upload CTA */}
          <div className="bg-rose/5 border border-rose/20 rounded-xl p-4">
            <p className="text-sm text-ink font-medium mb-2">{t("photoCta")}</p>
            <p className="text-xs text-muted mb-3">{t("photoHint")}</p>
            {photoPreviews.length > 0 && (
              <div className="flex gap-2 mb-3">
                {photoPreviews.map((src, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-line">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}
            {photos.length < 3 && (
              <label className="inline-flex items-center gap-2 px-3 py-2 border border-line rounded-lg text-sm text-muted hover:bg-white cursor-pointer transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>
                {t("photoButton")}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {!isConsult && (
          <div>
            <label className="block text-xs font-medium text-muted mb-1">{t("promoCodeLabel")}</label>
            {promoResult?.valid ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
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
                  className="flex-1 px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose uppercase"
                  placeholder={t("promoCodePlaceholder")}
                />
                <button
                  type="button"
                  onClick={validatePromoCode}
                  disabled={promoValidating || !form.promoCode.trim()}
                  className="px-4 py-2 bg-ink text-white text-sm font-medium rounded-lg hover:bg-ink/90 transition-colors disabled:opacity-50"
                >
                  {promoValidating ? "..." : t("promoApply")}
                </button>
              </div>
            )}
            {promoResult && !promoResult.valid && (
              <p className="text-xs text-red-500 mt-1">{t("promoInvalid")}</p>
            )}
          </div>
          )}
          {/* Shipping & Payment — only for cart mode */}
          {!isConsult && (
            <div className="space-y-4 pt-2">
              <div>
                <h3 className="text-sm font-semibold text-ink mb-2">{t("shippingTitle")}</h3>
                <div className="space-y-2">
                  {([
                    { value: "PERSONAL_DELIVERY", label: t("shippingPersonal"), price: t("shippingFree") },
                    { value: "PICKUP", label: t("shippingPickup"), price: t("shippingFree") },
                    { value: "PACKETA", label: t("shippingPacketa"), price: "89 Kč" },
                    { value: "CZECH_POST", label: t("shippingPost"), price: "99 Kč", disabled: true },
                  ] as const).map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 px-3 py-2.5 border rounded-lg cursor-pointer transition-colors ${
                        form.shippingMethod === opt.value
                          ? "border-rose bg-rose/5"
                          : "border-line hover:border-muted"
                      } ${"disabled" in opt && opt.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <input
                        type="radio"
                        name="shippingMethod"
                        value={opt.value}
                        checked={form.shippingMethod === opt.value}
                        onChange={(e) => {
                          setField("shippingMethod", e.target.value);
                          if (e.target.value !== "PACKETA") setPacketaPoint(null);
                        }}
                        disabled={"disabled" in opt && opt.disabled}
                        className="accent-rose"
                      />
                      <span className="flex-1 text-sm text-ink">{opt.label}</span>
                      <span className="text-xs text-muted">{opt.price}</span>
                      {"disabled" in opt && opt.disabled && (
                        <span className="text-[10px] text-muted">{t("shippingSoon")}</span>
                      )}
                    </label>
                  ))}
                </div>
                {form.shippingMethod === "PACKETA" && (
                  <PacketaWidget
                    onSelect={(point: PacketaPoint) => {
                      setPacketaPoint({
                        id: String(point.id),
                        name: point.name,
                        city: point.city,
                      });
                    }}
                    selectedPoint={packetaPoint}
                    language={locale === "uk" ? "en" : locale === "ru" ? "en" : "cs"}
                  />
                )}
                {form.shippingMethod === "PACKETA" && !packetaPoint && (
                  <p className="text-xs text-red-500 mt-1">{t("packetaRequired")}</p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink mb-2">{t("paymentTitle")}</h3>
                <div className="space-y-2">
                  <label
                    className={`flex items-center gap-3 px-3 py-2.5 border rounded-lg cursor-pointer transition-colors ${
                      form.paymentMethod === "TRANSFER"
                        ? "border-rose bg-rose/5"
                        : "border-line hover:border-muted"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="TRANSFER"
                      checked={form.paymentMethod === "TRANSFER"}
                      onChange={(e) => setField("paymentMethod", e.target.value)}
                      className="accent-rose"
                    />
                    <div className="flex-1">
                      <span className="text-sm text-ink">{t("paymentTransfer")}</span>
                      <p className="text-xs text-muted">{t("paymentTransferDesc")}</p>
                    </div>
                  </label>
                  <label
                    className={`flex items-center gap-3 px-3 py-2.5 border rounded-lg cursor-pointer transition-colors ${
                      form.paymentMethod === "CASH"
                        ? "border-rose bg-rose/5"
                        : "border-line hover:border-muted"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CASH"
                      checked={form.paymentMethod === "CASH"}
                      onChange={(e) => setField("paymentMethod", e.target.value)}
                      className="accent-rose"
                    />
                    <div className="flex-1">
                      <span className="text-sm text-ink">{t("paymentCash")}</span>
                      <p className="text-xs text-muted">{t("paymentCashDesc")}</p>
                    </div>
                  </label>
                  <label
                    className={`flex items-center gap-3 px-3 py-2.5 border rounded-lg cursor-pointer transition-colors ${
                      form.paymentMethod === "CARD"
                        ? "border-rose bg-rose/5"
                        : "border-line hover:border-muted"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CARD"
                      checked={form.paymentMethod === "CARD"}
                      onChange={(e) => setField("paymentMethod", e.target.value)}
                      className="accent-rose"
                    />
                    <div className="flex-1">
                      <span className="text-sm text-ink">{t("paymentCard")}</span>
                      <p className="text-xs text-muted">{t("paymentCardDesc")}</p>
                    </div>
                    <div className="flex gap-1.5 items-center">
                      <span className="text-[10px] text-muted">Visa</span>
                      <span className="text-[10px] text-muted">MC</span>
                      <span className="text-[10px] text-muted">Apple Pay</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-rose text-white font-medium rounded-xl hover:bg-rose-deep transition-colors disabled:opacity-50"
          >
            {submitting ? t("submitting") : isConsult ? t("submitConsult") : t("submitButton", { count: itemCount })}
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
  const step = item.unit === "ks" ? 1 : 50;
  const minQty = item.unit === "ks" ? 1 : 50;
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-line p-3">
      <span className="w-8 h-8 rounded-full border border-line flex-shrink-0" style={{ backgroundColor: getHairColor(item.color).hex }} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-ink truncate">{item.productName}</div>
        <div className="text-xs text-muted">
          {item.lengthCm} cm · {item.color}
          {item.sku && <span className="ml-1 font-mono">({item.sku})</span>}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onUpdateQty(Math.max(minQty, item.quantity - step))}
          className="w-7 h-7 rounded-lg border border-line bg-white text-muted flex items-center justify-center hover:bg-nude-50 text-sm"
        >
          −
        </button>
        <span className="text-sm font-medium w-12 text-center">{item.quantity}{item.unit}</span>
        <button
          onClick={() => onUpdateQty(item.quantity + step)}
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
