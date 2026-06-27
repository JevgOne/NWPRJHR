"use client";

import { useTranslations } from "next-intl";

interface SummaryItem {
  variantLabel: string;
  grams: number;
  pieces: number;
  pricePerGram: number;
  lineTotal: number;
}

interface SaleSummaryProps {
  items: SummaryItem[];
  subtotal: number;
  discountAmount: number;
  totalBeforeVat: number;
  vatAmount: number;
  totalAmount: number;
  isOwner: boolean;
  costOfGoods?: number;
  grossMargin?: number;
}

function formatCZK(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function SaleSummary({
  items,
  subtotal,
  discountAmount,
  totalBeforeVat,
  vatAmount,
  totalAmount,
  isOwner,
  costOfGoods,
  grossMargin,
}: SaleSummaryProps) {
  const t = useTranslations("sale");
  const tStock = useTranslations("stock");

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between text-sm border-b pb-2">
            <div>
              <div className="font-medium">{item.variantLabel}</div>
              <div className="text-muted">
                {item.grams} {tStock("grams")}
                {item.pieces > 0 && ` / ${item.pieces} ${tStock("pieces")}`}
                {" @ "}
                {formatCZK(item.pricePerGram)} CZK/{tStock("grams")}
              </div>
            </div>
            <div className="font-medium">{formatCZK(item.lineTotal)} CZK</div>
          </div>
        ))}
      </div>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>{t("subtotal")}</span>
          <span>{formatCZK(subtotal)} CZK</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>{t("discount")}</span>
            <span>-{formatCZK(discountAmount)} CZK</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>{t("beforeVat")}</span>
          <span>{formatCZK(totalBeforeVat)} CZK</span>
        </div>
        <div className="flex justify-between">
          <span>{t("vat")}</span>
          <span>{formatCZK(vatAmount)} CZK</span>
        </div>
        <div className="flex justify-between font-bold text-base pt-2 border-t">
          <span>{t("totalAmount")}</span>
          <span>{formatCZK(totalAmount)} CZK</span>
        </div>
      </div>

      {isOwner && costOfGoods !== undefined && grossMargin !== undefined && (
        <div className="mt-4 pt-3 border-t border-dashed space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">{t("costOfGoods")}</span>
            <span>{formatCZK(costOfGoods)} CZK</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">{t("grossMargin")}</span>
            <span
              className={
                grossMargin >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"
              }
            >
              {formatCZK(grossMargin)} CZK
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
