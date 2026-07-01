"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface TierSetting {
  id?: string;
  tier: string;
  salonType: string;
  revenueThreshold: number;
  discountPercent: number;
}

const TIERS = ["BRONZE", "SILVER", "GOLD", "PLATINUM"];
const TABS = [
  { key: "SALON", label: "salons" },
  { key: "HAIRDRESSER", label: "hairdressers" },
] as const;

export function LoyaltySettingsClient() {
  const t = useTranslations("loyaltySettings");
  const tLoyalty = useTranslations("loyalty");
  const tCommon = useTranslations("common");
  const [activeTab, setActiveTab] = useState<"SALON" | "HAIRDRESSER">("SALON");
  const [settings, setSettings] = useState<Record<string, TierSetting[]>>({
    SALON: [],
    HAIRDRESSER: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async (type: string) => {
    const res = await fetch(`/api/loyalty-settings?salonType=${type}`);
    const data: TierSetting[] = await res.json();
    const map = new Map<string, TierSetting>(
      data.map((s) => [s.tier, s])
    );
    return TIERS.map(
      (tier) =>
        map.get(tier) ?? {
          tier,
          salonType: type,
          revenueThreshold: 0,
          discountPercent: 0,
        }
    );
  }, []);

  useEffect(() => {
    Promise.all([loadSettings("SALON"), loadSettings("HAIRDRESSER")])
      .then(([salon, hairdresser]) => {
        setSettings({ SALON: salon, HAIRDRESSER: hairdresser });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [loadSettings]);

  const handleSave = async (setting: TierSetting) => {
    setSaving(true);
    await fetch("/api/loyalty-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...setting, salonType: activeTab }),
    });
    setSaving(false);
  };

  const update = (idx: number, field: string, value: number) => {
    setSettings((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].map((s, i) =>
        i === idx ? { ...s, [field]: value } : s
      ),
    }));
  };

  if (loading) return <p className="text-muted">{tCommon("loading")}</p>;

  const currentSettings = settings[activeTab];

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">{t("title")}</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-nude-100 rounded-lg p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-white text-espresso shadow-sm"
                : "text-muted hover:text-espresso"
            }`}
          >
            {t(tab.label)}
          </button>
        ))}
      </div>

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
            {currentSettings.map((s, i) => (
              <tr key={s.tier} className="border-b">
                <td className="py-2 pr-3 font-medium">
                  {tLoyalty(s.tier.toLowerCase() as "bronze" | "silver" | "gold" | "platinum")}
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
