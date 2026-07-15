"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";

interface Movement {
  id: string;
  type: string;
  grams: number;
  pieces: number;
  note: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
}

interface DeliveryData {
  id: string;
  variant: {
    lengthCm: number;
    color: string;
    sellingMode: string;
    product: { id: string; name: string; category: string; processingType: string; origin: string | null; texture: string | null };
  };
  supplier: { name: string };
  purchasePricePerGramRaw: number;
  currency: string;
  exchangeRate: number;
  purchasePricePerGramCZK: number;
  initialGrams: number;
  initialPieces: number;
  pieceWeightGrams: number | null;
  remainingGrams: number;
  remainingPieces: number;
  exclusive: boolean;
  barcode: string | null;
  batchCode: string | null;
  stockedAt: string;
  note: string | null;
  movements: Movement[];
}

const TYPE_COLORS: Record<string, string> = {
  RECEIPT: "bg-green-100 text-green-800",
  ISSUE: "bg-red-100 text-red-800",
  RETURN: "bg-nude-100 text-espresso",
  COMPLAINT: "bg-orange-100 text-orange-800",
  SAMPLE_OUT: "bg-purple-100 text-purple-800",
  SAMPLE_RETURN: "bg-purple-50 text-purple-600",
  ADJUSTMENT: "bg-nude-100 text-gray-800",
};

export function DeliveryDetailClient({
  delivery,
}: {
  delivery: DeliveryData;
}) {
  const t = useTranslations("stock");
  const tFinance = useTranslations("finance");

  const isByPiece = delivery.variant.sellingMode === "BY_PIECE";

  // Progress based on selling mode
  const usedPercent = isByPiece
    ? delivery.initialPieces > 0
      ? Math.round(((delivery.initialPieces - delivery.remainingPieces) / delivery.initialPieces) * 100)
      : 0
    : delivery.initialGrams > 0
      ? Math.round(((delivery.initialGrams - delivery.remainingGrams) / delivery.initialGrams) * 100)
      : 0;

  // Price formatting
  function formatCZK(halere: number): string {
    return (halere / 100).toLocaleString("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  const purchasePriceDisplay = isByPiece && delivery.pieceWeightGrams
    ? `${formatCZK(delivery.purchasePricePerGramCZK * delivery.pieceWeightGrams)} Kc/${t("perPiece")}`
    : `${formatCZK(delivery.purchasePricePerGramCZK)} Kc/${t("grams")}`;

  function typeLabel(type: string): string {
    const map: Record<string, string> = {
      RECEIPT: t("receipt"),
      ISSUE: t("issue"),
      RETURN: t("return"),
      COMPLAINT: t("complaint"),
      SAMPLE_OUT: t("sample"),
      SAMPLE_RETURN: t("sampleReturn"),
      ADJUSTMENT: t("adjustment"),
    };
    return map[type] ?? type;
  }

  const CATEGORY_COLORS: Record<string, string> = {
    VIRGIN: "bg-amber-100 text-amber-800",
    LUXE: "bg-violet-100 text-violet-800",
    STANDARD: "bg-blue-100 text-blue-800",
    SALE: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Info */}
      <Card>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {/* Product name as link + metadata */}
          <div className="col-span-2">
            <div className="text-muted mb-1">{t("selectVariant")}</div>
            <div className="font-medium">
              <a
                href={`/products/${delivery.variant.product.id}`}
                className="text-rose hover:underline"
              >
                {delivery.variant.product.name}
              </a>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[delivery.variant.product.category] ?? "bg-nude-100"}`}>
                {delivery.variant.product.category}
              </span>
              {delivery.variant.product.origin && (
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-nude-100 text-espresso">
                  {delivery.variant.product.origin}
                </span>
              )}
              {delivery.variant.product.texture && (
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-nude-100 text-espresso">
                  {delivery.variant.product.texture}
                </span>
              )}
              {isByPiece && (
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-rose/10 text-rose">
                  {t("byPiece")}
                </span>
              )}
              {delivery.exclusive && (
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  {t("exclusiveBadge")}
                </span>
              )}
            </div>
          </div>
          <div>
            <div className="text-muted mb-1">{t("length")}</div>
            <div className="font-medium">{delivery.variant.lengthCm} cm</div>
          </div>
          <div>
            <div className="text-muted mb-1">{t("color")}</div>
            <div className="font-medium">{delivery.variant.color}</div>
          </div>
          <div>
            <div className="text-muted mb-1">{t("supplier")}</div>
            <div className="font-medium">{delivery.supplier.name}</div>
          </div>
          <div>
            <div className="text-muted mb-1">{tFinance("purchasePrice")}</div>
            <div className="font-medium">
              {purchasePriceDisplay}
              {delivery.currency !== "CZK" && (
                <span className="text-muted ml-1 text-xs">
                  ({delivery.purchasePricePerGramRaw} {delivery.currency})
                </span>
              )}
            </div>
          </div>
          {delivery.currency !== "CZK" && (
            <div>
              <div className="text-muted mb-1">{t("exchangeRate")}</div>
              <div className="font-medium">
                {(delivery.exchangeRate / 10000).toFixed(4)}
              </div>
            </div>
          )}
          {isByPiece && delivery.pieceWeightGrams && (
            <div>
              <div className="text-muted mb-1">{t("pieceWeightLabel")}</div>
              <div className="font-medium">{delivery.pieceWeightGrams} g/{t("perPiece")}</div>
            </div>
          )}
          <div>
            <div className="text-muted mb-1">{t("barcode")}</div>
            <div className="font-mono text-xs">{delivery.barcode ?? "-"}</div>
          </div>
          {delivery.batchCode && (
            <div>
              <div className="text-muted mb-1">{t("batchCode")}</div>
              <div className="font-mono text-xs">{delivery.batchCode}</div>
            </div>
          )}
          <div>
            <div className="text-muted mb-1">{t("stockedAt")}</div>
            <div>
              {new Date(delivery.stockedAt).toLocaleDateString("cs-CZ")}
            </div>
          </div>
        </div>
      </Card>

      {/* Stock progress */}
      <Card>
        <div className="text-sm mb-2 font-medium">{t("remaining")}</div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex-1">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose rounded-full"
                style={{ width: `${100 - usedPercent}%` }}
              />
            </div>
          </div>
          {isByPiece ? (
            <>
              <div className="text-espresso whitespace-nowrap font-medium">
                {delivery.remainingPieces} / {delivery.initialPieces} {t("pieces")}
              </div>
              <div className="text-muted whitespace-nowrap text-xs">
                ({delivery.remainingGrams} / {delivery.initialGrams} {t("grams")})
              </div>
            </>
          ) : (
            <>
              <div className="text-espresso whitespace-nowrap font-medium">
                {delivery.remainingGrams} / {delivery.initialGrams} {t("grams")}
              </div>
              {delivery.initialPieces > 0 && (
                <div className="text-muted whitespace-nowrap text-xs">
                  ({delivery.remainingPieces} / {delivery.initialPieces} {t("pieces")})
                </div>
              )}
            </>
          )}
        </div>
        {delivery.note && (
          <div className="mt-3 text-sm text-muted">
            {t("note")}: {delivery.note}
          </div>
        )}
      </Card>

      {/* Movements history */}
      <Card padding="sm">
        <h2 className="text-sm font-medium text-espresso px-2 py-2">
          {t("movements")}
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-muted">
              <th className="py-2 px-2 font-medium">{t("stockedAt")}</th>
              <th className="py-2 px-2 font-medium">{t("movement")}</th>
              {isByPiece ? (
                <>
                  <th className="py-2 px-2 font-medium text-right">{t("pieces")}</th>
                  <th className="py-2 px-2 font-medium text-right">{t("grams")}</th>
                </>
              ) : (
                <>
                  <th className="py-2 px-2 font-medium text-right">{t("grams")}</th>
                  <th className="py-2 px-2 font-medium text-right">{t("pieces")}</th>
                </>
              )}
              <th className="py-2 px-2 font-medium">{t("note")}</th>
            </tr>
          </thead>
          <tbody>
            {delivery.movements.map((m) => (
              <tr key={m.id} className="border-b border-gray-100">
                <td className="py-2 px-2 text-gray-600">
                  {new Date(m.createdAt).toLocaleDateString("cs-CZ")}
                </td>
                <td className="py-2 px-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[m.type] ?? "bg-nude-100"}`}
                  >
                    {typeLabel(m.type)}
                  </span>
                </td>
                {isByPiece ? (
                  <>
                    <td className={`py-2 px-2 text-right ${m.pieces < 0 ? "text-red-600" : "text-green-600"}`}>
                      {m.pieces > 0 ? "+" : ""}{m.pieces}
                    </td>
                    <td className="py-2 px-2 text-right text-muted">
                      {m.grams > 0 ? "+" : ""}{m.grams}
                    </td>
                  </>
                ) : (
                  <>
                    <td className={`py-2 px-2 text-right ${m.grams < 0 ? "text-red-600" : "text-green-600"}`}>
                      {m.grams > 0 ? "+" : ""}{m.grams}
                    </td>
                    <td className={`py-2 px-2 text-right ${m.pieces < 0 ? "text-red-600" : "text-green-600"}`}>
                      {m.pieces > 0 ? "+" : ""}{m.pieces}
                    </td>
                  </>
                )}
                <td className="py-2 px-2 text-muted">{m.note ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
