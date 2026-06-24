"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CategoryBadge } from "@/components/products/CategoryBadge";

const CATEGORIES = ["VIRGIN", "PREMIUM", "STANDARD", "SALE"] as const;

interface PriceSetting {
  id: string;
  category: string;
  markupPercent: number;
  updatedAt: string;
}

export function PricingSettingsClient() {
  const t = useTranslations();
  const [settings, setSettings] = useState<PriceSetting[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/price-settings")
      .then((r) => r.json())
      .then((data: PriceSetting[]) => {
        setSettings(data);
        const vals: Record<string, string> = {};
        for (const s of data) {
          vals[s.category] = s.markupPercent.toString();
        }
        for (const cat of CATEGORIES) {
          if (!vals[cat]) vals[cat] = "0";
        }
        setValues(vals);
        setLoading(false);
      });
  }, []);

  async function handleSave(category: string) {
    const markupPercent = parseInt(values[category], 10);
    if (isNaN(markupPercent) || markupPercent < 0) return;

    setSaving(category);
    try {
      const res = await fetch("/api/price-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, markupPercent }),
      });
      const _data = await res.json();
      if (res.ok) {
        // Refresh settings
        const updated = await fetch("/api/price-settings").then((r) =>
          r.json()
        );
        setSettings(updated);
      }
    } finally {
      setSaving(null);
    }
  }

  if (loading) return <p>{t("common.loading")}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t("salon.markup")} — {t("nav.settings")}
      </h1>
      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 font-medium text-gray-700">
                {t("category.virgin")} / ...
              </th>
              <th className="text-left py-2 font-medium text-gray-700">
                {t("salon.markup")} (%)
              </th>
              <th className="text-right py-2"></th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((cat) => {
              const setting = settings.find((s) => s.category === cat);
              return (
                <tr key={cat} className="border-b last:border-0">
                  <td className="py-3">
                    <CategoryBadge category={cat} />
                  </td>
                  <td className="py-3">
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      className="w-24 border rounded px-2 py-1 text-sm"
                      value={values[cat] ?? "0"}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [cat]: e.target.value }))
                      }
                    />
                    <span className="ml-1 text-gray-500">%</span>
                  </td>
                  <td className="py-3 text-right">
                    <Button
                      size="sm"
                      onClick={() => handleSave(cat)}
                      disabled={saving === cat}
                    >
                      {saving === cat ? "..." : t("common.save")}
                    </Button>
                    {setting && (
                      <span className="ml-2 text-xs text-gray-400">
                        {new Date(setting.updatedAt).toLocaleDateString()}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
