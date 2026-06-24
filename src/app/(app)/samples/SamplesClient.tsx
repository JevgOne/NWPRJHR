"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Role } from "@prisma/client";

interface SampleRow {
  id: string;
  status: string;
  grams?: number;
  pieces?: number;
  note?: string;
  resolution?: string;
  createdAt: string;
  salon?: { name: string };
  salonName?: string;
  product: { name: string };
}

const statusColors: Record<string, string> = {
  REQUESTED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-indigo-100 text-indigo-700",
  SENT: "bg-yellow-100 text-yellow-700",
  RETURNED: "bg-green-100 text-green-700",
  WRITTEN_OFF: "bg-gray-100 text-gray-500",
};

export function SamplesClient({ role }: { role: Role }) {
  const t = useTranslations("sampleManagement");
  const tCommon = useTranslations("common");
  const [samples, setSamples] = useState<SampleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editGrams, setEditGrams] = useState("");
  const [editResolution, setEditResolution] = useState("");

  const isOwner = role === "OWNER";

  const load = () => {
    fetch("/api/samples")
      .then((r) => r.json())
      .then(setSamples)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const updateSample = async (id: string, status: string) => {
    await fetch(`/api/samples/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        grams: editGrams ? parseInt(editGrams) : undefined,
        resolution: editResolution || undefined,
      }),
    });
    setEditId(null);
    setEditGrams("");
    setEditResolution("");
    load();
  };

  const statusLabels: Record<string, string> = {
    REQUESTED: t("requested"),
    APPROVED: t("approved"),
    SENT: t("sent"),
    RETURNED: t("returned"),
    WRITTEN_OFF: t("writtenOff"),
  };

  const statusLabel = (s: string) => statusLabels[s] ?? s;

  if (loading) return <p className="text-gray-500">{tCommon("loading")}</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t("title")}</h1>

      {samples.length === 0 ? (
        <Card>
          <p className="text-gray-500 text-center py-8">{t("noSamples")}</p>
        </Card>
      ) : (
        samples.map((s) => (
          <Card key={s.id} padding="sm">
            <div className="flex items-start justify-between">
              <div className="text-sm">
                <div className="font-medium">{s.product.name}</div>
                <div className="text-gray-500">
                  {s.salon?.name ?? s.salonName ?? "-"} |{" "}
                  {new Date(s.createdAt).toLocaleDateString("cs-CZ")}
                </div>
                {s.grams && (
                  <div className="text-gray-500">
                    {t("gramsLent")}: {s.grams}g
                  </div>
                )}
                {s.note && (
                  <div className="text-gray-400 text-xs mt-1">{s.note}</div>
                )}
                {s.resolution && (
                  <div className="text-gray-500 text-xs mt-1">
                    {t("resolution")}: {s.resolution}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    statusColors[s.status] ?? "bg-gray-100"
                  }`}
                >
                  {statusLabel(s.status)}
                </span>
                {isOwner && editId !== s.id && (
                  <div className="flex gap-1 mt-1">
                    {s.status === "REQUESTED" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateSample(s.id, "APPROVED")}
                      >
                        {t("approved")}
                      </Button>
                    )}
                    {s.status === "APPROVED" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditId(s.id)}
                      >
                        {t("sent")}
                      </Button>
                    )}
                    {s.status === "SENT" && (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => updateSample(s.id, "RETURNED")}
                        >
                          {t("returned")}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setEditId(s.id)}
                        >
                          {t("writtenOff")}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {editId === s.id && (
              <div className="mt-3 pt-3 border-t space-y-2">
                <Input
                  label={t("gramsLent")}
                  type="number"
                  value={editGrams}
                  onChange={(e) => setEditGrams(e.target.value)}
                />
                <Input
                  label={t("resolution")}
                  value={editResolution}
                  onChange={(e) => setEditResolution(e.target.value)}
                />
                <div className="flex gap-2">
                  {s.status === "APPROVED" && (
                    <Button
                      size="sm"
                      onClick={() => updateSample(s.id, "SENT")}
                    >
                      {t("sent")}
                    </Button>
                  )}
                  {s.status === "SENT" && (
                    <Button
                      size="sm"
                      onClick={() => updateSample(s.id, "WRITTEN_OFF")}
                    >
                      {t("writtenOff")}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setEditId(null)}
                  >
                    {tCommon("cancel")}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
