"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CategoryBadge } from "@/components/products/CategoryBadge";

const CATEGORIES = ["VIRGIN", "LUXE", "STANDARD", "SALE"] as const;

interface PriceSetting {
  id: string;
  category: string;
  markupPercent: number;
}

export function PricingSettingsClient() {
  const t = useTranslations("pricingSettings");
  const tCommon = useTranslations("common");

  // Pricing state
  const [markupPercent, setMarkupPercent] = useState("100");
  const [sameForAll, setSameForAll] = useState(true);
  const [categoryMarkups, setCategoryMarkups] = useState<Record<string, string>>({
    VIRGIN: "100", LUXE: "100", STANDARD: "100", SALE: "100",
  });

  // B2B state (plain %, not basis points)
  const [hairdresserDiscount, setHairdresserDiscount] = useState("20");
  const [salonDiscount, setSalonDiscount] = useState("36");

  // Preview cost input (halere)
  const [exampleCost, setExampleCost] = useState("27.60");

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load existing settings
  useEffect(() => {
    Promise.all([
      fetch("/api/price-settings").then((r) => r.json()),
      fetch("/api/b2b-settings").then((r) => r.json()),
    ]).then(([priceData, b2bData]: [PriceSetting[], { hairdresserDiscountPct: number; salonDiscountPct: number }]) => {
      // Pricing
      if (priceData.length > 0) {
        const allSame = priceData.every((s) => s.markupPercent === priceData[0].markupPercent);
        setSameForAll(allSame);
        if (allSame) {
          setMarkupPercent(priceData[0].markupPercent.toString());
        }
        const markups: Record<string, string> = {};
        for (const s of priceData) {
          markups[s.category] = s.markupPercent.toString();
        }
        for (const cat of CATEGORIES) {
          if (!markups[cat]) markups[cat] = "100";
        }
        setCategoryMarkups(markups);
        if (!allSame) {
          setMarkupPercent(markups.VIRGIN);
        }
      }

      // B2B — convert basis points to plain %
      if (b2bData) {
        setHairdresserDiscount((b2bData.hairdresserDiscountPct / 100).toString());
        setSalonDiscount((b2bData.salonDiscountPct / 100).toString());
      }

      setLoading(false);
    });
  }, []);

  // Live preview calculation
  const preview = useMemo(() => {
    const costHalere = Math.round(parseFloat(exampleCost || "0") * 100);
    if (costHalere <= 0) return null;

    const markup = parseInt(sameForAll ? markupPercent : categoryMarkups.VIRGIN) || 0;
    const retailHalere = Math.round(costHalere * (1 + markup / 100));

    const hairDiscBp = Math.round(parseFloat(hairdresserDiscount || "0") * 100);
    const salonDiscBp = Math.round(parseFloat(salonDiscount || "0") * 100);

    // sale-pricing.ts formula: retail - (retail * discountPct / 20000)
    const hairPrice = Math.round(retailHalere - (retailHalere * hairDiscBp) / 20000);
    const salonPrice = Math.round(retailHalere - (retailHalere * salonDiscBp) / 20000);

    return {
      cost: costHalere,
      retail: retailHalere,
      hairdresser: hairPrice,
      salon: salonPrice,
    };
  }, [exampleCost, markupPercent, sameForAll, categoryMarkups, hairdresserDiscount, salonDiscount]);

  const multiplier = ((parseInt(sameForAll ? markupPercent : categoryMarkups.VIRGIN) || 0) / 100 + 1).toFixed(1);

  function formatKc(halere: number): string {
    return (halere / 100).toLocaleString("cs-CZ", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  async function handleSave() {
    setSaving(true);

    // 1. Save pricing for each category
    const markups = sameForAll
      ? Object.fromEntries(CATEGORIES.map((c) => [c, parseInt(markupPercent) || 100]))
      : Object.fromEntries(CATEGORIES.map((c) => [c, parseInt(categoryMarkups[c]) || 100]));

    await Promise.all(
      CATEGORIES.map((cat) =>
        fetch("/api/price-settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: cat, markupPercent: markups[cat] }),
        })
      )
    );

    // 2. Save B2B (convert plain % to basis points)
    await fetch("/api/b2b-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hairdresserDiscountPct: Math.round(parseFloat(hairdresserDiscount || "0") * 100),
        salonDiscountPct: Math.round(parseFloat(salonDiscount || "0") * 100),
      }),
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <p>{tCommon("loading")}</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-ink">{t("title")}</h1>

      {/* Markup section */}
      <Card>
        <h2 className="text-sm font-semibold text-espresso mb-4">
          {t("markupSection")}
        </h2>

        {/* Same-for-all checkbox */}
        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={sameForAll}
            onChange={(e) => {
              const checked = e.target.checked;
              setSameForAll(checked);
              if (checked) {
                // Apply current markupPercent to all
                setCategoryMarkups(
                  Object.fromEntries(CATEGORIES.map((c) => [c, markupPercent]))
                );
              }
            }}
            className="w-4 h-4 rounded border-line text-rose focus:ring-rose"
          />
          <span className="text-sm text-espresso">{t("sameForAll")}</span>
        </label>

        {sameForAll ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-32">
                <Input
                  label={t("markup")}
                  type="number"
                  value={markupPercent}
                  onChange={(e) => {
                    setMarkupPercent(e.target.value);
                    setCategoryMarkups(
                      Object.fromEntries(CATEGORIES.map((c) => [c, e.target.value]))
                    );
                  }}
                  min={0}
                  max={1000}
                />
              </div>
              <span className="text-sm text-muted mt-6">%</span>
            </div>
            <p className="text-xs text-muted">
              {t("markupDescription", { multiplier })}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {CATEGORIES.map((cat) => (
              <div key={cat} className="flex items-center gap-2">
                <CategoryBadge category={cat} />
                <input
                  type="number"
                  min={0}
                  max={1000}
                  className="w-20 border border-line rounded-lg px-2 py-1.5 text-sm"
                  value={categoryMarkups[cat] ?? "100"}
                  onChange={(e) =>
                    setCategoryMarkups((v) => ({ ...v, [cat]: e.target.value }))
                  }
                />
                <span className="text-xs text-muted">%</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* B2B section */}
      <Card>
        <h2 className="text-sm font-semibold text-espresso mb-4">
          {t("b2bSection")}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  label={t("hairdresserDiscount")}
                  type="number"
                  value={hairdresserDiscount}
                  onChange={(e) => setHairdresserDiscount(e.target.value)}
                  min={0}
                  max={100}
                  step="1"
                />
              </div>
              <span className="text-sm text-muted mt-6">%</span>
            </div>
            <p className="text-xs text-muted mt-1">{t("discountFromMargin")}</p>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  label={t("salonDiscount")}
                  type="number"
                  value={salonDiscount}
                  onChange={(e) => setSalonDiscount(e.target.value)}
                  min={0}
                  max={100}
                  step="1"
                />
              </div>
              <span className="text-sm text-muted mt-6">%</span>
            </div>
            <p className="text-xs text-muted mt-1">{t("discountFromMargin")}</p>
          </div>
        </div>
      </Card>

      {/* Preview section */}
      <Card>
        <h2 className="text-sm font-semibold text-espresso mb-4">
          {t("previewSection")}
        </h2>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-muted">{t("previewCost")}:</span>
          <input
            type="number"
            className="w-24 border border-line rounded-lg px-2 py-1.5 text-sm"
            value={exampleCost}
            onChange={(e) => setExampleCost(e.target.value)}
            min={0}
            step="0.01"
          />
          <span className="text-sm text-muted">{t("perGram")}</span>
        </div>

        {preview && (
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-line">
              <span className="text-sm text-espresso">{t("tierCustomer")}</span>
              <span className="text-sm font-semibold text-ink">
                {formatKc(preview.retail)} {t("perGram")}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-line">
              <span className="text-sm text-espresso">
                {t("tierHairdresser")} (-{hairdresserDiscount || 0}%)
              </span>
              <span className="text-sm font-semibold text-ink">
                {formatKc(preview.hairdresser)} {t("perGram")}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-espresso">
                {t("tierSalon")} (-{salonDiscount || 0}%)
              </span>
              <span className="text-sm font-semibold text-ink">
                {formatKc(preview.salon)} {t("perGram")}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? tCommon("loading") : t("saveAll")}
        </Button>
        {saved && (
          <span className="text-sm text-green-600 font-medium">
            {t("saved")}
          </span>
        )}
      </div>
    </div>
  );
}
