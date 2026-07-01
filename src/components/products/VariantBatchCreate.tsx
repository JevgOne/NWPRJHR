"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

interface VariantBatchCreateProps {
  productId: string;
  onClose: () => void;
}

export function VariantBatchCreate({
  productId,
  onClose,
}: VariantBatchCreateProps) {
  const t = useTranslations();
  const router = useRouter();
  const [lengths, setLengths] = useState("");
  const [colors, setColors] = useState("");
  const [defaultPrice, setDefaultPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingMode, setSellingMode] = useState<"BY_GRAM" | "BY_PIECE">("BY_GRAM");
  const [retailPricePerPiece, setRetailPricePerPiece] = useState("");
  const [costPricePerPiece, setCostPricePerPiece] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isByPiece = sellingMode === "BY_PIECE";

  const parsedLengths = lengths
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n > 0);

  const parsedColors = colors
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const previewCount = parsedLengths.length * parsedColors.length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (parsedLengths.length === 0 || parsedColors.length === 0) {
      setError(t("variant.enterLengthAndColor"));
      return;
    }

    if (isByPiece) {
      const moHalere = Math.round(parseFloat(retailPricePerPiece) * 100);
      if (!moHalere || moHalere <= 0) {
        setError(t("variant.enterValidPrice"));
        return;
      }
    } else {
      const priceHalere = Math.round(parseFloat(defaultPrice) * 100);
      if (!priceHalere || priceHalere <= 0) {
        setError(t("variant.enterValidPrice"));
        return;
      }
    }

    setLoading(true);
    try {
      if (isByPiece) {
        const moHalere = Math.round(parseFloat(retailPricePerPiece) * 100);
        const costHalerePiece = costPricePerPiece ? Math.round(parseFloat(costPricePerPiece) * 100) : 0;

        const variants = parsedLengths.flatMap((lengthCm) =>
          parsedColors.map((color) => ({
            lengthCm,
            color,
            wholesalePricePerGram: 0,
            costPricePerGram: costHalerePiece,
            sellingMode: "BY_PIECE" as const,
            pricePerPiece: moHalere,
            retailPricePerPiece: moHalere,
          }))
        );

        const res = await fetch(`/api/products/${productId}/variants`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variants }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error?.toString() || t("variant.createFailed"));
          return;
        }
      } else {
        const priceHalere = Math.round(parseFloat(defaultPrice) * 100);
        const costHalere = costPrice ? Math.round(parseFloat(costPrice) * 100) : 0;

        const variants = parsedLengths.flatMap((lengthCm) =>
          parsedColors.map((color) => ({
            lengthCm,
            color,
            wholesalePricePerGram: priceHalere,
            costPricePerGram: costHalere,
          }))
        );

        const res = await fetch(`/api/products/${productId}/variants`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variants }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error?.toString() || t("variant.createFailed"));
          return;
        }
      }

      router.refresh();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">
        {t("common.add")} — {t("salon.priceVariant")}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Selling mode toggle */}
        <div>
          <label className="block text-sm font-medium text-espresso mb-1.5">
            {t("variant.sellingMode") ?? "Režim prodeje"}
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSellingMode("BY_GRAM")}
              className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                !isByPiece
                  ? "border-rose bg-rose/5 text-rose"
                  : "border-line text-muted hover:border-muted"
              }`}
            >
              {t("variant.byGram") ?? "Za gramy"}
            </button>
            <button
              type="button"
              onClick={() => setSellingMode("BY_PIECE")}
              className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                isByPiece
                  ? "border-rose bg-rose/5 text-rose"
                  : "border-line text-muted hover:border-muted"
              }`}
            >
              {t("variant.byPiece") ?? "Za kusy"}
            </button>
          </div>
        </div>

        <Input
          label={`${t("product.length")} (cm, ${t("variant.commaSeparated")})`}
          placeholder="30, 40, 50, 60"
          value={lengths}
          onChange={(e) => setLengths(e.target.value)}
        />
        <Input
          label={`${t("product.color")} (${t("variant.commaSeparated")})`}
          placeholder="1B, 613, 4, ombre 1B/613"
          value={colors}
          onChange={(e) => setColors(e.target.value)}
        />

        {isByPiece ? (
          <>
            <Input
              label={`${t("variant.costPrice")} (CZK/ks)`}
              type="number"
              step="0.01"
              placeholder="500"
              value={costPricePerPiece}
              onChange={(e) => setCostPricePerPiece(e.target.value)}
            />
            <Input
              label={`${t("variant.retailPricePerPiece") ?? "MO cena za kus"} (CZK/ks)`}
              type="number"
              step="0.01"
              placeholder="1200"
              value={retailPricePerPiece}
              onChange={(e) => setRetailPricePerPiece(e.target.value)}
            />
            <p className="text-xs text-muted">
              {t("variant.pieceNote") ?? "VO cena pro salony a kadeřnice se dopočítá automaticky ze slev nastavených v B2B nastavení."}
            </p>
          </>
        ) : (
          <>
            <Input
              label={`${t("variant.costPrice")} (CZK/g)`}
              type="number"
              step="0.01"
              placeholder="8.00"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
            />
            <Input
              label={`${t("salon.wholesalePrice")} (CZK/g)`}
              type="number"
              step="0.01"
              placeholder="15.00"
              value={defaultPrice}
              onChange={(e) => setDefaultPrice(e.target.value)}
            />
          </>
        )}

        {previewCount > 0 && (
          <p className="text-sm text-muted">
            {t("variant.willBeCreated", { count: previewCount })}
          </p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "..." : t("common.confirm")}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
