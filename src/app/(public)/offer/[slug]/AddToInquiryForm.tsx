"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import confetti from "canvas-confetti";
import { useInquiryCart } from "@/lib/inquiry-cart";
import { getHairColor } from "@/lib/hair-colors";

interface PickerVariant {
  lengthCm: number;
  color: string;
  pricePerGram: number;
  retailPricePerGram: number;
  availableGrams: number;
}

interface AddToInquiryFormProps {
  productId: string;
  productName: string;
  variants: PickerVariant[];
  defaultColor?: string;
  defaultLength?: number;
}

function formatPrice(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function AddToInquiryForm({ productId, productName, variants, defaultColor, defaultLength }: AddToInquiryFormProps) {
  const t = useTranslations("public");
  const { addItem } = useInquiryCart();

  // Auto-select color/length when there's only one option
  const uniqueColorCodes = [...new Set(variants.map(v => v.color))];
  const autoColor = defaultColor ?? (uniqueColorCodes.length === 1 ? uniqueColorCodes[0] : null);
  const autoLengthVariants = autoColor ? variants.filter(v => v.color === autoColor) : [];
  const uniqueAutoLengths = [...new Set(autoLengthVariants.map(v => v.lengthCm))];
  const autoLength = defaultLength ?? (uniqueAutoLengths.length === 1 ? uniqueAutoLengths[0] : null);

  const [selectedColor, setSelectedColor] = useState<string | null>(autoColor);
  const [selectedLength, setSelectedLength] = useState<number | null>(autoLength);
  const [quantity, setQuantity] = useState(100);
  const [added, setAdded] = useState(false);

  const colorName = (code: string) => {
    const { nameKey } = getHairColor(code);
    try { return t(`colors.${nameKey}`); } catch { return code; }
  };

  // Unique colors sorted by code
  const uniqueColors = useMemo(() => {
    const codes = [...new Set(variants.map((v) => v.color))];
    return codes.sort((a, b) => parseInt(a) - parseInt(b));
  }, [variants]);

  // Lengths available for selected color (with price + stock)
  const availableLengths = useMemo(() => {
    if (!selectedColor) return [];
    return variants
      .filter((v) => v.color === selectedColor)
      .sort((a, b) => a.lengthCm - b.lengthCm);
  }, [variants, selectedColor]);

  const handleAdd = () => {
    if (!selectedLength || !selectedColor) return;
    addItem({
      productId,
      productName,
      lengthCm: selectedLength,
      color: selectedColor,
      quantity,
      unit: "g",
    });
    setAdded(true);
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="bg-blush-100 rounded-2xl p-4 space-y-4">
      <h2 className="font-semibold text-rose-deep text-sm">
        {t("inquiry.addToInquiry")}
      </h2>

      {/* Step 1: Color selection with swatches */}
      <div>
        <div className="text-xs text-muted mb-1.5">{t("inquiry.colorLabel")}</div>
        <div className="flex flex-wrap gap-2">
          {uniqueColors.map((code) => {
            const isSelected = selectedColor === code;
            return (
              <button
                key={code}
                onClick={() => {
                  setSelectedColor(code);
                  // Reset length if not available for new color
                  if (selectedLength) {
                    const lengthsForColor = variants
                      .filter((v) => v.color === code)
                      .map((v) => v.lengthCm);
                    if (!lengthsForColor.includes(selectedLength)) {
                      setSelectedLength(null);
                    }
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  isSelected
                    ? "border-rose bg-rose/10 text-ink ring-1 ring-rose"
                    : "border-line bg-white text-muted hover:border-espresso/30"
                }`}
                title={colorName(code)}
              >
                <span className="w-5 h-5 rounded-full border border-line flex-shrink-0" style={{ backgroundColor: getHairColor(code).hex }} />
                {colorName(code)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Length selection (filtered by color) */}
      <div>
        <div className="text-xs text-muted mb-1.5">{t("inquiry.lengthLabel")}</div>
        {selectedColor ? (
          <div className="flex flex-wrap gap-2">
            {availableLengths.map((v) => {
              const isSelected = selectedLength === v.lengthCm;
              const inStock = v.availableGrams > 0;
              return (
                <button
                  key={v.lengthCm}
                  type="button"
                  onClick={() => inStock && setSelectedLength(v.lengthCm)}
                  disabled={!inStock}
                  className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                    isSelected
                      ? "border-rose bg-rose/10 text-ink ring-1 ring-rose"
                      : inStock
                        ? "border-line bg-white text-muted hover:border-espresso/30"
                        : "border-line bg-nude-100 opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div className="font-medium text-ink">{v.lengthCm} cm</div>
                  <div className="text-xs text-muted">
                    {formatPrice(v.pricePerGram)} Kč/g
                  </div>
                  <div className={`text-[11px] ${inStock ? "text-emerald-600" : "text-red-400"}`}>
                    {inStock ? `${v.availableGrams}g` : t("inquiry.outOfStock")}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted py-1">{t("inquiry.selectColorFirst")}</p>
        )}
      </div>

      {/* Step 3: Quantity + add button */}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <div className="text-xs text-muted mb-1.5">{t("inquiry.quantityLabel")}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuantity(Math.max(50, quantity - 50))}
              className="w-8 h-8 rounded-lg border border-line bg-white text-muted flex items-center justify-center hover:bg-nude-50"
            >
              -
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 text-center text-sm border border-line rounded-lg py-1.5 focus:outline-none focus:ring-2 focus:ring-rose"
            />
            <button
              onClick={() => setQuantity(quantity + 50)}
              className="w-8 h-8 rounded-lg border border-line bg-white text-muted flex items-center justify-center hover:bg-nude-50"
            >
              +
            </button>
            <span className="text-xs text-muted">g</span>
          </div>
        </div>

        <button
          onClick={handleAdd}
          disabled={!selectedLength || !selectedColor}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
            added
              ? "bg-emerald-600 text-white"
              : !selectedLength || !selectedColor
                ? "bg-nude-100 text-muted cursor-not-allowed"
                : "bg-rose text-white hover:bg-rose-deep"
          }`}
        >
          {added ? `✓ ${t("inquiry.addedButton")}` : t("inquiry.addButton")}
        </button>
      </div>

      {(!selectedLength || !selectedColor) && (
        <p className="text-[11px] text-muted text-center">
          {t("inquiry.selectLengthAndColor")}
        </p>
      )}
    </div>
  );
}
