"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

interface ComplaintItem {
  id: string;
  grams: number;
  pieces: number;
  description: string;
  status: string;
  supplierRefundHalere?: number;
  supplierNote?: string;
  createdAt: string;
  resolvedAt?: string;
  sale: { saleNumber: string | null } | null;
  salon: { id: string; name: string } | null;
  delivery: {
    id: string;
    barcode: string | null;
    supplier: { name: string } | null;
  };
  creditNote: { id: string; number: string } | null;
  createdByUser: { name: string | null };
}

export function ComplaintsClient() {
  const t = useTranslations("complaintsMgmt");
  const tc = useTranslations("common");
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [refundModal, setRefundModal] = useState<string | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundNote, setRefundNote] = useState("");

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    const params = filter !== "ALL" ? `?status=${filter}` : "";
    const res = await fetch(`/api/complaints${params}`);
    if (res.ok) {
      setComplaints(await res.json());
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  async function handleSupplierRefund(id: string) {
    const amount = parseInt(refundAmount);
    if (!amount || amount <= 0) return;

    const res = await fetch(`/api/complaints/${id}/supplier-refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refundHalere: amount,
        note: refundNote,
      }),
    });

    if (res.ok) {
      setRefundModal(null);
      setRefundAmount("");
      setRefundNote("");
      fetchComplaints();
    }
  }

  const tabs = [
    { key: "ALL", label: tc("all") },
    { key: "OPEN", label: t("open") },
    { key: "RESOLVED", label: t("resolved") },
    { key: "SUPPLIER_CLAIM", label: t("supplierClaim") },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>

      <div className="flex gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === tab.key
                ? "bg-rose text-white"
                : "bg-nude-100 text-espresso hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted">{tc("loading")}</p>
      ) : complaints.length === 0 ? (
        <p className="text-muted">{t("noComplaints")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-nude-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">
                  {t("date")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">
                  {t("salon")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">
                  {t("delivery")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">
                  {t("supplier")}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted uppercase">
                  {t("grams")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">
                  {t("description")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">
                  {t("status")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">
                  {tc("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {complaints.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {c.salon?.name ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {c.delivery.barcode ?? c.delivery.id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {c.delivery.supplier?.name ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {c.grams}g
                    {c.pieces > 0 && ` / ${c.pieces}ks`}
                  </td>
                  <td className="px-4 py-3 text-sm max-w-xs truncate">
                    {c.description}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        c.status === "OPEN"
                          ? "bg-yellow-100 text-yellow-800"
                          : c.status === "RESOLVED"
                          ? "bg-green-100 text-green-800"
                          : "bg-nude-100 text-espresso"
                      }`}
                    >
                      {c.status === "OPEN"
                        ? t("open")
                        : c.status === "RESOLVED"
                        ? t("resolved")
                        : t("supplierClaim")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    {c.status !== "RESOLVED" && (
                      <button
                        onClick={() => setRefundModal(c.id)}
                        className="px-3 py-1 bg-rose text-white text-xs rounded hover:bg-rose-deep"
                      >
                        {t("recordRefund")}
                      </button>
                    )}
                    {c.creditNote && (
                      <span className="text-espresso text-xs ml-2">
                        {t("creditNote")}: {c.creditNote.number}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Supplier Refund Modal */}
      {refundModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{t("recordRefund")}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-espresso mb-1">
                  {t("refundAmount")} (CZK)
                </label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-espresso mb-1">
                  {t("refundNote")}
                </label>
                <textarea
                  value={refundNote}
                  onChange={(e) => setRefundNote(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setRefundModal(null)}
                  className="px-4 py-2 bg-gray-200 rounded-lg text-sm"
                >
                  {tc("cancel")}
                </button>
                <button
                  onClick={() => handleSupplierRefund(refundModal)}
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
