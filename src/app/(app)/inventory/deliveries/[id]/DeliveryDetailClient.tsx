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
    product: { id: string; name: string; category: string; processingType: string };
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
  barcode: string | null;
  batchCode: string | null;
  stockedAt: string;
  note: string | null;
  movements: Movement[];
}

const TYPE_COLORS: Record<string, string> = {
  RECEIPT: "bg-green-100 text-green-800",
  ISSUE: "bg-red-100 text-red-800",
  RETURN: "bg-blue-100 text-blue-800",
  COMPLAINT: "bg-orange-100 text-orange-800",
  SAMPLE_OUT: "bg-purple-100 text-purple-800",
  SAMPLE_RETURN: "bg-purple-50 text-purple-600",
  ADJUSTMENT: "bg-gray-100 text-gray-800",
};

export function DeliveryDetailClient({
  delivery,
}: {
  delivery: DeliveryData;
}) {
  const t = useTranslations("stock");
  const tFinance = useTranslations("finance");

  const usedPercent =
    delivery.initialGrams > 0
      ? Math.round(
          ((delivery.initialGrams - delivery.remainingGrams) /
            delivery.initialGrams) *
            100
        )
      : 0;

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

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Info */}
      <Card>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500 mb-1">{t("selectVariant")}</div>
            <div className="font-medium">
              {delivery.variant.product.name} — {delivery.variant.lengthCm} cm /{" "}
              {delivery.variant.color}
            </div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">{t("supplier")}</div>
            <div className="font-medium">{delivery.supplier.name}</div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">{tFinance("purchasePrice")}</div>
            <div className="font-medium">
              {delivery.purchasePricePerGramRaw} ({delivery.currency})
              {delivery.currency !== "CZK" && (
                <span className="text-gray-500 ml-1">
                  = {(delivery.purchasePricePerGramCZK / 100).toFixed(2)} CZK/{t("grams")}
                </span>
              )}
            </div>
          </div>
          {delivery.currency !== "CZK" && (
            <div>
              <div className="text-gray-500 mb-1">{t("exchangeRate")}</div>
              <div className="font-medium">
                {(delivery.exchangeRate / 10000).toFixed(4)}
              </div>
            </div>
          )}
          <div>
            <div className="text-gray-500 mb-1">{t("barcode")}</div>
            <div className="font-mono text-xs">{delivery.barcode ?? "-"}</div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">{t("stockedAt")}</div>
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
                className="h-full bg-indigo-600 rounded-full"
                style={{ width: `${100 - usedPercent}%` }}
              />
            </div>
          </div>
          <div className="text-gray-700 whitespace-nowrap">
            {delivery.remainingGrams} / {delivery.initialGrams} {t("grams")}
          </div>
          {delivery.initialPieces > 0 && (
            <div className="text-gray-700 whitespace-nowrap">
              {delivery.remainingPieces} / {delivery.initialPieces} {t("pieces")}
            </div>
          )}
        </div>
        {delivery.note && (
          <div className="mt-3 text-sm text-gray-500">
            {t("note")}: {delivery.note}
          </div>
        )}
      </Card>

      {/* Movements history */}
      <Card padding="sm">
        <h2 className="text-sm font-medium text-gray-700 px-2 py-2">
          {t("movements")}
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="py-2 px-2 font-medium">{t("stockedAt")}</th>
              <th className="py-2 px-2 font-medium">{t("movement")}</th>
              <th className="py-2 px-2 font-medium text-right">{t("grams")}</th>
              <th className="py-2 px-2 font-medium text-right">{t("pieces")}</th>
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
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[m.type] ?? "bg-gray-100"}`}
                  >
                    {typeLabel(m.type)}
                  </span>
                </td>
                <td className={`py-2 px-2 text-right ${m.grams < 0 ? "text-red-600" : "text-green-600"}`}>
                  {m.grams > 0 ? "+" : ""}
                  {m.grams}
                </td>
                <td className={`py-2 px-2 text-right ${m.pieces < 0 ? "text-red-600" : "text-green-600"}`}>
                  {m.pieces > 0 ? "+" : ""}
                  {m.pieces}
                </td>
                <td className="py-2 px-2 text-gray-500">{m.note ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
