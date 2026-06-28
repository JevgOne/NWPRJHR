"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import confetti from "canvas-confetti";
import { useInquiryCart } from "@/lib/inquiry-cart";
import { getHairColor } from "@/lib/hair-colors";

interface Variant {
  lengthCm: number;
  color: string;
}

interface AddToInquiryFormProps {
  productId: string;
  productName: string;
  variants: Variant[];
}

export function AddToInquiryForm({ productId, productName, variants }: AddToInquiryFormProps) {
  const t = useTranslations("public");
  const { addItem } = useInquiryCart();
  const [selectedLength, setSelectedLength] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(100);
  const [added, setAdded] = useState(false);

  const lengths = [...new Set(variants.map((v) => v.lengthCm))].sort((a, b) => a - b);
  const availableColors = selectedLength
    ? [...new Set(variants.filter((v) => v.lengthCm === selectedLength).map((v) => v.color))]
    : [...new Set(variants.map((v) => v.color))];

  const colorName = (nameKey: string) => t(`colors.${nameKey}`);

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
    <div className="bg-blush-100 rounded-2xl p-4 space-y-3">
      <h2 className="font-semibold text-rose-deep text-sm">
        {t("inquiry.addToInquiry")}
      </h2>

      {/* Length selection */}
      <div>
        <div className="text-xs text-muted mb-1.5">{t("inquiry.lengthLabel")}</div>
        <div className="flex flex-wrap gap-1.5">
          {lengths.map((len) => (
            <button
              key={len}
              onClick={() => {
                setSelectedLength(len);
                // Reset color if not available for new length
                const colorsForLen = variants.filter((v) => v.lengthCm === len).map((v) => v.color);
                if (selectedColor && !colorsForLen.includes(selectedColor)) {
                  setSelectedColor(null);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                selectedLength === len
                  ? "border-rose bg-blush-100 text-rose-deep"
                  : "border-line bg-white text-espresso hover:border-line"
              }`}
            >
              {len} cm
            </button>
          ))}
        </div>
      </div>

      {/* Color selection */}
      <div>
        <div className="text-xs text-muted mb-1.5">{t("inquiry.colorLabel")}</div>
        <div className="flex flex-wrap gap-2">
          {availableColors.map((code) => {
            const { nameKey } = getHairColor(code);
            return (
              <button
                key={code}
                onClick={() => setSelectedColor(code)}
                className={`group relative flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs border transition-colors ${
                  selectedColor === code
                    ? "border-rose bg-blush-100"
                    : "border-line bg-white hover:border-line"
                }`}
                title={colorName(nameKey)}
              >
                <span className="w-4 h-4 rounded-full border border-line flex-shrink-0 overflow-hidden">
                  <img src={`/swatches/color-${code}.png`} alt={colorName(nameKey)} className="w-full h-full object-cover" />
                </span>
                {colorName(nameKey)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quantity */}
      <div>
        <div className="text-xs text-muted mb-1.5">{t("inquiry.quantityLabel")}</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQuantity(Math.max(50, quantity - 50))}
            className="w-8 h-8 rounded-lg border border-line bg-white text-muted flex items-center justify-center hover:bg-nude-50"
          >
            −
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

      {/* Add button */}
      <button
        onClick={handleAdd}
        disabled={!selectedLength || !selectedColor}
        className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
          added
            ? "bg-emerald-600 text-white"
            : !selectedLength || !selectedColor
              ? "bg-nude-100 text-muted cursor-not-allowed"
              : "bg-rose text-white hover:bg-rose-deep"
        }`}
      >
        {added ? `✓ ${t("inquiry.addedButton")}` : t("inquiry.addButton")}
      </button>

      {(!selectedLength || !selectedColor) && (
        <p className="text-[11px] text-muted text-center">
          {t("inquiry.selectLengthAndColor")}
        </p>
      )}
    </div>
  );
}
