"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { InvoiceStatusBadge } from "@/components/invoices/InvoiceStatusBadge";
import { QRPayment } from "@/components/QRPayment";
import type { Role } from "@prisma/client";

interface InvoiceDetail {
  id: string;
  type: string;
  number: string;
  status: string;
  buyerName: string;
  buyerIco?: string;
  buyerDic?: string;
  buyerAddress: string;
  buyerEmail?: string;
  buyerLanguage: string;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  roundingAmount: number;
  variableSymbol: string;
  issueDate: string;
  dueDate: string;
  taxDate?: string;
  note?: string;
  company: {
    name: string;
    ico: string;
    dic?: string;
    address: string;
    bankAccount: string;
    bankIban?: string;
  };
  items: {
    id: string;
    description: string;
    quantity: string;
    unit: string;
    pricePerUnit: number;
    lineTotal: number;
  }[];
  payments: {
    id: string;
    amount: number;
    date: string;
    source: string;
  }[];
  sale?: { id: string; saleNumber?: string };
  originalInvoice?: { id: string; number: string };
  creditNotes?: { id: string; number: string; total: number }[];
}

function formatCZK(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function InvoiceDetailClient({
  id,
  role,
}: {
  id: string;
  role: Role;
}) {
  const t = useTranslations("invoice");
  const tCommon = useTranslations("common");
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const isOwner = role === "OWNER";
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(t("deleteConfirm"))) return;
    setDeleting(true);
    const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/invoices");
    } else {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetch(`/api/invoices/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setInvoice(data);
        const paid = (data.payments ?? []).reduce(
          (s: number, p: { amount: number }) => s + p.amount,
          0
        );
        setPayAmount(String((data.total - paid) / 100));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleRecordPayment = async () => {
    if (!invoice) return;
    const amount = Math.round(parseFloat(payAmount) * 100);
    if (isNaN(amount) || amount <= 0) return;

    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoiceId: invoice.id,
        amount,
        date: new Date(payDate).toISOString(),
        matchedVS: invoice.variableSymbol,
        source: "MANUAL",
      }),
    });

    if (res.ok) {
      // Reload invoice
      const updated = await fetch(`/api/invoices/${id}`).then((r) => r.json());
      setInvoice(updated);
      setShowPayment(false);
    }
  };

  if (loading) return <p className="text-muted">{tCommon("loading")}</p>;
  if (!invoice) return <p className="text-red-500">{tCommon("error")}</p>;

  const totalPaid = invoice.payments.reduce((s, p) => s + p.amount, 0);
  const remaining = invoice.total - totalPaid;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">
            {invoice.type === "CREDIT_NOTE" ? t("creditNote") : t("invoice")}{" "}
            {invoice.number}
          </h1>
          <InvoiceStatusBadge status={invoice.status} />
        </div>
        <div className="flex gap-2">
          <a href={`/api/invoices/${id}/pdf`} download>
            <Button variant="secondary" size="sm">
              {t("downloadPdf")}
            </Button>
          </a>
          <Link href="/invoices">
            <Button variant="secondary" size="sm">
              {tCommon("back")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Supplier + Buyer */}
      <div className="grid grid-cols-2 gap-4">
        <Card padding="sm">
          <h3 className="text-xs text-muted mb-1 uppercase">
            {t("taxDocument")}
          </h3>
          <div className="text-sm">
            <div className="font-medium">{invoice.company.name}</div>
            <div>ICO: {invoice.company.ico}</div>
            {invoice.company.dic && <div>DIC: {invoice.company.dic}</div>}
            <div className="text-muted">{invoice.company.address}</div>
          </div>
        </Card>
        <Card padding="sm">
          <h3 className="text-xs text-muted mb-1 uppercase">-</h3>
          <div className="text-sm">
            <div className="font-medium">{invoice.buyerName}</div>
            {invoice.buyerIco && <div>ICO: {invoice.buyerIco}</div>}
            {invoice.buyerDic && <div>DIC: {invoice.buyerDic}</div>}
            {invoice.buyerAddress && (
              <div className="text-muted">{invoice.buyerAddress}</div>
            )}
          </div>
        </Card>
      </div>

      {/* Meta */}
      <Card padding="sm">
        <div className="grid grid-cols-2 gap-y-1 text-sm">
          <span className="text-muted">{t("issueDate")}</span>
          <span>
            {new Date(invoice.issueDate).toLocaleDateString("cs-CZ")}
          </span>
          <span className="text-muted">{t("variableSymbol")}</span>
          <span className="font-mono">{invoice.variableSymbol}</span>
        </div>
      </Card>

      {/* Items */}
      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted">
              <th className="py-1 pr-2">-</th>
              <th className="py-1 pr-2 text-right">-</th>
              <th className="py-1 pr-2 text-right">{t("pricePerGram")}</th>
              <th className="py-1 text-right">{t("total")}</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="py-1.5 pr-2">{item.description}</td>
                <td className="py-1.5 pr-2 text-right">
                  {item.quantity} {item.unit}
                </td>
                <td className="py-1.5 pr-2 text-right">
                  {formatCZK(item.pricePerUnit)}
                </td>
                <td className="py-1.5 text-right font-medium">
                  {formatCZK(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 pt-3 border-t space-y-1 text-sm">
          <div className="flex justify-between">
            <span>{t("withoutVat")}</span>
            <span>{formatCZK(invoice.subtotal)} CZK</span>
          </div>
          <div className="flex justify-between">
            <span>{t("vat")}</span>
            <span>{formatCZK(invoice.vatAmount)} CZK</span>
          </div>
          {invoice.roundingAmount !== 0 && (
            <div className="flex justify-between text-muted">
              <span>-</span>
              <span>{formatCZK(invoice.roundingAmount)} CZK</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-1 border-t">
            <span>{t("total")}</span>
            <span>{formatCZK(invoice.total)} CZK</span>
          </div>
        </div>
      </Card>

      {/* QR Payment */}
      {invoice.type === "INVOICE" &&
        invoice.status !== "PAID" &&
        invoice.status !== "CANCELLED" &&
        invoice.company.bankIban && (
          <QRPayment
            invoiceId={invoice.id}
            iban={invoice.company.bankIban}
            amount={invoice.total}
            variableSymbol={invoice.variableSymbol}
            invoiceNumber={invoice.number}
          />
        )}

      {/* Payments */}
      {isOwner && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-sm">
              {t("paid")}: {formatCZK(totalPaid)} / {formatCZK(invoice.total)}{" "}
              CZK
            </h3>
            {remaining > 0 && invoice.status !== "CANCELLED" && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowPayment(!showPayment)}
              >
                {tCommon("add")}
              </Button>
            )}
          </div>

          {invoice.payments.map((p) => (
            <div
              key={p.id}
              className="flex justify-between text-sm border-b py-1"
            >
              <span>{new Date(p.date).toLocaleDateString("cs-CZ")}</span>
              <span className="font-medium text-green-600">
                +{formatCZK(p.amount)} CZK
              </span>
            </div>
          ))}

          {showPayment && (
            <div className="mt-3 space-y-2 pt-3 border-t">
              <Input
                label={t("total") + " (CZK)"}
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
              <Input
                label={t("dueDate")}
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
              />
              <Button size="sm" onClick={handleRecordPayment}>
                {tCommon("confirm")}
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Links */}
      {invoice.sale && (
        <Link
          href={`/sales/${invoice.sale.id}`}
          className="text-sm text-espresso hover:underline"
        >
          {invoice.sale.saleNumber || invoice.sale.id}
        </Link>
      )}

      {invoice.originalInvoice && (
        <div className="text-sm text-muted">
          {t("creditNote")}:{" "}
          <Link
            href={`/invoices/${invoice.originalInvoice.id}`}
            className="text-espresso hover:underline"
          >
            {invoice.originalInvoice.number}
          </Link>
        </div>
      )}

      {invoice.creditNotes && invoice.creditNotes.length > 0 && (
        <div className="text-sm text-muted">
          {t("creditNote")}:{" "}
          {invoice.creditNotes.map((cn) => (
            <Link
              key={cn.id}
              href={`/invoices/${cn.id}`}
              className="text-espresso hover:underline mr-2"
            >
              {cn.number}
            </Link>
          ))}
        </div>
      )}

      {isOwner && (
        <Card>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? tCommon("loading") : t("deleteInvoice")}
          </Button>
        </Card>
      )}
    </div>
  );
}
