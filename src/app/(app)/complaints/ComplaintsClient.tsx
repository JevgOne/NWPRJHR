"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { UserBadge } from "@/components/ui/UserBadge";

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

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  RESOLVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

export function ComplaintsClient() {
  const t = useTranslations("complaintTickets");
  const tc = useTranslations("common");
  const tNav = useTranslations("complaintsMgmt");

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNote, setEditNote] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    const params = filter !== "ALL" ? `?status=${filter}` : "";
    const res = await fetch(`/api/complaint-tickets${params}`);
    if (res.ok) {
      setTickets(await res.json());
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  function openEdit(ticket: Ticket) {
    setEditingId(ticket.id);
    setEditStatus(ticket.status);
    setEditNote(ticket.adminNote ?? "");
  }

  async function handleSave(id: string) {
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

  const tabs = [
    { key: "ALL", label: tc("all") },
    { key: "NEW", label: t("new") },
    { key: "IN_PROGRESS", label: t("inProgress") },
    { key: "RESOLVED", label: t("resolved") },
    { key: "REJECTED", label: t("rejected") },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{tNav("title")}</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
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
      ) : tickets.length === 0 ? (
        <p className="text-muted">{t("noTickets")}</p>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => {
            const isExpanded = expandedId === ticket.id;
            const isEditing = editingId === ticket.id;
            const photos = parsePhotos(ticket.photos);

            return (
              <div
                key={ticket.id}
                className="bg-white border border-line rounded-lg overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : ticket.id)
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
                    {t(`type_${ticket.complaintType}`)}
                  </span>
                  {ticket.assignedTo && (
                    <span className="text-xs font-medium">
                      <UserBadge name={ticket.assignedTo} />
                    </span>
                  )}
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      STATUS_COLORS[ticket.status] ?? "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {t(`status_${ticket.status}`)}
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
                        <Detail label={t("name")} value={ticket.name} />
                        <Detail label={t("email")} value={ticket.email} />
                        <Detail
                          label={t("phone")}
                          value={ticket.phone ?? "—"}
                        />
                        <Detail
                          label={t("customerType")}
                          value={t(`custType_${ticket.customerType}`)}
                        />
                        {ticket.salonName && (
                          <Detail
                            label={t("salonName")}
                            value={ticket.salonName}
                          />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Detail
                          label={t("complaintType")}
                          value={t(`type_${ticket.complaintType}`)}
                        />
                        <Detail
                          label={t("orderNumber")}
                          value={ticket.orderNumber ?? "—"}
                        />
                        <Detail
                          label={t("desiredResolution")}
                          value={
                            ticket.desiredResolution
                              ? t(`resolution_${ticket.desiredResolution}`)
                              : "—"
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs font-medium text-muted uppercase mb-1">
                        {t("description")}
                      </p>
                      <p className="text-sm text-ink whitespace-pre-wrap bg-nude-50 rounded-lg p-3">
                        {ticket.description}
                      </p>
                    </div>

                    {photos.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-muted uppercase mb-2">
                          {t("photos")}
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
                                alt={`${t("photos")} ${i + 1}`}
                                className="w-24 h-24 object-cover rounded border border-line"
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-line">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-muted uppercase mb-1">
                              {t("status")}
                            </label>
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value)}
                              className="border border-line rounded-lg px-3 py-2 text-sm w-full max-w-xs"
                            >
                              <option value="NEW">{t("new")}</option>
                              <option value="IN_PROGRESS">
                                {t("inProgress")}
                              </option>
                              <option value="RESOLVED">
                                {t("resolved")}
                              </option>
                              <option value="REJECTED">
                                {t("rejected")}
                              </option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted uppercase mb-1">
                              {t("adminNote")}
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
                              onClick={() => handleSave(ticket.id)}
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
                                  {t("adminNote")}
                                </p>
                                <p className="text-sm text-ink">
                                  {ticket.adminNote}
                                </p>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => openEdit(ticket)}
                            className="px-3 py-1.5 bg-rose text-white text-xs rounded-lg hover:bg-rose-deep"
                          >
                            {t("edit")}
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
