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
  deliveryBarcode: string | null;
  deliveryId: string;
  variant: { lengthCm: number; color: string; productName: string };
}

const TYPE_COLORS: Record<string, string> = {
  RECEIPT: "bg-green-100 text-green-800",
  ISSUE: "bg-red-100 text-red-800",
  SALE: "bg-nude-100 text-espresso",
  RETURN: "bg-nude-100 text-espresso",
  COMPLAINT: "bg-orange-100 text-orange-800",
  SAMPLE_OUT: "bg-purple-100 text-purple-800",
  SAMPLE_RETURN: "bg-purple-50 text-purple-600",
  ADJUSTMENT: "bg-nude-100 text-gray-800",
};

export function MovementsClient({ movements }: { movements: Movement[] }) {
  const t = useTranslations("stock");

  function typeLabel(type: string): string {
    const map: Record<string, string> = {
      RECEIPT: t("receipt"),
      ISSUE: t("issue"),
      SALE: t("sale"),
      RETURN: t("return"),
      COMPLAINT: t("complaint"),
      SAMPLE_OUT: t("sample"),
      SAMPLE_RETURN: t("sampleReturn"),
      ADJUSTMENT: t("adjustment"),
    };
    return map[type] ?? type;
  }

  return (
    <Card padding="sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-muted">
              <th className="py-3 px-2 font-medium">{t("stockedAt")}</th>
              <th className="py-3 px-2 font-medium">{t("movement")}</th>
              <th className="py-3 px-2 font-medium">{t("selectVariant")}</th>
              <th className="py-3 px-2 font-medium">{t("barcode")}</th>
              <th className="py-3 px-2 font-medium text-right">{t("grams")}</th>
              <th className="py-3 px-2 font-medium text-right">{t("pieces")}</th>
              <th className="py-3 px-2 font-medium">{t("note")}</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => (
              <tr
                key={m.id}
                className="border-b border-gray-100 hover:bg-nude-50"
              >
                <td className="py-3 px-2 text-gray-600">
                  {new Date(m.createdAt).toLocaleDateString("cs-CZ")}{" "}
                  {new Date(m.createdAt).toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="py-3 px-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[m.type] ?? "bg-nude-100"}`}
                  >
                    {typeLabel(m.type)}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <div className="font-medium">{m.variant.productName}</div>
                  <div className="text-xs text-muted">
                    {m.variant.lengthCm} cm / {m.variant.color}
                  </div>
                </td>
                <td className="py-3 px-2 text-muted font-mono text-xs">
                  {m.deliveryBarcode ?? "-"}
                </td>
                <td className={`py-3 px-2 text-right ${m.grams < 0 ? "text-red-600" : "text-green-600"}`}>
                  {m.grams > 0 ? "+" : ""}
                  {m.grams}
                </td>
                <td className={`py-3 px-2 text-right ${m.pieces < 0 ? "text-red-600" : "text-green-600"}`}>
                  {m.pieces > 0 ? "+" : ""}
                  {m.pieces}
                </td>
                <td className="py-3 px-2 text-muted max-w-[150px] truncate">
                  {m.note ?? "-"}
                </td>
              </tr>
            ))}
            {movements.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted">
                  {t("noStock")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
