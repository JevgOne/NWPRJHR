"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";

interface ReservationLabelData {
  id: string;
  reservationNumber?: string;
  customerName: string;
  contactEmail?: string;
  contactPhone?: string;
  productName: string;
  color: string;
  lengthCm: number;
  grams: number;
  pieces: number;
  sellingMode: string;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

export function ReservationLabel({
  data,
  onClose,
}: {
  data: ReservationLabelData;
  onClose: () => void;
}) {
  const t = useTranslations("reservation");
  const tCommon = useTranslations("common");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const QRCode = await import("qrcode");
      const url = `${window.location.origin}/reservations/${data.id}`;
      const dataUrl = await QRCode.toDataURL(url, {
        errorCorrectionLevel: "M",
        width: 100,
        margin: 0,
      });
      if (!cancelled) {
        setQrDataUrl(dataUrl);
        setGenerating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [data.id]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const initials = getInitials(data.customerName);
  const contact = data.contactPhone || data.contactEmail || "";
  const qty =
    data.sellingMode === "BY_PIECE"
      ? `${data.pieces} ks`
      : `${data.grams} g`;

  if (generating) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-rose border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-muted">{t("generatingLabel")}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Screen overlay with controls */}
      <div className="fixed inset-0 z-50 bg-black/50 flex flex-col no-print">
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-muted">{t("labelPreview")}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-rose text-white text-sm font-medium rounded-lg hover:bg-rose-deep transition-colors"
            >
              {t("printLabel")}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-line text-sm font-medium rounded-lg hover:bg-nude-50 transition-colors"
            >
              {tCommon("close")}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6 bg-gray-100 flex items-center justify-center">
          <div
            className="bg-white shadow border border-gray-200 flex items-start gap-[1.5mm] p-[2mm]"
            style={{ width: "40mm", height: "30mm" }}
          >
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt="QR"
                className="flex-shrink-0"
                style={{ width: "16mm", height: "16mm" }}
              />
            )}
            <div className="flex-1 min-w-0 overflow-hidden flex flex-col justify-start">
              <div className="text-[14px] font-bold text-ink leading-none">
                {initials || "—"}
              </div>
              <div className="text-[7px] text-ink leading-tight mt-[0.5mm] truncate font-medium">
                {data.customerName}
              </div>
              {contact && (
                <div className="text-[6px] text-muted leading-tight mt-[0.3mm] truncate">
                  {contact}
                </div>
              )}
              {data.reservationNumber && (
                <div className="text-[8px] font-bold text-ink leading-tight mt-[0.5mm] font-mono">
                  R-{data.reservationNumber}
                </div>
              )}
              <div className="text-[6px] text-muted leading-tight mt-[0.3mm] truncate">
                {data.productName} {data.lengthCm}cm
              </div>
              <div className="text-[6px] text-muted leading-tight mt-[0.3mm]">
                {data.color} · {qty}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print-only content */}
      <div className="print-only hidden">
        <div className="qr-label">
          {qrDataUrl && (
            <img
              src={qrDataUrl}
              alt="QR"
              style={{ width: "16mm", height: "16mm", flexShrink: 0 }}
            />
          )}
          <div
            style={{
              flex: 1,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                lineHeight: 1,
              }}
            >
              {initials || "—"}
            </div>
            <div
              style={{
                fontSize: "7px",
                fontWeight: 500,
                lineHeight: 1.2,
                marginTop: "0.5mm",
              }}
            >
              {data.customerName}
            </div>
            {contact && (
              <div
                style={{
                  fontSize: "6px",
                  color: "#444",
                  marginTop: "0.3mm",
                }}
              >
                {contact}
              </div>
            )}
            {data.reservationNumber && (
              <div
                style={{
                  fontSize: "8px",
                  fontWeight: "bold",
                  lineHeight: 1.2,
                  marginTop: "0.5mm",
                  fontFamily: "monospace",
                }}
              >
                R-{data.reservationNumber}
              </div>
            )}
            <div
              style={{
                fontSize: "6px",
                color: "#444",
                marginTop: "0.3mm",
              }}
            >
              {data.productName} {data.lengthCm}cm
            </div>
            <div
              style={{
                fontSize: "6px",
                color: "#444",
                marginTop: "0.3mm",
              }}
            >
              {data.color} · {qty}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
