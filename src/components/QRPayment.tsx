"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface QRPaymentProps {
  invoiceId: string;
  iban?: string;
  amount: number; // halere
  variableSymbol: string;
  invoiceNumber: string;
}

export function QRPayment({
  invoiceId,
  iban,
  amount,
  variableSymbol,
  invoiceNumber,
}: QRPaymentProps) {
  const t = useTranslations("invoice");
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    setQrUrl(`/api/invoices/${invoiceId}/qr`);
  }, [invoiceId]);

  const amountCZK = (amount / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 2,
  });

  const copyDetails = () => {
    const text = [
      iban ? `IBAN: ${iban}` : "",
      `${t("total")}: ${amountCZK} CZK`,
      `VS: ${variableSymbol}`,
    ]
      .filter(Boolean)
      .join("\n");
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-lg">
      <h3 className="font-medium text-sm">{t("qrPayment")}</h3>

      {qrUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={qrUrl}
          alt="QR Payment"
          width={200}
          height={200}
          className="rounded"
        />
      )}

      <div className="text-sm text-center space-y-1">
        {iban && (
          <div className="text-gray-500">
            IBAN: <span className="font-mono">{iban}</span>
          </div>
        )}
        <div>
          {t("total")}: <span className="font-bold">{amountCZK} CZK</span>
        </div>
        <div className="text-gray-500">
          VS: <span className="font-mono">{variableSymbol}</span>
        </div>
        <div className="text-gray-400 text-xs">
          {t("invoice")} {invoiceNumber}
        </div>
      </div>

      <button
        onClick={copyDetails}
        className="text-xs text-indigo-600 hover:underline"
      >
        {t("copyDetails") ?? "Copy"}
      </button>
    </div>
  );
}
