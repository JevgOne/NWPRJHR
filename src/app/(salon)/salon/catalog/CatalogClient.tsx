"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { getHairColor } from "@/lib/hair-colors";
import type { Role } from "@prisma/client";

interface CatalogVariant {
  id: string;
  lengthCm: number;
  color: string;
  pricePerGram: number;
  availableGrams: number;
  availablePieces: number;
  sellingMode?: "BY_GRAM" | "BY_PIECE";
  pricePerPiece?: number;
}

interface CatalogProduct {
  id: string;
  name: string;
  nameUk?: string;
  nameRu?: string;
  category: string;
  processingType: string;
  origin?: string;
  texture?: string;
  photos: string[];
  variants: CatalogVariant[];
}

interface CartItem {
  variantId: string;
  grams: number;
  pieces: number;
  productName: string;
  lengthCm: number;
  color: string;
  pricePerGram: number;
  pricePerPiece?: number;
  sellingMode?: "BY_GRAM" | "BY_PIECE";
}

function formatCZK(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const categoryBadgeColors: Record<string, string> = {
  VIRGIN: "bg-amber-100 text-amber-800",
  PREMIUM: "bg-nude-100 text-espresso",
  STANDARD: "bg-emerald-100 text-emerald-800",
  SALE: "bg-rose-100 text-rose-800",
};


export function CatalogClient({ role }: { role: Role }) {
  const t = useTranslations("salonPortal");
  const tB2B = useTranslations("b2bSettings");
  const tCommon = useTranslations("common");
  const tCategory = useTranslations("category");
  const tColors = useTranslations("public.colors");
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [discountPct, setDiscountPct] = useState<number | null>(null);
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [orderNote, setOrderNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoValidating, setPromoValidating] = useState(false);
  const [promoResult, setPromoResult] = useState<{
    valid: boolean;
    code?: string;
    discountType?: string;
    discountValue?: number;
    discountAmount?: number;
    description?: string;
    reason?: string;
  } | null>(null);

  const colorName = (nameKey: string) => {
    try { return tColors(nameKey as "c1"); } catch { return nameKey; }
  };

  useEffect(() => {
    fetch("/api/salon-portal/catalog")
      .then((r) => r.json())
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false));
    fetch("/api/b2b-settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.discountPct != null) {
          setDiscountPct(data.discountPct / 100);
        }
      })
      .catch(() => {});
  }, [role]);

  const updateCart = useCallback((variantId: string, grams: number, meta: Omit<CartItem, "variantId" | "grams">) => {
    setCart((prev) => {
      const next = new Map(prev);
      if (grams <= 0 && (meta.pieces ?? 0) <= 0) {
        next.delete(variantId);
      } else {
        next.set(variantId, { variantId, grams, ...meta });
      }
      return next;
    });
  }, []);

  const cartItems = Array.from(cart.values());
  const cartTotal = cartItems.reduce((sum, item) => {
    if (item.sellingMode === "BY_PIECE") return sum + item.pieces * (item.pricePerPiece ?? 0);
    return sum + item.grams * item.pricePerGram;
  }, 0);
  const cartTotalGrams = cartItems.reduce((sum, item) => sum + item.grams, 0);
  const cartTotalPieces = cartItems.reduce((sum, item) => sum + item.pieces, 0);

  const validatePromoCode = async () => {
    if (!promoCode.trim()) return;
    setPromoValidating(true);
    try {
      const res = await fetch("/api/promo-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim(), orderTotal: cartTotal }),
      });
      const data = await res.json();
      setPromoResult(data);
    } catch {
      setPromoResult({ valid: false, reason: "error" });
    } finally {
      setPromoValidating(false);
    }
  };

  const removePromoCode = () => {
    setPromoCode("");
    setPromoResult(null);
  };

  const submitOrder = async () => {
    if (cartItems.length === 0) return;
    setSubmitting(true);
    setOrderError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            variantId: item.variantId,
            grams: item.sellingMode === "BY_PIECE" ? 0 : item.grams,
            pieces: item.sellingMode === "BY_PIECE" ? item.pieces : 0,
          })),
          note: orderNote || undefined,
          promoCode: promoResult?.valid ? promoResult.code : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("orderError"));
      }
      setOrderSuccess(true);
      setCart(new Map());
      setOrderNote("");
      setPromoCode("");
      setPromoResult(null);
    } catch (e) {
      setOrderError(e instanceof Error ? e.message : t("orderError"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-muted py-8 text-center">{tCommon("loading")}</p>;

  if (orderSuccess) {
    return (
      <div className="bg-white rounded-xl border border-line p-8 text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-ink">{t("orderSent")}</h2>
        <p className="text-muted text-sm">{t("orderSentDesc")}</p>
        <button
          onClick={() => setOrderSuccess(false)}
          className="px-4 py-2 bg-rose text-white rounded-lg text-sm font-medium hover:bg-rose/90 transition-colors"
        >
          {t("backToCatalog")}
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-line p-8 text-center">
        <p className="text-muted">{t("noProducts")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-32">
      <h1 className="text-xl font-bold text-ink">{t("catalog")}</h1>

      {/* Discount banner */}
      <div className={`rounded-xl px-4 py-2.5 text-sm font-medium ${
        role === "HAIRDRESSER"
          ? "bg-nude-50 text-espresso"
          : "bg-rose/5 text-rose"
      }`}>
        {role === "HAIRDRESSER"
          ? `${tB2B("tierHairdresser")} — ${discountPct ?? "..."}% ${tB2B("discount").toLowerCase()}`
          : `${tB2B("tierSalon")} — ${discountPct != null ? `${discountPct}% ${tB2B("discount").toLowerCase()}` : t("yourDiscount")}`}
      </div>

      {/* Product cards */}
      {products.map((product) => {
        const colors = [...new Set(product.variants.map((v) => v.color))];
        return (
          <div key={product.id} className="bg-white rounded-xl border border-line overflow-hidden">
            {/* Card header with photo + info */}
            <div className="flex gap-4 p-4 pb-3">
              {/* Photo */}
              <div className="w-20 h-20 flex-shrink-0 rounded-lg bg-nude-100 overflow-hidden flex items-center justify-center">
                {product.photos.length > 0 ? (
                  <img src={product.photos[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>

              {/* Product info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h2 className="font-semibold text-ink text-base">{product.name}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${categoryBadgeColors[product.category] ?? "bg-nude-100 text-espresso"}`}>
                    {tCategory(product.category.toLowerCase() as "virgin")}
                  </span>
                </div>

                {/* Origin + texture */}
                <div className="flex items-center gap-2 text-xs text-muted mb-2">
                  {product.origin && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-medium">
                      {product.origin}
                    </span>
                  )}
                  {product.texture && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 text-[10px] font-medium">
                      {product.texture}
                    </span>
                  )}
                </div>

                {/* Color swatches */}
                {colors.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {colors.map((code) => {
                      const { nameKey } = getHairColor(code);
                      return (
                        <span
                          key={code}
                          className="w-5 h-5 rounded-full border border-line"
                          title={colorName(nameKey)}
                          style={{ backgroundColor: getHairColor(code).hex }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Variants table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-line text-left text-xs font-medium text-muted uppercase tracking-wider">
                    <th className="px-4 py-2">{t("length")}</th>
                    <th className="px-4 py-2">{t("color")}</th>
                    <th className="px-4 py-2 text-right">{t("pricePerGram")}</th>
                    <th className="px-4 py-2 text-right">{t("available")}</th>
                    <th className="px-4 py-2 text-right">{t("orderFromCatalog")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/50">
                  {product.variants.map((v) => {
                    const { nameKey } = getHairColor(v.color);
                    const cartItem = cart.get(v.id);
                    const inCart = cartItem ? (v.sellingMode === "BY_PIECE" ? cartItem.pieces : cartItem.grams) : 0;
                    return (
                      <tr key={v.id} className={`hover:bg-nude-50/50 ${inCart > 0 ? "bg-rose/5" : ""}`}>
                        <td className="px-4 py-2 text-ink font-medium whitespace-nowrap">
                          {v.lengthCm} cm
                        </td>
                        <td className="px-4 py-2">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full border border-line flex-shrink-0" style={{ backgroundColor: getHairColor(v.color).hex }} />
                            <span className="text-ink">{colorName(nameKey)}</span>
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right text-ink font-medium whitespace-nowrap">
                          {v.sellingMode === "BY_PIECE"
                            ? `${formatCZK(v.pricePerPiece ?? 0)} Kc/ks`
                            : `${formatCZK(v.pricePerGram)} Kc/g`}
                        </td>
                        <td className="px-4 py-2 text-right whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {v.sellingMode === "BY_PIECE"
                              ? `${v.availablePieces} ks`
                              : `${v.availableGrams} g`}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="inline-flex items-center gap-1">
                            {v.sellingMode === "BY_PIECE" ? (
                              <input
                                type="number"
                                min={0}
                                max={v.availablePieces}
                                value={inCart || ""}
                                placeholder="ks"
                                onChange={(e) => {
                                  const val = Math.min(parseInt(e.target.value) || 0, v.availablePieces);
                                  updateCart(v.id, 0, {
                                    productName: product.name,
                                    lengthCm: v.lengthCm,
                                    color: v.color,
                                    pricePerGram: 0,
                                    pricePerPiece: v.pricePerPiece,
                                    pieces: val,
                                    sellingMode: "BY_PIECE",
                                  });
                                }}
                                className="w-16 px-2 py-1 text-right text-sm border border-line rounded-lg focus:outline-none focus:ring-1 focus:ring-rose"
                              />
                            ) : (
                              <input
                                type="number"
                                min={0}
                                max={v.availableGrams}
                                value={inCart || ""}
                                placeholder="g"
                                onChange={(e) => {
                                  const val = Math.min(parseInt(e.target.value) || 0, v.availableGrams);
                                  updateCart(v.id, val, {
                                    productName: product.name,
                                    lengthCm: v.lengthCm,
                                    color: v.color,
                                    pricePerGram: v.pricePerGram,
                                    pieces: 0,
                                    sellingMode: "BY_GRAM",
                                  });
                                }}
                                className="w-16 px-2 py-1 text-right text-sm border border-line rounded-lg focus:outline-none focus:ring-1 focus:ring-rose"
                              />
                            )}
                            <span className="text-xs text-muted">{v.sellingMode === "BY_PIECE" ? "ks" : "g"}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Floating cart bar */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-line shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-3">
            {orderError && (
              <div className="mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {orderError}
              </div>
            )}

            {/* Promo code row */}
            <div className="flex items-center gap-2 mb-2">
              {promoResult?.valid ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-sm">
                  <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-emerald-700 font-medium">{promoResult.code}</span>
                  <span className="text-emerald-600">
                    {promoResult.discountType === "PERCENT"
                      ? `-${(promoResult.discountValue ?? 0) / 100}%`
                      : `-${formatCZK(promoResult.discountAmount ?? 0)} Kč`}
                  </span>
                  <button onClick={removePromoCode} className="text-emerald-400 hover:text-red-500 ml-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null); }}
                    placeholder={t("promoCodePlaceholder")}
                    className="w-36 px-3 py-1.5 text-sm border border-line rounded-lg focus:outline-none focus:ring-1 focus:ring-rose uppercase"
                    onKeyDown={(e) => { if (e.key === "Enter") validatePromoCode(); }}
                  />
                  <button
                    onClick={validatePromoCode}
                    disabled={promoValidating || !promoCode.trim()}
                    className="px-3 py-1.5 text-sm font-medium text-rose border border-rose rounded-lg hover:bg-rose/5 transition-colors disabled:opacity-50"
                  >
                    {promoValidating ? "..." : t("applyPromo")}
                  </button>
                  {promoResult && !promoResult.valid && (
                    <span className="text-xs text-red-500">{t("promoInvalid")}</span>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Cart summary */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink">
                  {t("cartItems", { count: cartItems.length })}
                  {cartTotalGrams > 0 && ` \u00b7 ${cartTotalGrams} g`}
                  {cartTotalPieces > 0 && ` \u00b7 ${cartTotalPieces} ks`}
                </div>
                <div className="text-xs text-muted">
                  {promoResult?.valid && promoResult.discountAmount ? (
                    <>
                      <span className="line-through mr-1">{formatCZK(cartTotal)} Kč</span>
                      <span className="text-emerald-600 font-medium">{formatCZK(cartTotal - promoResult.discountAmount)} Kč</span>
                    </>
                  ) : (
                    <>{t("cartTotal")}: {formatCZK(cartTotal)} Kč</>
                  )}
                </div>
              </div>

              {/* Note input */}
              <input
                type="text"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder={t("orderNotePlaceholder")}
                className="hidden sm:block flex-1 px-3 py-2 text-sm border border-line rounded-lg focus:outline-none focus:ring-1 focus:ring-rose"
              />

              {/* Clear */}
              <button
                onClick={() => { setCart(new Map()); removePromoCode(); }}
                className="px-3 py-2 text-sm text-muted hover:text-ink transition-colors"
              >
                {t("clearCart")}
              </button>

              {/* Submit */}
              <button
                onClick={submitOrder}
                disabled={submitting}
                className="px-5 py-2 bg-rose text-white rounded-lg text-sm font-semibold hover:bg-rose/90 transition-colors disabled:opacity-50"
              >
                {submitting ? t("submitting") : t("submitOrder")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
