"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/Input";
import { roundHalereUp } from "@/lib/rounding";

interface Partner {
  id: string;
  name: string;
}

interface DiscountFormData {
  percent: number;
  type: "STANDARD" | "MARKETING" | "PERSONAL";
  counterPerformanceNote: string;
  bearerPartnerIds: string[];
}

interface DiscountFormProps {
  discount: DiscountFormData | null;
  onChange: (discount: DiscountFormData | null) => void;
  subtotal: number;
  isOwner: boolean;
}

function formatCZK(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const DISCOUNT_TYPES = ["STANDARD", "MARKETING", "PERSONAL"] as const;

export function DiscountForm({
  discount,
  onChange,
  subtotal,
  isOwner,
}: DiscountFormProps) {
  const t = useTranslations("sale");
  const [enabled, setEnabled] = useState(!!discount);
  const [partners, setPartners] = useState<Partner[]>([]);

  useEffect(() => {
    if (isOwner) {
      fetch("/api/partners")
        .then((r) => r.json())
        .then(setPartners)
        .catch(() => {});
    }
  }, [isOwner]);

  const typeLabels: Record<string, string> = {
    STANDARD: t("standard"),
    MARKETING: t("marketing"),
    PERSONAL: t("personal"),
  };

  const current = discount ?? {
    percent: 0,
    type: "STANDARD" as const,
    counterPerformanceNote: "",
    bearerPartnerIds: [] as string[],
  };

  const discountAmount =
    current.percent > 0
      ? roundHalereUp((subtotal * current.percent) / 10000)
      : 0;

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            setEnabled(e.target.checked);
            if (!e.target.checked) onChange(null);
            else onChange(current);
          }}
          className="w-5 h-5 rounded border-line"
        />
        <span className="font-medium">{t("applyDiscount")}</span>
      </label>

      {enabled && (
        <div className="space-y-3 pl-7">
          <Input
            label={t("discountPercent")}
            type="number"
            min={1}
            max={100}
            value={current.percent ? current.percent / 100 : ""}
            onChange={(e) => {
              const pct = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
              onChange({ ...current, percent: Math.round(pct * 100) });
            }}
          />

          <div>
            <label className="block text-sm font-medium text-espresso mb-1">
              {t("discountType")}
            </label>
            <div className="flex gap-2">
              {DISCOUNT_TYPES.map((dt) => (
                <button
                  key={dt}
                  type="button"
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                    current.type === dt
                      ? "border-rose bg-rose/10 text-espresso"
                      : "border-line hover:bg-nude-50"
                  }`}
                  onClick={() => onChange({ ...current, type: dt })}
                >
                  {typeLabels[dt]}
                </button>
              ))}
            </div>
          </div>

          {current.type === "MARKETING" && (
            <div>
              <Input
                label={t("counterPerformanceNote")}
                value={current.counterPerformanceNote}
                onChange={(e) =>
                  onChange({ ...current, counterPerformanceNote: e.target.value })
                }
              />
            </div>
          )}

          {current.type === "PERSONAL" && isOwner && (
            <div>
              <label className="block text-sm font-medium text-espresso mb-1">
                {t("selectBearers")}
              </label>
              <div className="space-y-1">
                {partners.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 p-2 rounded hover:bg-nude-50">
                    <input
                      type="checkbox"
                      checked={current.bearerPartnerIds.includes(p.id)}
                      onChange={(e) => {
                        const ids = e.target.checked
                          ? [...current.bearerPartnerIds, p.id]
                          : current.bearerPartnerIds.filter((id) => id !== p.id);
                        onChange({ ...current, bearerPartnerIds: ids });
                      }}
                      className="w-4 h-4 rounded border-line"
                    />
                    <span className="text-sm">{p.name}</span>
                  </label>
                ))}
              </div>
              {current.bearerPartnerIds.length > 1 && (
                <p className="text-xs text-muted mt-1">
                  {t("equalSplit")} ({current.bearerPartnerIds.length}x)
                </p>
              )}
            </div>
          )}

          {discountAmount > 0 && (
            <div className="text-sm font-medium text-espresso">
              {t("discount")}: -{formatCZK(discountAmount)} CZK
            </div>
          )}
        </div>
      )}
    </div>
  );
}
