"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface TierSetting {
  id?: string;
  tier: string;
  revenueThreshold: number;
  discountPercent: number;
}

const TIERS = ["BRONZE", "SILVER", "GOLD", "PLATINUM"];

export function LoyaltySettingsClient() {
  const t = useTranslations("loyaltySettings");
  const tLoyalty = useTranslations("loyalty");
  const tCommon = useTranslations("common");
  const [settings, setSettings] = useState<TierSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/loyalty-settings")
      .then((r) => r.json())
      .then((data) => {
        // Ensure all tiers have entries
        const map = new Map<string, TierSetting>(
          data.map((s: TierSetting) => [s.tier, s])
        );
        const full: TierSetting[] = TIERS.map(
          (tier) =>
            map.get(tier) ?? { tier, revenueThreshold: 0, discountPercent: 0 }
        );
        setSettings(full);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (setting: TierSetting) => {
    setSaving(true);
    await fetch("/api/loyalty-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(setting),
    });
    setSaving(false);
  };

  const update = (idx: number, field: string, value: number) => {
    setSettings((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
  };

  if (loading) return <p className="text-muted">{tCommon("loading")}</p>;

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">{t("title")}</h1>

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted">
              <th className="py-2 pr-3">{tLoyalty("tier")}</th>
              <th className="py-2 pr-3">{t("revenueThreshold")} (CZK)</th>
              <th className="py-2 pr-3">{t("discountPercent")}</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {settings.map((s, i) => (
              <tr key={s.tier} className="border-b">
                <td className="py-2 pr-3 font-medium">
                  {tLoyalty(s.tier.toLowerCase())}
                </td>
                <td className="py-2 pr-3">
                  <Input
                    type="number"
                    value={s.revenueThreshold / 100}
                    onChange={(e) =>
                      update(
                        i,
                        "revenueThreshold",
                        Math.round(parseFloat(e.target.value || "0") * 100)
                      )
                    }
                  />
                </td>
                <td className="py-2 pr-3">
                  <Input
                    type="number"
                    value={s.discountPercent / 100}
                    onChange={(e) =>
                      update(
                        i,
                        "discountPercent",
                        Math.round(parseFloat(e.target.value || "0") * 100)
                      )
                    }
                  />
                </td>
                <td className="py-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleSave(s)}
                    disabled={saving}
                  >
                    {tCommon("save")}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-muted mt-3">{t("warning")}</p>
      </Card>
    </div>
  );
}
