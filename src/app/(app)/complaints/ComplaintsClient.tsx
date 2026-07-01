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

interface Ticket {
  id: string;
  ticketNumber: string;
  customerType: string;
  name: string;
  email: string;
  phone: string | null;
  salonName: string | null;
  complaintType: string;
  orderNumber: string | null;
  description: string;
  photos: string;
  desiredResolution: string | null;
  status: string;
  assignedTo: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}

const TICKET_STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  RESOLVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

type Section = "internal" | "tickets";

export function ComplaintsClient() {
  const t = useTranslations("complaintsMgmt");
  const tt = useTranslations("complaintTickets");
  const tc = useTranslations("common");

  const [section, setSection] = useState<Section>("internal");

  // Internal complaints state
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refundModal, setRefundModal] = useState<string | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundNote, setRefundNote] = useState("");

  // Tickets state
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketFilter, setTicketFilter] = useState("ALL");
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketExpandedId, setTicketExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNote, setEditNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch internal complaints
  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    const params = filter !== "ALL" ? `?status=${filter}` : "";
    const res = await fetch(`/api/complaints${params}`);
    if (res.ok) {
      setComplaints(await res.json());
    }
    setLoading(false);
  }, [filter]);

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    setTicketsLoading(true);
    const params = ticketFilter !== "ALL" ? `?status=${ticketFilter}` : "";
    const res = await fetch(`/api/complaint-tickets${params}`);
    if (res.ok) {
      setTickets(await res.json());
    }
    setTicketsLoading(false);
  }, [ticketFilter]);

  useEffect(() => {
    if (section === "internal") {
      fetchComplaints();
    } else {
      fetchTickets();
    }
  }, [section, fetchComplaints, fetchTickets]);

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

  async function handleResolve(id: string) {
    const res = await fetch(`/api/complaints/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "RESOLVED" }),
    });
    if (res.ok) fetchComplaints();
  }

  function openTicketEdit(ticket: Ticket) {
    setEditingId(ticket.id);
    setEditStatus(ticket.status);
    setEditNote(ticket.adminNote ?? "");
  }

  async function handleTicketSave(id: string) {
    setSaving(true);
    const res = await fetch(`/api/complaint-tickets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: editStatus,
        adminNote: editNote,
      }),
    });
    if (res.ok) {
      setEditingId(null);
      fetchTickets();
    }
    setSaving(false);
  }

  function parsePhotos(photosJson: string): string[] {
    try {
      return JSON.parse(photosJson);
    } catch {
      return [];
    }
  }

  const internalTabs = [
    { key: "ALL", label: tc("all") },
    { key: "OPEN", label: t("open") },
    { key: "RESOLVED", label: t("resolved") },
    { key: "SUPPLIER_CLAIM", label: t("supplierClaim") },
  ];

  const ticketTabs = [
    { key: "ALL", label: tc("all") },
    { key: "NEW", label: tt("new") },
    { key: "IN_PROGRESS", label: tt("inProgress") },
    { key: "RESOLVED", label: tt("resolved") },
    { key: "REJECTED", label: tt("rejected") },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>

      {/* Section toggle */}
      <div className="flex gap-1 mb-4 bg-nude-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setSection("internal")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            section === "internal"
              ? "bg-white text-espresso shadow-sm"
              : "text-muted hover:text-espresso"
          }`}
        >
          {t("internalComplaints")}
        </button>
        <button
          onClick={() => setSection("tickets")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            section === "tickets"
              ? "bg-white text-espresso shadow-sm"
              : "text-muted hover:text-espresso"
          }`}
        >
          {tt("title")}
        </button>
      </div>

      {/* ===== INTERNAL COMPLAINTS ===== */}
      {section === "internal" && (
        <>
          <div className="flex gap-2 mb-4">
            {internalTabs.map((tab) => (
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
            <div className="space-y-2">
              {complaints.map((c) => {
                const isExpanded = expandedId === c.id;

                return (
                  <div
                    key={c.id}
                    className="bg-white border border-line rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : c.id)}
                      className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-nude-50 transition-colors"
                    >
                      <span className="text-xs text-muted whitespace-nowrap min-w-[80px]">
                        {new Date(c.createdAt).toLocaleDateString("cs-CZ")}
                      </span>

                      <span className="text-sm font-medium text-ink truncate flex-1">
                        {c.salon?.name ?? "—"}
                      </span>

                      <span className="text-xs text-muted hidden sm:inline">
                        {c.delivery.supplier?.name ?? "—"}
                      </span>

                      <span className="text-xs text-muted hidden sm:inline">
                        {c.grams}g{c.pieces > 0 ? ` / ${c.pieces}ks` : ""}
                      </span>

                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
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

                      <svg
                        className={`w-4 h-4 text-muted transition-transform flex-shrink-0 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-line">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="space-y-2">
                            <Detail label={t("salon")} value={c.salon?.name ?? "—"} />
                            <Detail
                              label={t("delivery")}
                              value={c.delivery.barcode ?? c.delivery.id.slice(0, 8)}
                            />
                            <Detail
                              label={t("supplier")}
                              value={c.delivery.supplier?.name ?? "—"}
                            />
                            <Detail label={t("grams")} value={`${c.grams}g${c.pieces > 0 ? ` / ${c.pieces}ks` : ""}`} />
                          </div>
                          <div className="space-y-2">
                            <Detail
                              label={t("date")}
                              value={new Date(c.createdAt).toLocaleString("cs-CZ")}
                            />
                            {c.sale?.saleNumber && (
                              <Detail label={t("saleNumber")} value={c.sale.saleNumber} />
                            )}
                            <Detail
                              label={t("createdBy")}
                              value={c.createdByUser?.name ?? "—"}
                            />
                            {c.resolvedAt && (
                              <Detail
                                label={t("resolvedAt")}
                                value={new Date(c.resolvedAt).toLocaleString("cs-CZ")}
                              />
                            )}
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-xs font-medium text-muted uppercase mb-1">
                            {t("description")}
                          </p>
                          <p className="text-sm text-ink whitespace-pre-wrap bg-nude-50 rounded-lg p-3">
                            {c.description}
                          </p>
                        </div>

                        {c.supplierRefundHalere !== undefined && c.supplierRefundHalere > 0 && (
                          <div className="mt-3 p-3 bg-emerald-50 rounded-lg">
                            <p className="text-xs font-medium text-emerald-700 uppercase mb-1">
                              {t("recordRefund")}
                            </p>
                            <p className="text-sm text-emerald-800 font-semibold">
                              {(c.supplierRefundHalere / 100).toFixed(2)} Kč
                            </p>
                            {c.supplierNote && (
                              <p className="text-xs text-emerald-700 mt-1">{c.supplierNote}</p>
                            )}
                          </div>
                        )}

                        {c.creditNote && (
                          <div className="mt-3">
                            <span className="text-xs text-espresso font-medium">
                              {t("creditNote")}: {c.creditNote.number}
                            </span>
                          </div>
                        )}

                        <div className="mt-4 pt-3 border-t border-line flex gap-2">
                          {c.status !== "RESOLVED" && (
                            <>
                              <button
                                onClick={() => setRefundModal(c.id)}
                                className="px-3 py-1.5 bg-rose text-white text-xs rounded-lg hover:bg-rose-deep"
                              >
                                {t("recordRefund")}
                              </button>
                              <button
                                onClick={() => handleResolve(c.id)}
                                className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700"
                              >
                                {t("resolved")}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
        </>
      )}

      {/* ===== CUSTOMER TICKETS ===== */}
      {section === "tickets" && (
        <>
          <div className="flex gap-2 mb-4 flex-wrap">
            {ticketTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setTicketFilter(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  ticketFilter === tab.key
                    ? "bg-rose text-white"
                    : "bg-nude-100 text-espresso hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {ticketsLoading ? (
            <p className="text-muted">{tc("loading")}</p>
          ) : tickets.length === 0 ? (
            <p className="text-muted">{tt("noTickets")}</p>
          ) : (
            <div className="space-y-2">
              {tickets.map((ticket) => {
                const isExpanded = ticketExpandedId === ticket.id;
                const isEditing = editingId === ticket.id;
                const photos = parsePhotos(ticket.photos);

                return (
                  <div
                    key={ticket.id}
                    className="bg-white border border-line rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setTicketExpandedId(isExpanded ? null : ticket.id)
                      }
                      className="w-full px-4 py-3 flex items-center gap-4 text-left hover:bg-nude-50 transition-colors"
                    >
                      <span className="text-sm font-mono text-muted min-w-[100px]">
                        {ticket.ticketNumber}
                      </span>
                      <span className="text-sm font-medium text-ink flex-1 truncate">
                        {ticket.name}
                      </span>
                      <span className="text-xs text-muted hidden sm:inline">
                        {tt(`type_${ticket.complaintType}`)}
                      </span>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          TICKET_STATUS_COLORS[ticket.status] ?? "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {tt(`status_${ticket.status}`)}
                      </span>
                      <span className="text-xs text-muted whitespace-nowrap">
                        {new Date(ticket.createdAt).toLocaleDateString("cs-CZ")}
                      </span>
                      <svg
                        className={`w-4 h-4 text-muted transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-line">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="space-y-2">
                            <Detail label={tt("name")} value={ticket.name} />
                            <Detail label={tt("email")} value={ticket.email} />
                            <Detail
                              label={tt("phone")}
                              value={ticket.phone ?? "—"}
                            />
                            <Detail
                              label={tt("customerType")}
                              value={tt(`custType_${ticket.customerType}`)}
                            />
                            {ticket.salonName && (
                              <Detail
                                label={tt("salonName")}
                                value={ticket.salonName}
                              />
                            )}
                          </div>
                          <div className="space-y-2">
                            <Detail
                              label={tt("complaintType")}
                              value={tt(`type_${ticket.complaintType}`)}
                            />
                            <Detail
                              label={tt("orderNumber")}
                              value={ticket.orderNumber ?? "—"}
                            />
                            <Detail
                              label={tt("desiredResolution")}
                              value={
                                ticket.desiredResolution
                                  ? tt(`resolution_${ticket.desiredResolution}`)
                                  : "—"
                              }
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-xs font-medium text-muted uppercase mb-1">
                            {tt("description")}
                          </p>
                          <p className="text-sm text-ink whitespace-pre-wrap bg-nude-50 rounded-lg p-3">
                            {ticket.description}
                          </p>
                        </div>

                        {photos.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs font-medium text-muted uppercase mb-2">
                              {tt("photos")}
                            </p>
                            <div className="flex gap-2 flex-wrap">
                              {photos.map((url, i) => (
                                <a
                                  key={i}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <img
                                    src={url}
                                    alt={`${tt("photos")} ${i + 1}`}
                                    className="w-24 h-24 object-cover rounded border border-line"
                                  />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Status change / admin note */}
                        <div className="mt-4 pt-4 border-t border-line">
                          {isEditing ? (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-muted uppercase mb-1">
                                  {tt("status")}
                                </label>
                                <select
                                  value={editStatus}
                                  onChange={(e) => setEditStatus(e.target.value)}
                                  className="border border-line rounded-lg px-3 py-2 text-sm w-full max-w-xs"
                                >
                                  <option value="NEW">{tt("new")}</option>
                                  <option value="IN_PROGRESS">
                                    {tt("inProgress")}
                                  </option>
                                  <option value="RESOLVED">
                                    {tt("resolved")}
                                  </option>
                                  <option value="REJECTED">
                                    {tt("rejected")}
                                  </option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-muted uppercase mb-1">
                                  {tt("adminNote")}
                                </label>
                                <textarea
                                  value={editNote}
                                  onChange={(e) => setEditNote(e.target.value)}
                                  className="w-full border border-line rounded-lg px-3 py-2 text-sm"
                                  rows={3}
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleTicketSave(ticket.id)}
                                  disabled={saving}
                                  className="px-4 py-2 bg-rose text-white text-sm rounded-lg hover:bg-rose-deep disabled:opacity-50"
                                >
                                  {saving ? tc("loading") : tc("save")}
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="px-4 py-2 bg-gray-200 text-sm rounded-lg"
                                >
                                  {tc("cancel")}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between">
                              <div>
                                {ticket.adminNote && (
                                  <div>
                                    <p className="text-xs font-medium text-muted uppercase mb-1">
                                      {tt("adminNote")}
                                    </p>
                                    <p className="text-sm text-ink">
                                      {ticket.adminNote}
                                    </p>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => openTicketEdit(ticket)}
                                className="px-3 py-1.5 bg-rose text-white text-xs rounded-lg hover:bg-rose-deep"
                              >
                                {tt("edit")}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted uppercase">{label}</p>
      <p className="text-sm text-ink">{value}</p>
    </div>
  );
}
