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
  lineTotal: number;
  availableGrams: number;
  availablePieces: number;
}

interface SaleItemRowProps {
  item: SaleItemData;
  onGramsChange: (grams: number) => void;
  onPiecesChange: (pieces: number) => void;
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
  onRemove,
}: SaleItemRowProps) {
  const t = useTranslations("sale");
  const tStock = useTranslations("stock");

  const insufficientStock = item.grams > item.availableGrams;

  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between">
        <div className="font-medium text-sm">{item.variantLabel}</div>
        <Button variant="ghost" size="sm" onClick={onRemove}>
          &times;
        </Button>
      </div>

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

      <div className="flex justify-between text-sm">
        <span className="text-muted">
          {t("availableStock")}: {item.availableGrams} {tStock("grams")} / {item.availablePieces} {tStock("pieces")}
        </span>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-muted">
          {t("pricePerGram")}: {formatCZK(item.pricePerGram)} CZK
        </span>
        <span className="font-medium">
          {t("lineTotal")}: {formatCZK(item.lineTotal)} CZK
        </span>
      </div>
    </div>
  );
}
