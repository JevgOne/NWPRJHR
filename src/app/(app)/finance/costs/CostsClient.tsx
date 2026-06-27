"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface CostRow {
  id: string;
  category: string;
  amountHalere: number;
  date: string;
  description?: string;
  note?: string;
  receiptFile?: string;
  receiptName?: string;
}

const CATEGORIES = [
  "ADVERTISING",
  "MARKETING",
  "TRANSPORT",
  "RENT",
  "FEES",
  "OTHER",
] as const;

function formatCZK(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("cs-CZ");
}

export function CostsClient() {
  const t = useTranslations("finance");
  const tCommon = useTranslations("common");

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [costs, setCosts] = useState<CostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formCategory, setFormCategory] = useState<string>("ADVERTISING");
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [formDescription, setFormDescription] = useState("");
  const [formNote, setFormNote] = useState("");
  const [saving, setSaving] = useState(false);

  const categoryKeys: Record<string, string> = {
    ADVERTISING: "advertising",
    MARKETING: "marketing",
    TRANSPORT: "transport",
    RENT: "rent",
    FEES: "fees",
    OTHER: "other",
  };

  const loadCosts = useCallback(() => {
    setLoading(true);
    const from = new Date(year, month - 1, 1).toISOString();
    const to = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
    const catParam = categoryFilter ? `&category=${categoryFilter}` : "";
    fetch(`/api/costs?from=${from}&to=${to}&limit=100${catParam}`)
      .then((r) => r.json())
      .then((d) => setCosts(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year, month, categoryFilter]);

  useEffect(() => {
    loadCosts();
  }, [loadCosts]);

  function resetForm() {
    setFormCategory("ADVERTISING");
    setFormAmount("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormDescription("");
    setFormNote("");
    setEditingId(null);
    setShowForm(false);
  }

  async function handleSave() {
    setSaving(true);
    const amountHalere = Math.round(parseFloat(formAmount) * 100);
    if (isNaN(amountHalere) || amountHalere <= 0) {
      setSaving(false);
      return;
    }

    const body = {
      category: formCategory,
      amountHalere,
      date: new Date(formDate).toISOString(),
      description: formDescription || undefined,
      note: formNote || undefined,
    };

    const url = editingId ? `/api/costs/${editingId}` : "/api/costs";
    const method = editingId ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    resetForm();
    setSaving(false);
    loadCosts();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/costs/${id}`, { method: "DELETE" });
    loadCosts();
  }

  function startEdit(cost: CostRow) {
    setEditingId(cost.id);
    setFormCategory(cost.category);
    setFormAmount((cost.amountHalere / 100).toString());
    setFormDate(cost.date.split("T")[0]);
    setFormDescription(cost.description ?? "");
    setFormNote(cost.note ?? "");
    setShowForm(true);
  }

  const total = costs.reduce((s, c) => s + c.amountHalere, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("costs.title")}</h1>
        <div className="flex gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded border px-3 py-2"
          >
            <option value="">{tCommon("all")}</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t(`costs.${categoryKeys[c]}`)}
              </option>
            ))}
          </select>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded border px-3 py-2"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {(i + 1).toString().padStart(2, "0")}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded border px-3 py-2"
          >
            {Array.from({ length: 5 }, (_, i) => {
              const y = now.getFullYear() - 2 + i;
              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
          </select>
          <Button onClick={() => setShowForm(true)}>{t("addCost")}</Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <div className="space-y-3 p-4">
            <h3 className="font-semibold">
              {editingId ? t("editCost") : t("addCost")}
            </h3>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium">
                  {t("category")}
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="mt-1 w-full rounded border px-3 py-2"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {t(`costs.${categoryKeys[c]}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">
                  {t("amount")} (CZK)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="mt-1 w-full rounded border px-3 py-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("date")}</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="mt-1 w-full rounded border px-3 py-2"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">{t("description")}</label>
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t("note")}</label>
              <textarea
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? tCommon("saving") : tCommon("save")}
              </Button>
              <Button variant="secondary" onClick={resetForm}>
                {tCommon("cancel")}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {loading && <p>{tCommon("loading")}</p>}

      {!loading && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-3">{t("date")}</th>
                  <th className="p-3">{t("category")}</th>
                  <th className="p-3 text-right">{t("amount")}</th>
                  <th className="p-3">{t("description")}</th>
                  <th className="p-3">{t("receipt")}</th>
                  <th className="p-3">{tCommon("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {costs.map((cost) => (
                  <tr key={cost.id} className="border-b">
                    <td className="p-3">{formatDate(cost.date)}</td>
                    <td className="p-3">
                      {t(`costs.${categoryKeys[cost.category]}`)}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {formatCZK(cost.amountHalere)}
                    </td>
                    <td className="p-3">{cost.description}</td>
                    <td className="p-3">
                      {cost.receiptFile && (
                        <a
                          href={cost.receiptFile}
                          target="_blank"
                          className="text-espresso underline"
                        >
                          {cost.receiptName ?? t("receipt")}
                        </a>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(cost)}
                          className="text-espresso hover:underline"
                        >
                          {tCommon("edit")}
                        </button>
                        <button
                          onClick={() => handleDelete(cost.id)}
                          className="text-red-600 hover:underline"
                        >
                          {tCommon("delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {costs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-3 text-center text-gray-500">
                      {t("noCosts")}
                    </td>
                  </tr>
                )}
              </tbody>
              {costs.length > 0 && (
                <tfoot>
                  <tr className="border-t font-semibold">
                    <td className="p-3" colSpan={2}>
                      {tCommon("total")}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {formatCZK(total)}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
