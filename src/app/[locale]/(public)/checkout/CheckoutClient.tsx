"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import confetti from "canvas-confetti";
import { useInquiryCart, type InquiryCartItem } from "@/lib/inquiry-cart";
import { getHairColor } from "@/lib/hair-colors";
import { PacketaWidget, type PacketaPoint } from "@/components/public/PacketaWidget";
import { SHIPPING_COSTS, FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";

const STEPS = ["contact", "shipping", "payment", "summary"] as const;
type Step = (typeof STEPS)[number];

interface B2BInfo {
  salonId: string;
  salonName: string;
  salonType: "SALON" | "HAIRDRESSER";
  discountPct: number;
  contactEmail?: string;
  contactPhone?: string;
  contactPerson?: string;
  ico?: string;
  dic?: string;
  address?: string;
  city?: string;
}

function formatPrice(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function CheckoutClient({ b2bInfo }: { b2bInfo?: B2BInfo | null }) {
  const t = useTranslations("public.checkout");
  const tInquiry = useTranslations("public.inquiry");
  const locale = useLocale();
  const { items, clearCart, itemCount } = useInquiryCart();

  const [step, setStep] = useState<Step>("contact");
  const [form, setForm] = useState({
    firstName: b2bInfo?.contactPerson?.split(" ")[0] ?? "",
    lastName: b2bInfo?.contactPerson?.split(" ").slice(1).join(" ") ?? "",
    email: b2bInfo?.contactEmail ?? "",
    phone: b2bInfo?.contactPhone ?? "",
    note: "",
    promoCode: "",
    shippingMethod: "PERSONAL_DELIVERY",
    shippingStreet: b2bInfo?.address ?? "",
    shippingCity: b2bInfo?.city ?? "",
    shippingZip: "",
    paymentMethod: "TRANSFER",
    termsAccepted: false,
  });
  const [packetaPoint, setPacketaPoint] = useState<{
    id: string; name: string; city: string;
  } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<{
    success: boolean;
    orderId?: string;
    orderNumber?: string;
    redirect?: string;
    paymentInfo?: {
      bankAccount: string;
      iban: string;
      variableSymbol: string;
      amount: number;
    };
    error?: string;
  } | null>(null);

  const [promoValidating, setPromoValidating] = useState(false);
  const [promoResult, setPromoResult] = useState<{
    valid: boolean;
    code?: string;
    discountType?: string;
    discountValue?: number;
  } | null>(null);

  const [stockChecking, setStockChecking] = useState(false);
  const [stockError, setStockError] = useState("");
  const [error, setError] = useState("");

  const setField = (key: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const stepIndex = STEPS.indexOf(step);

  // Calculate totals
  const itemsTotal = items.reduce((sum, item) => {
    const price = item.pricePerUnit ?? 0;
    return sum + price * item.quantity;
  }, 0);

  const promoDiscount = promoResult?.valid
    ? promoResult.discountType === "PERCENT"
      ? Math.round((itemsTotal * (promoResult.discountValue ?? 0)) / 10000)
      : Math.min(promoResult.discountValue ?? 0, itemsTotal)
    : 0;

  const subtotal = Math.max(0, itemsTotal - promoDiscount);

  const shippingCost =
    subtotal >= FREE_SHIPPING_THRESHOLD
      ? 0
      : SHIPPING_COSTS[form.shippingMethod as keyof typeof SHIPPING_COSTS] ?? 0;

  const total = subtotal + shippingCost;

  // Promo code validation
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

  // Validate current step
  const canProceed = () => {
    switch (step) {
      case "contact":
        return form.firstName.trim() && form.lastName.trim() && form.email.trim() && form.email.includes("@");
      case "shipping": {
        if (form.shippingMethod === "PACKETA") return !!packetaPoint;
        if (form.shippingMethod === "PERSONAL_DELIVERY" || form.shippingMethod === "CZECH_POST") {
          return !!(form.shippingStreet.trim() && form.shippingCity.trim() && form.shippingZip.trim());
        }
        return true;
      }
      case "payment":
        return !!form.paymentMethod && form.termsAccepted;
      case "summary":
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };

  const goBack = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  // Stock check before submit
  const checkStockAndSubmit = async () => {
    setStockChecking(true);
    setStockError("");
    setError("");

    try {
      // 1. Stock check
      const stockRes = await fetch("/api/public/stock-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            lengthCm: item.lengthCm,
            color: item.color,
            grams: item.unit === "g" ? item.quantity : 0,
            pieces: item.unit === "ks" ? item.quantity : 0,
          })),
        }),
      });

      const stockData = await stockRes.json();
      if (!stockRes.ok) {
        setStockError(t("stockCheckFailed"));
        return;
      }

      // Check if any items are unavailable
      const unavailable = stockData.items?.filter(
        (i: { available: boolean; variantId: string | null }) => !i.available && i.variantId
      );
      if (unavailable?.length > 0) {
        setStockError(t("someItemsUnavailable"));
        return;
      }

      // Get resolved variantIds
      const variantIds = stockData.items?.map(
        (i: { variantId: string }) => i.variantId
      );
      if (!variantIds || variantIds.some((v: string | null) => !v)) {
        setStockError(t("variantNotFound"));
        return;
      }

      // 2. Submit order
      setSubmitting(true);
      const orderRes = await fetch("/api/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || undefined,
          items: items.map((item, idx) => ({
            variantId: variantIds[idx],
            grams: item.unit === "g" ? item.quantity : 0,
            pieces: item.unit === "ks" ? item.quantity : 0,
          })),
          shippingMethod: form.shippingMethod,
          shippingStreet: form.shippingStreet || undefined,
          shippingCity: form.shippingCity || undefined,
          shippingZip: form.shippingZip || undefined,
          packetaPointId: packetaPoint?.id || undefined,
          packetaPointName: packetaPoint?.name || undefined,
          packetaPointCity: packetaPoint?.city || undefined,
          paymentMethod: form.paymentMethod,
          promoCode: promoResult?.valid ? promoResult.code : form.promoCode || undefined,
          note: form.note || undefined,
          locale,
          salonId: b2bInfo?.salonId,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setError(orderData.error || t("submitError"));
        return;
      }

      setOrderResult(orderData);
      clearCart();

      // Redirect to Comgate for card payment
      if (orderData.redirect) {
        window.location.href = orderData.redirect;
        return;
      }
    } catch {
      setError(t("submitError"));
    } finally {
      setStockChecking(false);
      setSubmitting(false);
    }
  };

  // Generate SPAYD QR code for transfer payments
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  useEffect(() => {
    if (orderResult?.success && orderResult.paymentInfo) {
      const spayd = `SPD*1.0*ACC:${orderResult.paymentInfo.iban}*AM:${orderResult.paymentInfo.amount.toFixed(2)}*CC:CZK*X-VS:${orderResult.paymentInfo.variableSymbol}`;
      import("qrcode").then((QRCode) => {
        QRCode.toDataURL(spayd, { errorCorrectionLevel: "M", width: 200, margin: 2 })
          .then(setQrDataUrl)
          .catch(() => {});
      }).catch(() => {});
    }
  }, [orderResult]);

  // Confetti on success
  useEffect(() => {
    if (orderResult?.success && !orderResult.redirect) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { x: 0.3, y: 0.5 } }), 300);
    }
  }, [orderResult]);

  // Empty cart
  if (itemCount === 0 && !orderResult) {
    return (
      <div className="text-center py-16">
        <svg className="w-12 h-12 mx-auto text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
        </svg>
        <h1 className="text-2xl font-bold text-ink mb-2">{t("emptyTitle")}</h1>
        <p className="text-muted mb-6">{t("emptyText")}</p>
        <Link
          href="/offer"
          className="inline-flex px-5 py-2.5 bg-rose text-white text-sm font-medium rounded-xl hover:bg-rose-deep transition-colors"
        >
          {t("viewOffer")}
        </Link>
      </div>
    );
  }

  // Success — transfer payment info
  if (orderResult?.success && orderResult.paymentInfo) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-ink mb-2">{t("successTitle")}</h1>
        <p className="text-muted mb-6">{t("successTransferDesc")}</p>

        {qrDataUrl && (
          <div className="mb-6">
            <img src={qrDataUrl} alt="QR platba" className="mx-auto w-48 h-48" />
            <p className="text-xs text-muted mt-2">{t("scanQrToPay")}</p>
          </div>
        )}

        <div className="bg-nude-50 rounded-2xl p-5 text-left max-w-sm mx-auto space-y-3">
          <div>
            <div className="text-xs text-muted">{t("orderNumber")}</div>
            <div className="font-mono font-bold text-ink">{orderResult.orderNumber}</div>
          </div>
          <div>
            <div className="text-xs text-muted">{t("bankAccount")}</div>
            <div className="font-mono text-ink">{orderResult.paymentInfo.bankAccount}</div>
          </div>
          <div>
            <div className="text-xs text-muted">IBAN</div>
            <div className="font-mono text-ink text-sm">{orderResult.paymentInfo.iban}</div>
          </div>
          <div>
            <div className="text-xs text-muted">{t("variableSymbol")}</div>
            <div className="font-mono font-bold text-ink">{orderResult.paymentInfo.variableSymbol}</div>
          </div>
          <div>
            <div className="text-xs text-muted">{t("amount")}</div>
            <div className="font-bold text-ink">{orderResult.paymentInfo.amount.toLocaleString("cs-CZ")} Kč</div>
          </div>
        </div>

        <Link
          href="/offer"
          className="inline-flex mt-8 px-5 py-2.5 bg-rose text-white text-sm font-medium rounded-xl hover:bg-rose-deep transition-colors"
        >
          {t("backToOffer")}
        </Link>
      </div>
    );
  }

  // Success — card payment (redirecting)
  if (orderResult?.success) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-ink">{t("redirecting")}</h1>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-6">{t("title")}</h1>

      {/* B2B banner */}
      {b2bInfo && (
        <div className="bg-rose/5 text-rose rounded-xl px-4 py-2.5 text-sm font-medium mb-6">
          {t("b2bBanner", { salonName: b2bInfo.salonName, discount: b2bInfo.discountPct / 100 })}
        </div>
      )}

      {/* Stepper */}
      <div className="flex items-center mb-8 gap-1">
        {STEPS.map((s, idx) => (
          <div key={s} className="flex items-center flex-1">
            <button
              type="button"
              onClick={() => idx < stepIndex && setStep(s)}
              disabled={idx > stepIndex}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 transition-colors ${
                idx === stepIndex
                  ? "bg-rose text-white"
                  : idx < stepIndex
                    ? "bg-emerald-100 text-emerald-700 cursor-pointer hover:bg-emerald-200"
                    : "bg-nude-100 text-muted"
              }`}
            >
              {idx < stepIndex ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                idx + 1
              )}
            </button>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 ${idx < stepIndex ? "bg-emerald-200" : "bg-nude-100"}`} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between mb-6">
        {STEPS.map((s) => (
          <span key={s} className="text-[11px] text-muted flex-1 text-center">
            {t(`step_${s}`)}
          </span>
        ))}
      </div>

      {/* Step 1: Contact */}
      {step === "contact" && (
        <div className="bg-nude-50 rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-ink mb-2">{t("step_contact")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">{tInquiry("firstNameLabel")}</label>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={(e) => setField("firstName", e.target.value)}
                className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">{tInquiry("lastNameLabel")}</label>
              <input
                type="text"
                required
                value={form.lastName}
                onChange={(e) => setField("lastName", e.target.value)}
                className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">{tInquiry("emailLabel")}</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">{tInquiry("phoneLabel")}</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">{tInquiry("noteLabel")}</label>
            <textarea
              value={form.note}
              onChange={(e) => setField("note", e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose resize-none"
              placeholder={t("notePlaceholder")}
            />
          </div>
        </div>
      )}

      {/* Step 2: Shipping */}
      {step === "shipping" && (
        <div className="bg-nude-50 rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-ink mb-2">{t("step_shipping")}</h2>
          <div className="space-y-2">
            {([
              { value: "PERSONAL_DELIVERY", label: tInquiry("shippingPersonal"), price: tInquiry("shippingFree") },
              { value: "PACKETA", label: tInquiry("shippingPacketa"), price: "89 Kč" },
              { value: "CZECH_POST", label: tInquiry("shippingPost"), price: "119 Kč" },
            ] as const).map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 px-3 py-2.5 border rounded-lg cursor-pointer transition-colors ${
                  form.shippingMethod === opt.value
                    ? "border-rose bg-rose/5"
                    : "border-line hover:border-muted"
                }`}
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
                  className="accent-rose"
                />
                <span className="flex-1 text-sm text-ink">{opt.label}</span>
                <span className="text-xs text-muted">
                  {subtotal >= FREE_SHIPPING_THRESHOLD ? tInquiry("shippingFree") : opt.price}
                </span>
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
            <p className="text-xs text-red-500">{tInquiry("packetaRequired")}</p>
          )}
          {(form.shippingMethod === "PERSONAL_DELIVERY" || form.shippingMethod === "CZECH_POST") && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs text-muted mb-1">{t("addressStreet")}</label>
                <input
                  type="text"
                  value={form.shippingStreet}
                  onChange={(e) => setField("shippingStreet", e.target.value)}
                  className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose"
                  placeholder={t("addressStreetPlaceholder")}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted mb-1">{t("addressCity")}</label>
                  <input
                    type="text"
                    value={form.shippingCity}
                    onChange={(e) => setField("shippingCity", e.target.value)}
                    className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose"
                    placeholder={t("addressCityPlaceholder")}
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">{t("addressZip")}</label>
                  <input
                    type="text"
                    value={form.shippingZip}
                    onChange={(e) => setField("shippingZip", e.target.value)}
                    className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose"
                    placeholder={t("addressZipPlaceholder")}
                  />
                </div>
              </div>
            </div>
          )}
          {subtotal >= FREE_SHIPPING_THRESHOLD && (
            <p className="text-xs text-emerald-600">{t("freeShippingApplied")}</p>
          )}
        </div>
      )}

      {/* Step 3: Payment */}
      {step === "payment" && (
        <div className="bg-nude-50 rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-ink mb-2">{t("step_payment")}</h2>
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
                <span className="text-sm text-ink">{tInquiry("paymentTransfer")}</span>
                <p className="text-xs text-muted">{tInquiry("paymentTransferDesc")}</p>
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
                <span className="text-sm text-ink">{tInquiry("paymentCard")}</span>
                <p className="text-xs text-muted">{tInquiry("paymentCardDesc")}</p>
              </div>
              <div className="flex gap-1.5 items-center">
                <span className="text-[10px] text-muted">Visa</span>
                <span className="text-[10px] text-muted">MC</span>
                <span className="text-[10px] text-muted">Apple Pay</span>
              </div>
            </label>
          </div>

          {/* Promo code */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1">{tInquiry("promoCodeLabel")}</label>
            {promoResult?.valid ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-emerald-700 font-medium">{promoResult.code}</span>
                <span className="text-xs text-emerald-600">
                  {promoResult.discountType === "PERCENT"
                    ? `-${(promoResult.discountValue ?? 0) / 100}%`
                    : tInquiry("promoApplied")}
                </span>
                <button
                  type="button"
                  onClick={removePromoCode}
                  className="ml-auto text-xs text-muted hover:text-red-500 transition-colors"
                >
                  {tInquiry("promoRemove")}
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.promoCode}
                  onChange={(e) => { setField("promoCode", e.target.value.toUpperCase()); setPromoResult(null); }}
                  className="flex-1 px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose uppercase"
                  placeholder={tInquiry("promoCodePlaceholder")}
                />
                <button
                  type="button"
                  onClick={validatePromoCode}
                  disabled={promoValidating || !form.promoCode.trim()}
                  className="px-4 py-2 bg-ink text-white text-sm font-medium rounded-lg hover:bg-ink/90 transition-colors disabled:opacity-50"
                >
                  {promoValidating ? "..." : tInquiry("promoApply")}
                </button>
              </div>
            )}
            {promoResult && !promoResult.valid && (
              <p className="text-xs text-red-500 mt-1">{tInquiry("promoInvalid")}</p>
            )}
          </div>

          {/* Terms checkbox */}
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.termsAccepted}
              onChange={(e) => setField("termsAccepted", e.target.checked)}
              className="mt-0.5 accent-rose"
            />
            <span className="text-xs text-muted">
              {t("termsPrefix")}{" "}
              <Link href="/obchodni-podminky" className="text-rose underline" target="_blank">
                {t("termsLink")}
              </Link>
            </span>
          </label>
        </div>
      )}

      {/* Step 4: Summary */}
      {step === "summary" && (
        <div className="space-y-4">
          {/* Items */}
          <div className="bg-nude-50 rounded-2xl p-5">
            <h2 className="font-semibold text-ink mb-3">{t("orderSummary")}</h2>
            <div className="space-y-2">
              {items.map((item) => (
                <SummaryItemRow key={`${item.productId}:${item.lengthCm}:${item.color}`} item={item} />
              ))}
            </div>
          </div>

          {/* Price breakdown */}
          <div className="bg-nude-50 rounded-2xl p-5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted">{t("itemsTotal")}</span>
              <span className="text-ink">{formatPrice(itemsTotal)} Kč</span>
            </div>
            {promoDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-emerald-600">{t("discount")}</span>
                <span className="text-emerald-600">-{formatPrice(promoDiscount)} Kč</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted">{t("shipping")}</span>
              <span className="text-ink">
                {shippingCost === 0 ? tInquiry("shippingFree") : `${formatPrice(shippingCost)} Kč`}
              </span>
            </div>
            <div className="border-t border-line pt-2 flex justify-between font-bold text-ink">
              <span>{t("total")}</span>
              <span>{formatPrice(total)} Kč</span>
            </div>
          </div>

          {/* Contact & shipping summary */}
          <div className="bg-nude-50 rounded-2xl p-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">{t("step_contact")}</span>
              <span className="text-ink">{form.firstName} {form.lastName}, {form.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">{t("step_shipping")}</span>
              <span className="text-ink text-right">
                {form.shippingMethod === "PACKETA" && packetaPoint
                  ? `${tInquiry("shippingPacketa")} — ${packetaPoint.name}`
                  : form.shippingMethod === "PERSONAL_DELIVERY"
                    ? tInquiry("shippingPersonal")
                    : tInquiry("shippingPost")}
                {(form.shippingMethod === "PERSONAL_DELIVERY" || form.shippingMethod === "CZECH_POST") && form.shippingStreet && (
                  <span className="block text-xs text-muted">{form.shippingStreet}, {form.shippingCity} {form.shippingZip}</span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">{t("step_payment")}</span>
              <span className="text-ink">
                {form.paymentMethod === "CARD" ? tInquiry("paymentCard") : tInquiry("paymentTransfer")}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Errors */}
      {(error || stockError) && (
        <p className="text-sm text-red-600 mt-4">{error || stockError}</p>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-3 mt-6">
        {stepIndex > 0 && (
          <button
            type="button"
            onClick={goBack}
            className="px-5 py-2.5 border border-line rounded-xl text-sm font-medium text-muted hover:bg-nude-50 transition-colors"
          >
            {t("back")}
          </button>
        )}
        {step === "summary" ? (
          <button
            type="button"
            onClick={checkStockAndSubmit}
            disabled={submitting || stockChecking}
            className="flex-1 py-3 bg-rose text-white font-medium rounded-xl hover:bg-rose-deep transition-colors disabled:opacity-50"
          >
            {submitting || stockChecking ? t("processing") : form.paymentMethod === "CARD" ? t("payAndOrder") : t("submitOrder")}
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            disabled={!canProceed()}
            className="flex-1 py-3 bg-rose text-white font-medium rounded-xl hover:bg-rose-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("next")}
          </button>
        )}
      </div>
    </div>
  );
}

function SummaryItemRow({ item }: { item: InquiryCartItem }) {
  const price = item.pricePerUnit ?? 0;
  const lineTotal = price * item.quantity;
  return (
    <div className="flex items-center gap-3 py-2">
      <span
        className="w-6 h-6 rounded-full border border-line flex-shrink-0"
        style={{ backgroundColor: getHairColor(item.color).hex }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-ink truncate">{item.productName}</div>
        <div className="text-xs text-muted">
          {item.lengthCm > 0 && `${item.lengthCm} cm · `}{item.color} · {item.quantity}{item.unit}
        </div>
      </div>
      <div className="text-sm font-medium text-ink whitespace-nowrap">
        {formatPrice(lineTotal)} Kč
      </div>
    </div>
  );
}
