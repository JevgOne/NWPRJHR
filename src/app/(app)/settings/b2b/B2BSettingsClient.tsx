"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface B2BSettingsData {
  hairdresserDiscountPct: number;
  salonDiscountPct: number;
}

export function B2BSettingsClient() {
  const t = useTranslations("b2bSettings");
  const tCommon = useTranslations("common");
  const [settings, setSettings] = useState<B2BSettingsData>({
    hairdresserDiscountPct: 2000,
    salonDiscountPct: 3600,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/b2b-settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings({
          hairdresserDiscountPct: data.hairdresserDiscountPct ?? 2000,
          salonDiscountPct: data.salonDiscountPct ?? 3600,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await fetch("/api/b2b-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <p className="text-gray-500">{tCommon("loading")}</p>;

  const hairdresserPct = (settings.hairdresserDiscountPct / 100).toFixed(2);
  const salonPct = (settings.salonDiscountPct / 100).toFixed(2);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t("title")}</h1>
      <p className="text-sm text-gray-500">{t("description")}</p>

      <Card>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("hairdresserDiscount")}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={hairdresserPct}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    hairdresserDiscountPct: Math.round(
                      parseFloat(e.target.value || "0") * 100
                    ),
                  }))
                }
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {t("hairdresserDiscountHelp")}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("salonDiscount")}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={salonPct}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    salonDiscountPct: Math.round(
                      parseFloat(e.target.value || "0") * 100
                    ),
                  }))
                }
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {t("salonDiscountHelp")}
            </p>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? tCommon("saving") : tCommon("save")}
            </Button>
            {saved && (
              <span className="text-sm text-green-600">{tCommon("success")}</span>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          {t("previewTitle")}
        </h3>
        <p className="text-xs text-gray-400 mb-3">{t("previewDescription")}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2 pr-3">{t("tier")}</th>
                <th className="py-2 pr-3 text-right">{t("discount")}</th>
                <th className="py-2 pr-3 text-right">{t("examplePrice")}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-3">{t("tierCustomer")}</td>
                <td className="py-2 pr-3 text-right">0%</td>
                <td className="py-2 pr-3 text-right">500 CZK/g</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-3">{t("tierHairdresser")}</td>
                <td className="py-2 pr-3 text-right">{hairdresserPct}%</td>
                <td className="py-2 pr-3 text-right">
                  {((500 * (10000 - settings.hairdresserDiscountPct)) / 10000).toFixed(0)} CZK/g
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-3">{t("tierSalon")}</td>
                <td className="py-2 pr-3 text-right">{salonPct}%</td>
                <td className="py-2 pr-3 text-right">
                  {((500 * (10000 - settings.salonDiscountPct)) / 10000).toFixed(0)} CZK/g
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
