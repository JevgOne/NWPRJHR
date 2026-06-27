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
  productName: string;
  lengthCm: number;
  color: string;
  pricePerGram: number;
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

const processingLabels: Record<string, string> = {
  CLIP_IN: "Clip-in",
  TAPE_IN: "Tape-in",
  KERATIN: "Keratín",
  WEFT: "Tresa",
  MICRO_RING: "Micro ring",
  OTHER: "Ostatní",
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
      if (grams <= 0) {
        next.delete(variantId);
      } else {
        next.set(variantId, { variantId, grams, ...meta });
      }
      return next;
    });
  }, []);

  const cartItems = Array.from(cart.values());
  const cartTotal = cartItems.reduce((sum, item) => sum + item.grams * item.pricePerGram, 0);
  const cartTotalGrams = cartItems.reduce((sum, item) => sum + item.grams, 0);

  const submitOrder = async () => {
    if (cartItems.length === 0) return;
    setSubmitting(true);
    setOrderError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salonId: "",
          items: cartItems.map((item) => ({
            variantId: item.variantId,
            grams: item.grams,
            pieces: 0,
          })),
          note: orderNote || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Chyba při odesílání objednávky");
      }
      setOrderSuccess(true);
      setCart(new Map());
      setOrderNote("");
    } catch (e) {
      setOrderError(e instanceof Error ? e.message : "Chyba při odesílání");
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
        <h2 className="text-lg font-semibold text-ink">Objednávka odeslána</h2>
        <p className="text-muted text-sm">Vaše objednávka byla úspěšně odeslána. Budeme vás kontaktovat.</p>
        <button
          onClick={() => setOrderSuccess(false)}
          className="px-4 py-2 bg-rose text-white rounded-lg text-sm font-medium hover:bg-rose/90 transition-colors"
        >
          Zpět do katalogu
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

                {/* Processing type + origin */}
                <div className="flex items-center gap-2 text-xs text-muted mb-2">
                  {product.processingType && (
                    <span>{processingLabels[product.processingType] ?? product.processingType}</span>
                  )}
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
                          className="w-5 h-5 rounded-full border border-line overflow-hidden"
                          title={colorName(nameKey)}
                        >
                          <img src={`/swatches/color-${code}.png`} alt={colorName(nameKey)} className="w-full h-full object-cover" />
                        </span>
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
                    <th className="px-4 py-2">Délka</th>
                    <th className="px-4 py-2">Barva</th>
                    <th className="px-4 py-2 text-right">{t("pricePerGram")}</th>
                    <th className="px-4 py-2 text-right">{t("available")}</th>
                    <th className="px-4 py-2 text-right">{t("orderFromCatalog")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/50">
                  {product.variants.map((v) => {
                    const { nameKey } = getHairColor(v.color);
                    const cartItem = cart.get(v.id);
                    const inCart = cartItem ? cartItem.grams : 0;
                    return (
                      <tr key={v.id} className={`hover:bg-nude-50/50 ${inCart > 0 ? "bg-rose/5" : ""}`}>
                        <td className="px-4 py-2 text-ink font-medium whitespace-nowrap">
                          {v.lengthCm} cm
                        </td>
                        <td className="px-4 py-2">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full border border-line overflow-hidden flex-shrink-0">
                              <img src={`/swatches/color-${v.color}.png`} alt="" className="w-full h-full object-cover" />
                            </span>
                            <span className="text-ink">{colorName(nameKey)}</span>
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right text-ink font-medium whitespace-nowrap">
                          {formatCZK(v.pricePerGram)} Kč/g
                        </td>
                        <td className="px-4 py-2 text-right whitespace-nowrap">
                          {v.availableGrams > 0 ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {v.availableGrams} g
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                              {t("outOfStock")}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {v.availableGrams > 0 ? (
                            <div className="inline-flex items-center gap-1">
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
                                  });
                                }}
                                className="w-16 px-2 py-1 text-right text-sm border border-line rounded-lg focus:outline-none focus:ring-1 focus:ring-rose"
                              />
                              <span className="text-xs text-muted">g</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted">—</span>
                          )}
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
            <div className="flex items-center gap-3">
              {/* Cart summary */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink">
                  {cartItems.length} {cartItems.length === 1 ? "položka" : cartItems.length < 5 ? "položky" : "položek"} &middot; {cartTotalGrams} g
                </div>
                <div className="text-xs text-muted">
                  Celkem: {formatCZK(cartTotal)} Kč
                </div>
              </div>

              {/* Note input */}
              <input
                type="text"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="Poznámka k objednávce..."
                className="hidden sm:block flex-1 px-3 py-2 text-sm border border-line rounded-lg focus:outline-none focus:ring-1 focus:ring-rose"
              />

              {/* Clear */}
              <button
                onClick={() => setCart(new Map())}
                className="px-3 py-2 text-sm text-muted hover:text-ink transition-colors"
              >
                Smazat
              </button>

              {/* Submit */}
              <button
                onClick={submitOrder}
                disabled={submitting}
                className="px-5 py-2 bg-rose text-white rounded-lg text-sm font-semibold hover:bg-rose/90 transition-colors disabled:opacity-50"
              >
                {submitting ? "Odesílám..." : "Odeslat objednávku"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
