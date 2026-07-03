"use client";

import { useState, useEffect, useCallback } from "react";
import { getHairColor } from "@/lib/hair-colors";

interface InquiryItem {
  id: string;
  productName: string;
  lengthCm: number;
  color: string;
  quantity: number;
  unit: string;
}

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  salonName: string | null;
  message: string | null;
  locale: string;
  promoCode: string | null;
  promoDiscount: { type: string; value: number; label: string } | null;
  status: string;
  assignedTo: string | null;
  assignedAt: string | null;
  internalNote: string | null;
  contactedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  items: InquiryItem[];
}

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800",
  CONTACTED: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "Nová",
  CONTACTED: "Kontaktováno",
  COMPLETED: "Dokončeno",
  CANCELLED: "Zrušeno",
};

const COLOR_NAMES: Record<string, string> = {
  "1": "Platinová blond",
  "2": "Světlá blond",
  "3": "Zlatá blond",
  "4": "Přírodní hnědá",
  "5": "Karamelová",
  "6": "Tmavá blond",
  "7": "Středně hnědá",
  "8": "Tmavě hnědá",
  "9": "Tmavá",
  "10": "Černá",
};

function itemCount(n: number): string {
  if (n === 1) return "1 položka";
  if (n >= 2 && n <= 4) return `${n} položky`;
  return `${n} položek`;
}

export function InquiriesClient() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editAssigned, setEditAssigned] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    const params = filter !== "ALL" ? `?status=${filter}` : "";
    const res = await fetch(`/api/inquiries${params}`);
    if (res.ok) {
      setInquiries(await res.json());
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  function openEdit(inq: Inquiry) {
    setEditingId(inq.id);
    setEditStatus(inq.status);
    setEditNote(inq.internalNote ?? "");
    setEditAssigned(inq.assignedTo ?? "");
  }

  async function handleSave(id: string) {
    setSaving(true);
    const res = await fetch(`/api/inquiries/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: editStatus,
        internalNote: editNote,
        assignedTo: editAssigned,
      }),
    });
    if (res.ok) {
      setEditingId(null);
      fetchInquiries();
    }
    setSaving(false);
  }

  const tabs = [
    { key: "ALL", label: "Vše" },
    { key: "NEW", label: "Nové" },
    { key: "CONTACTED", label: "Kontaktováno" },
    { key: "COMPLETED", label: "Dokončeno" },
    { key: "CANCELLED", label: "Zrušeno" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Poptávky</h1>

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
        <p className="text-muted">Načítání...</p>
      ) : inquiries.length === 0 ? (
        <p className="text-muted">Žádné poptávky</p>
      ) : (
        <div className="space-y-2">
          {inquiries.map((inq) => {
            const isExpanded = expandedId === inq.id;
            const isEditing = editingId === inq.id;

            return (
              <div
                key={inq.id}
                className="bg-white border border-line rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : inq.id)}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-nude-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-ink truncate">
                        {inq.name}
                      </span>
                      <span className="text-xs text-muted truncate hidden sm:inline">
                        {inq.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted">
                        {itemCount(inq.items.length)}
                      </span>
                      {inq.salonName && (
                        <span className="text-xs text-muted">
                          · {inq.salonName}
                        </span>
                      )}
                      {inq.assignedTo && (
                        <span className="text-xs text-green-700 font-medium">
                          · Vyřizuje: {inq.assignedTo}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                      STATUS_COLORS[inq.status] ?? "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {STATUS_LABELS[inq.status] ?? inq.status}
                  </span>
                  <span className="text-xs text-muted whitespace-nowrap">
                    {new Date(inq.createdAt).toLocaleDateString("cs-CZ")}
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
                    {/* Contact info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Detail label="Zákazník" value={inq.name} />
                        <Detail label="E-mail" value={inq.email} />
                        {inq.phone && <Detail label="Telefon" value={inq.phone} />}
                        {inq.salonName && <Detail label="Salon" value={inq.salonName} />}
                        {inq.promoCode && (
                          <Detail
                            label="Promo kód"
                            value={`${inq.promoCode}${inq.promoDiscount ? ` (sleva ${inq.promoDiscount.label})` : ""}`}
                          />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Detail
                          label="Datum poptávky"
                          value={new Date(inq.createdAt).toLocaleString("cs-CZ")}
                        />
                        {inq.assignedTo && (
                          <Detail
                            label="Vyřizuje"
                            value={`${inq.assignedTo}${inq.assignedAt ? ` od ${new Date(inq.assignedAt).toLocaleString("cs-CZ")}` : ""}`}
                          />
                        )}
                        {inq.contactedAt && (
                          <Detail
                            label="Kontaktováno dne"
                            value={new Date(inq.contactedAt).toLocaleString("cs-CZ")}
                          />
                        )}
                        {inq.completedAt && (
                          <Detail
                            label="Dokončeno dne"
                            value={new Date(inq.completedAt).toLocaleString("cs-CZ")}
                          />
                        )}
                      </div>
                    </div>

                    {/* Items */}
                    <div className="mt-4">
                      <p className="text-xs font-medium text-muted uppercase mb-2">
                        Poptávané vlasy ({itemCount(inq.items.length)})
                      </p>
                      <div className="space-y-1">
                        {inq.items.map((item) => {
                          const hc = getHairColor(item.color);
                          const colorName = COLOR_NAMES[item.color] ?? `Odstín ${item.color}`;
                          return (
                            <div
                              key={item.id}
                              className="flex items-center gap-3 text-sm bg-nude-50 rounded-lg px-3 py-2"
                            >
                              <span
                                className="w-5 h-5 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                                style={{ backgroundColor: hc.hex }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{item.productName}</div>
                                <div className="text-xs text-muted">
                                  {item.lengthCm} cm · {colorName} (#{item.color}) · {item.quantity} {item.unit}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {inq.message && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-muted uppercase mb-1">
                          Poznámka od zákazníka
                        </p>
                        <p className="text-sm text-ink whitespace-pre-wrap bg-nude-50 rounded-lg p-3">
                          {inq.message}
                        </p>
                      </div>
                    )}

                    {/* Edit / Note */}
                    <div className="mt-4 pt-4 border-t border-line">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-muted uppercase mb-1">
                              Stav poptávky
                            </label>
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value)}
                              className="border border-line rounded-lg px-3 py-2 text-sm w-full max-w-xs"
                            >
                              <option value="NEW">Nová</option>
                              <option value="CONTACTED">Kontaktováno</option>
                              <option value="COMPLETED">Dokončeno</option>
                              <option value="CANCELLED">Zrušeno</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted uppercase mb-1">
                              Kdo vyřizuje
                            </label>
                            <input
                              value={editAssigned}
                              onChange={(e) => setEditAssigned(e.target.value)}
                              className="border border-line rounded-lg px-3 py-2 text-sm w-full max-w-xs"
                              placeholder="Jméno pracovníka"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted uppercase mb-1">
                              Interní poznámka
                            </label>
                            <textarea
                              value={editNote}
                              onChange={(e) => setEditNote(e.target.value)}
                              className="w-full border border-line rounded-lg px-3 py-2 text-sm"
                              rows={3}
                              placeholder="Poznámka viditelná pouze pro adminy..."
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSave(inq.id)}
                              disabled={saving}
                              className="px-4 py-2 bg-rose text-white text-sm rounded-lg hover:bg-rose-deep disabled:opacity-50"
                            >
                              {saving ? "Ukládání..." : "Uložit"}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-4 py-2 bg-gray-200 text-sm rounded-lg"
                            >
                              Zrušit
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div>
                            {inq.internalNote && (
                              <div>
                                <p className="text-xs font-medium text-muted uppercase mb-1">
                                  Interní poznámka
                                </p>
                                <p className="text-sm text-ink">
                                  {inq.internalNote}
                                </p>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => openEdit(inq)}
                            className="px-3 py-1.5 bg-rose text-white text-xs rounded-lg hover:bg-rose-deep"
                          >
                            Upravit
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
