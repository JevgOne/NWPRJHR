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
  const [sellingMode, setSellingMode] = useState<"BY_GRAM" | "BY_PIECE">("BY_GRAM");

  // BY_GRAM prices
  const [costPricePerGram, setCostPricePerGram] = useState("");
  const [retailPricePerGram, setRetailPricePerGram] = useState("");
  const [retailManual, setRetailManual] = useState(false);

  // BY_PIECE prices
  const [costPricePerPiece, setCostPricePerPiece] = useState("");
  const [retailPricePerPiece, setRetailPricePerPiece] = useState("");
  const [retailPieceManual, setRetailPieceManual] = useState(false);

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

  // Preview calculation
  const retailPreview = isByPiece
    ? (parseFloat(retailPricePerPiece) || 0)
    : (parseFloat(retailPricePerGram) || 0) * 100;
  const costPreview = isByPiece
    ? (parseFloat(costPricePerPiece) || 0)
    : (parseFloat(costPricePerGram) || 0) * 100;
  const marginPreview = retailPreview > 0 && costPreview > 0
    ? Math.round(((retailPreview - costPreview) / retailPreview) * 100)
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (parsedLengths.length === 0 || parsedColors.length === 0) {
      setError(t("variant.enterLengthAndColor"));
      return;
    }

    setLoading(true);
    try {
      if (isByPiece) {
        const moHalere = Math.round(parseFloat(retailPricePerPiece) * 100);
        const costHalere = costPricePerPiece ? Math.round(parseFloat(costPricePerPiece) * 100) : 0;

        if (!moHalere || moHalere <= 0) {
          setError(t("variant.enterValidPrice"));
          setLoading(false);
          return;
        }

        const variants = parsedLengths.flatMap((lengthCm) =>
          parsedColors.map((color) => ({
            lengthCm,
            color,
            costPricePerGram: costHalere,
            wholesalePricePerGram: 0,
            retailPricePerGram: 0,
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
        const retailHalere = Math.round(parseFloat(retailPricePerGram) * 100);
        const costHalere = costPricePerGram ? Math.round(parseFloat(costPricePerGram) * 100) : 0;

        if (!retailHalere || retailHalere <= 0) {
          setError(t("variant.enterValidPrice"));
          setLoading(false);
          return;
        }

        const variants = parsedLengths.flatMap((lengthCm) =>
          parsedColors.map((color) => ({
            lengthCm,
            color,
            costPricePerGram: costHalere,
            wholesalePricePerGram: retailHalere,
            retailPricePerGram: retailHalere,
            sellingMode: "BY_GRAM" as const,
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
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nákupní cena (Kč/ks)"
              type="number"
              step="0.01"
              placeholder="5000"
              value={costPricePerPiece}
              onChange={(e) => {
                setCostPricePerPiece(e.target.value);
                if (!retailPieceManual) {
                  const cost = parseFloat(e.target.value);
                  setRetailPricePerPiece(cost > 0 ? (cost * 2).toString() : "");
                }
              }}
            />
            <div>
              <Input
                label="Prodejní cena (Kč/ks)"
                type="number"
                step="0.01"
                placeholder="10000"
                value={retailPricePerPiece}
                onChange={(e) => {
                  setRetailPricePerPiece(e.target.value);
                  setRetailPieceManual(true);
                }}
              />
              {!retailPieceManual && costPricePerPiece && (
                <p className="text-[10px] text-muted mt-0.5">Auto: nákupní × 2</p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nákupní cena (Kč/g)"
              type="number"
              step="0.01"
              placeholder="5.00"
              value={costPricePerGram}
              onChange={(e) => {
                setCostPricePerGram(e.target.value);
                if (!retailManual) {
                  const cost = parseFloat(e.target.value);
                  setRetailPricePerGram(cost > 0 ? (cost * 2).toString() : "");
                }
              }}
            />
            <div>
              <Input
                label="Prodejní cena (Kč/g)"
                type="number"
                step="0.01"
                placeholder="10.00"
                value={retailPricePerGram}
                onChange={(e) => {
                  setRetailPricePerGram(e.target.value);
                  setRetailManual(true);
                }}
              />
              {!retailManual && costPricePerGram && (
                <p className="text-[10px] text-muted mt-0.5">Auto: nákupní × 2</p>
              )}
            </div>
          </div>
        )}

        {/* Price preview */}
        {retailPreview > 0 && (
          <div className="bg-nude-50 rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Prodejní cena {isByPiece ? "za kus" : "za 100g"}:</span>
              <span className="font-semibold text-ink">
                {retailPreview.toLocaleString("cs-CZ")} Kč
              </span>
            </div>
            {costPreview > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">Nákupní cena {isByPiece ? "za kus" : "za 100g"}:</span>
                <span className="text-muted">
                  {costPreview.toLocaleString("cs-CZ")} Kč
                </span>
              </div>
            )}
            {marginPreview !== null && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">Marže:</span>
                <span className={`font-medium ${marginPreview > 30 ? "text-emerald-600" : marginPreview > 0 ? "text-amber-600" : "text-red-600"}`}>
                  {marginPreview}%
                </span>
              </div>
            )}
          </div>
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
