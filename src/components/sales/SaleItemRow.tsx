"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface SaleItemData {
  variantId: string;
  variantLabel: string;
  grams: number;
  pieces: number;
  pricePerGram: number;
  pricePerPiece?: number;
  sellingMode?: "BY_GRAM" | "BY_PIECE";
  sellByGrams?: boolean;
  lineTotal: number;
  availableGrams: number;
  availablePieces: number;
  origin?: string | null;
  texture?: string | null;
  sku?: string;
  category?: string;
}

interface SaleItemRowProps {
  item: SaleItemData;
  onGramsChange: (grams: number) => void;
  onPiecesChange: (pieces: number) => void;
  onToggleSellByGrams?: () => void;
  onRemove: () => void;
}

function formatCZK(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function SaleItemRow({
  item,
  onGramsChange,
  onPiecesChange,
  onToggleSellByGrams,
  onRemove,
}: SaleItemRowProps) {
  const t = useTranslations("sale");
  const tStock = useTranslations("stock");

  const isByPiece = item.sellingMode === "BY_PIECE";
  const insufficientStock = isByPiece
    ? item.sellByGrams
      ? item.grams > item.availableGrams
      : item.pieces > item.availablePieces
    : item.grams > item.availableGrams;

  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between">
        <div className="font-medium text-sm">
          {item.variantLabel}
          {isByPiece && <span className="ml-1.5 text-[10px] font-bold text-rose bg-rose/10 px-1.5 py-0.5 rounded">{tStock("perPiece")}</span>}
        </div>
        <Button variant="ghost" size="sm" onClick={onRemove}>
          &times;
        </Button>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted">
        {item.origin ? <span>{item.origin}</span> : item.category && <span className="text-muted/70">{item.category}</span>}
        {item.texture && <span>{item.texture}</span>}
        {item.sku && <span className="font-mono">{item.sku}</span>}
      </div>

      {isByPiece ? (
        <div className="space-y-2">
          {onToggleSellByGrams && (
            <button
              type="button"
              onClick={onToggleSellByGrams}
              className="text-xs text-rose underline"
            >
              {item.sellByGrams ? t("sellByPieces") : t("sellByGrams")}
            </button>
          )}
          {item.sellByGrams ? (
            <Input
              label={t("enterGrams")}
              type="number"
              min={1}
              max={item.availableGrams}
              value={item.grams || ""}
              onChange={(e) => onGramsChange(parseInt(e.target.value) || 0)}
              error={insufficientStock ? t("insufficientStock") : undefined}
            />
          ) : (
            <Input
              label={t("enterPieces")}
              type="number"
              min={1}
              value={item.pieces || ""}
              onChange={(e) => onPiecesChange(parseInt(e.target.value) || 0)}
              error={insufficientStock ? t("insufficientStock") : undefined}
            />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Input
            label={t("enterGrams")}
            type="number"
            min={1}
            value={item.grams || ""}
            onChange={(e) => onGramsChange(parseInt(e.target.value) || 0)}
            error={insufficientStock ? t("insufficientStock") : undefined}
          />
          <Input
            label={t("enterPieces")}
            type="number"
            min={0}
            value={item.pieces || ""}
            onChange={(e) => onPiecesChange(parseInt(e.target.value) || 0)}
          />
        </div>
      )}

      <div className="flex justify-between text-sm">
        <span className="text-muted">
          {t("availableStock")}:{" "}
          {isByPiece
            ? item.availablePieces > 0
              ? `${item.availablePieces} ks – ${item.availableGrams} g`
              : `0 ks`
            : `${item.availableGrams} g`}
        </span>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-muted">
          {isByPiece
            ? item.sellByGrams
              ? `${t("pricePerGram")}: ${formatCZK(item.pricePerGram)} CZK`
              : `${formatCZK(item.pricePerPiece ?? 0)} CZK/${tStock("pieces")}`
            : `${t("pricePerGram")}: ${formatCZK(item.pricePerGram)} CZK`}
        </span>
        <span className="font-medium">
          {t("lineTotal")}: {formatCZK(item.lineTotal)} CZK
        </span>
      </div>
    </div>
  );
}
