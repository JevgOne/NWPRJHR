"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { generateSku } from "@/lib/sku";

interface LabelData {
  variantId: string;
  productName: string;
  lengthCm: number;
  color: string;
  category: string;
  texture?: string | null;
  grams?: number;
}

interface QrLabel extends LabelData {
  qrDataUrl: string;
}

export function QrLabelSheet({
  items,
  onClose,
}: {
  items: LabelData[];
  onClose: () => void;
}) {
  const t = useTranslations("stock");
  const tCommon = useTranslations("common");
  const [labels, setLabels] = useState<QrLabel[]>([]);
  const [generating, setGenerating] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const QRCode = await import("qrcode");
      const results: QrLabel[] = [];
      for (const item of items) {
        if (cancelled) return;
        const url = `${window.location.origin}/sales/new?variantId=${item.variantId}`;
        const dataUrl = await QRCode.toDataURL(url, {
          errorCorrectionLevel: "M",
          width: 100,
          margin: 0,
        });
        results.push({ ...item, qrDataUrl: dataUrl });
      }
      if (!cancelled) {
        setLabels(results);
        setGenerating(false);
      }
    })();
    return () => { cancelled = true; };
  }, [items]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (generating) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-rose border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-muted">
            {t("generatingLabels")} ({items.length})
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Screen overlay with controls */}
      <div className="fixed inset-0 z-50 bg-black/50 flex flex-col no-print">
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-muted">
            {t("printLabels")} — {labels.length} {t("labelCount", { count: labels.length })}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-rose text-white text-sm font-medium rounded-lg hover:bg-rose-deep transition-colors"
            >
              {t("printLabels")}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-line text-sm font-medium rounded-lg hover:bg-nude-50 transition-colors"
            >
              {tCommon("close")}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6 bg-gray-100">
          <div className="flex flex-wrap gap-4 justify-center">
            {labels.map((label) => {
              const sku = generateSku(label.category, label.texture, label.color, label.lengthCm);
              return (
                <div
                  key={label.variantId}
                  className="bg-white shadow border border-gray-200 flex flex-col items-center justify-between p-[1.5mm]"
                  style={{ width: "40mm", height: "30mm" }}
                >
                  <div className="text-[13px] font-bold text-ink leading-none font-mono text-center w-full tracking-tight">
                    {sku}
                  </div>
                  <div className="text-[11px] font-semibold text-ink leading-none text-center">
                    {label.lengthCm} cm{label.grams ? ` · ${label.grams} g` : ""}
                  </div>
                  <img
                    src={label.qrDataUrl}
                    alt="QR"
                    className="flex-shrink-0"
                    style={{ width: "17mm", height: "17mm" }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Print-only content — one label per page for thermal printer */}
      <div className="print-only hidden">
        {labels.map((label) => {
          const sku = generateSku(label.category, label.texture, label.color, label.lengthCm);
          return (
            <div key={label.variantId} className="qr-label" style={{ flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "1.5mm" }}>
              <div style={{ fontSize: "13px", fontWeight: "bold", lineHeight: 1, fontFamily: "monospace", textAlign: "center", width: "100%", letterSpacing: "-0.5px" }}>
                {sku}
              </div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "#000", textAlign: "center", lineHeight: 1 }}>
                {label.lengthCm} cm{label.grams ? ` · ${label.grams} g` : ""}
              </div>
              <img
                src={label.qrDataUrl}
                alt="QR"
                style={{ width: "17mm", height: "17mm", flexShrink: 0 }}
              />
            </div>
          );
        })}
      </div>
    </>
  );
}
