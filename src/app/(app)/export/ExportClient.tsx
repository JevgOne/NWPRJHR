"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

function startOfMonth(d: Date): string {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

function endOfMonth(d: Date): string {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
}

function startOfQuarter(d: Date): string {
  const q = Math.floor(d.getMonth() / 3) * 3;
  return new Date(d.getFullYear(), q, 1).toISOString();
}

function startOfYear(d: Date): string {
  return new Date(d.getFullYear(), 0, 1).toISOString();
}

interface Company {
  id: string;
  name: string;
  ico: string;
}

export function ExportClient() {
  const t = useTranslations("export");
  const tCommon = useTranslations("common");

  const now = new Date();
  const [from, setFrom] = useState(startOfMonth(now).slice(0, 10));
  const [to, setTo] = useState(endOfMonth(now).slice(0, 10));
  const [format, setFormat] = useState<"xlsx" | "csv">("xlsx");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedIco, setSelectedIco] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then((data) => {
        const list = data.data ?? [];
        setCompanies(list);
        if (list.length > 0) setSelectedIco(list[0].ico);
      })
      .catch(() => {});
  }, []);

  function quickSelect(preset: string) {
    const d = new Date();
    switch (preset) {
      case "thisMonth":
        setFrom(startOfMonth(d).slice(0, 10));
        setTo(endOfMonth(d).slice(0, 10));
        break;
      case "lastMonth": {
        const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1);
        setFrom(startOfMonth(prev).slice(0, 10));
        setTo(endOfMonth(prev).slice(0, 10));
        break;
      }
      case "thisQuarter":
        setFrom(startOfQuarter(d).slice(0, 10));
        setTo(endOfMonth(d).slice(0, 10));
        break;
      case "thisYear":
        setFrom(startOfYear(d).slice(0, 10));
        setTo(endOfMonth(d).slice(0, 10));
        break;
    }
  }

  async function download(type: string) {
    setDownloading(type);
    try {
      const fromISO = new Date(from).toISOString();
      const toISO = new Date(to + "T23:59:59").toISOString();

      let url: string;
      if (type === "excel") {
        url = `/api/export/excel?from=${fromISO}&to=${toISO}&format=${format}`;
      } else if (type === "pohoda") {
        url = `/api/export/pohoda?from=${fromISO}&to=${toISO}&ico=${selectedIco}`;
      } else {
        url = `/api/export/invoices-pdf?from=${fromISO}&to=${toISO}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      const disposition = res.headers.get("content-disposition");
      const filenameMatch = disposition?.match(/filename="(.+?)"/);
      a.download = filenameMatch?.[1] ?? `hairland-export.${type}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      // Error handling silently
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">{t("title")}</h1>

      {/* Period selector */}
      <Card>
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-espresso">{t("period")}</h2>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs text-muted mb-1">
                {t("from")}
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="block rounded-lg border border-line px-3 py-2 text-sm focus:border-rose focus:outline-none focus:ring-1 focus:ring-rose"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">
                {t("to")}
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="block rounded-lg border border-line px-3 py-2 text-sm focus:border-rose focus:outline-none focus:ring-1 focus:ring-rose"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              ["thisMonth", "lastMonth", "thisQuarter", "thisYear"] as const
            ).map((preset) => (
              <button
                key={preset}
                onClick={() => quickSelect(preset)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-line text-gray-600 hover:bg-nude-50 transition-colors"
              >
                {t(preset)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Export options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Excel/CSV */}
        <Card>
          <h3 className="font-semibold text-ink mb-2">{t("excel")}</h3>
          <p className="text-xs text-muted mb-4">{t("excelDesc")}</p>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setFormat("xlsx")}
              className={`px-3 py-1 text-xs rounded-lg border ${
                format === "xlsx"
                  ? "border-rose bg-rose/10 text-espresso"
                  : "border-line"
              }`}
            >
              XLSX
            </button>
            <button
              onClick={() => setFormat("csv")}
              className={`px-3 py-1 text-xs rounded-lg border ${
                format === "csv"
                  ? "border-rose bg-rose/10 text-espresso"
                  : "border-line"
              }`}
            >
              CSV
            </button>
          </div>
          <Button
            size="sm"
            onClick={() => download("excel")}
            disabled={downloading !== null}
          >
            {downloading === "excel" ? tCommon("loading") : t("download")}
          </Button>
        </Card>

        {/* Pohoda XML */}
        <Card>
          <h3 className="font-semibold text-ink mb-2">{t("pohoda")}</h3>
          <p className="text-xs text-muted mb-4">{t("pohodaDesc")}</p>
          {companies.length > 0 && (
            <select
              value={selectedIco}
              onChange={(e) => setSelectedIco(e.target.value)}
              className="block w-full rounded-lg border border-line px-3 py-2 text-sm mb-4 focus:border-rose focus:outline-none"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.ico}>
                  {c.name} ({c.ico})
                </option>
              ))}
            </select>
          )}
          <Button
            size="sm"
            onClick={() => download("pohoda")}
            disabled={downloading !== null || !selectedIco}
          >
            {downloading === "pohoda" ? tCommon("loading") : t("download")}
          </Button>
        </Card>

        {/* PDF ZIP */}
        <Card>
          <h3 className="font-semibold text-ink mb-2">{t("pdfBundle")}</h3>
          <p className="text-xs text-muted mb-4">{t("pdfBundleDesc")}</p>
          <Button
            size="sm"
            onClick={() => download("pdf")}
            disabled={downloading !== null}
          >
            {downloading === "pdf" ? tCommon("loading") : t("download")}
          </Button>
        </Card>
      </div>
    </div>
  );
}
