"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

interface Receivable {
  invoiceId: string;
  invoiceNumber: string;
  salonId: string | null;
  salonName: string | null;
  customerId: string | null;
  customerName: string | null;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  daysOverdue: number;
  status: string;
}

interface ReceivablesData {
  receivables: Receivable[];
  totalOwed: number;
  overdueCount: number;
  overdueAmount: number;
}

export function PaymentsClient() {
  const t = useTranslations("paymentsMgmt");
  const tc = useTranslations("common");
  const [data, setData] = useState<ReceivablesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState<Receivable | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/payments/receivables");
    if (res.ok) {
      setData(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function formatCZK(halere: number) {
    return `${Math.round(halere / 100).toLocaleString("cs-CZ")} CZK`;
  }

  async function handleRecordPayment() {
    if (!payModal) return;
    const amount = parseInt(payAmount);
    if (!amount || amount <= 0) return;

    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoiceId: payModal.invoiceId,
        amount,
        date: new Date().toISOString(),
        source: "MANUAL",
        note: payNote || undefined,
      }),
    });

    if (res.ok) {
      setPayModal(null);
      setPayAmount("");
      setPayNote("");
      fetchData();
    }
  }

  async function handleSendReminder(invoiceId: string) {
    await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId }),
    });
  }

  if (loading) return <p className="text-gray-500">{tc("loading")}</p>;
  if (!data) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-500">{t("totalReceivables")}</div>
          <div className="text-2xl font-bold">{formatCZK(data.totalOwed)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-red-200">
          <div className="text-sm text-red-600">{t("overdue")}</div>
          <div className="text-2xl font-bold text-red-600">
            {data.overdueCount} ({formatCZK(data.overdueAmount)})
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-500">{t("invoiceCount")}</div>
          <div className="text-2xl font-bold">
            {data.receivables.length}
          </div>
        </div>
      </div>

      {/* Receivables table */}
      {data.receivables.length === 0 ? (
        <p className="text-gray-500">{t("noReceivables")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t("invoiceNumber")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t("customer")}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  {tc("total")}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  {t("paid")}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  {t("remaining")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t("dueDate")}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  {t("daysOverdue")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {tc("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.receivables.map((r) => (
                <tr
                  key={r.invoiceId}
                  className={
                    r.daysOverdue > 0 ? "bg-red-50" : r.paidAmount > 0 ? "bg-yellow-50" : ""
                  }
                >
                  <td className="px-4 py-3 text-sm font-medium">
                    {r.invoiceNumber}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {r.salonName ?? r.customerName ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {formatCZK(r.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {formatCZK(r.paidAmount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium">
                    {formatCZK(r.remainingAmount)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(r.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {r.daysOverdue > 0 ? (
                      <span className="text-red-600 font-medium">
                        {r.daysOverdue}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setPayModal(r);
                          setPayAmount(r.remainingAmount.toString());
                        }}
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                      >
                        {t("recordPayment")}
                      </button>
                      {r.daysOverdue > 0 && r.salonId && (
                        <button
                          onClick={() => handleSendReminder(r.invoiceId)}
                          className="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700"
                        >
                          {t("sendReminder")}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Modal */}
      {payModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              {t("recordPayment")}: {payModal.invoiceNumber}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("amount")} ({t("halere")})
                </label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t("remaining")}: {formatCZK(payModal.remainingAmount)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("note")}
                </label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setPayModal(null)}
                  className="px-4 py-2 bg-gray-200 rounded-lg text-sm"
                >
                  {tc("cancel")}
                </button>
                <button
                  onClick={handleRecordPayment}
                  className="px-4 py-2 bg-rose text-white rounded-lg text-sm"
                >
                  {tc("save")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
