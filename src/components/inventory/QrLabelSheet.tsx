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
            {labels.map((label) => (
              <div
                key={label.variantId}
                className="bg-white shadow border border-gray-200 flex items-center gap-[1.5mm] p-[1.5mm]"
                style={{ width: "40mm", height: "30mm" }}
              >
                <img
                  src={label.qrDataUrl}
                  alt="QR"
                  className="flex-shrink-0"
                  style={{ width: "20mm", height: "20mm" }}
                />
                <div className="flex-1 min-w-0 overflow-hidden flex flex-col justify-center">
                  <div className="text-[8px] font-bold text-ink leading-tight font-mono">
                    {generateSku(label.category, label.texture, label.color, label.lengthCm)}
                  </div>
                  <div className="text-[6px] text-muted leading-tight mt-[0.5mm] truncate">
                    {label.productName}
                  </div>
                  <div className="text-[6px] text-muted leading-tight mt-[0.5mm]">
                    {label.lengthCm}cm · {label.color}
                  </div>
                  <div className="text-[5px] text-muted/40 mt-[0.5mm] font-mono truncate">
                    {label.variantId.slice(-8)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Print-only content — one label per page for thermal printer */}
      <div className="print-only hidden">
        {labels.map((label) => (
          <div key={label.variantId} className="qr-label">
            <img
              src={label.qrDataUrl}
              alt="QR"
              style={{ width: "20mm", height: "20mm", flexShrink: 0 }}
            />
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: "8px", fontWeight: "bold", lineHeight: 1.2, fontFamily: "monospace" }}>
                {generateSku(label.category, label.texture, label.color, label.lengthCm)}
              </div>
              <div style={{ fontSize: "6px", color: "#444", marginTop: "0.5mm" }}>
                {label.productName}
              </div>
              <div style={{ fontSize: "6px", color: "#444", marginTop: "0.5mm" }}>
                {label.lengthCm}cm · {label.color}
              </div>
              <div style={{ fontSize: "5px", color: "#aaa", marginTop: "0.5mm", fontFamily: "monospace" }}>
                {label.variantId.slice(-8)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
