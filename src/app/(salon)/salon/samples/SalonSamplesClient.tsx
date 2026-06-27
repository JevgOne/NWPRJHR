"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";

interface Sample {
  id: string;
  status: string;
  gramsLent: number;
  createdAt: string;
  product: { name: string };
}

const statusColors: Record<string, string> = {
  REQUESTED: "bg-nude-100 text-espresso",
  APPROVED: "bg-rose/15 text-espresso",
  SENT: "bg-green-100 text-green-700",
  RETURNED: "bg-nude-100 text-muted",
  WRITTEN_OFF: "bg-red-100 text-red-700",
};

export function SalonSamplesClient({ salonId }: { salonId: string }) {
  const t = useTranslations("salonPortal");
  const tSample = useTranslations("sampleManagement");
  const tCommon = useTranslations("common");
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/samples?salonId=${salonId}`)
      .then((r) => r.json())
      .then((data) => setSamples(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [salonId]);

  if (loading) return <p className="text-muted">{tCommon("loading")}</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t("mySamples")}</h1>

      {samples.length === 0 ? (
        <Card>
          <p className="text-muted text-center py-8">
            {tSample("noSamples")}
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted">
                <th className="py-2 pr-3">{tSample("title")}</th>
                <th className="py-2 pr-3 text-right">{tSample("gramsLent")}</th>
                <th className="py-2 pr-3">{tSample("status")}</th>
              </tr>
            </thead>
            <tbody>
              {samples.map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="py-2 pr-3">{s.product.name}</td>
                  <td className="py-2 pr-3 text-right">{s.gramsLent}g</td>
                  <td className="py-2 pr-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        statusColors[s.status] ?? "bg-nude-100"
                      }`}
                    >
                      {tSample(
                        s.status.toLowerCase().replace("_", "") === "writtenoff"
                          ? "writtenOff"
                          : (s.status.toLowerCase() as "requested" | "approved" | "sent" | "returned")
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
