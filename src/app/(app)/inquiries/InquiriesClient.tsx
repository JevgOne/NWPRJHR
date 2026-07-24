"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getHairColor } from "@/lib/hair-colors";
import { UserBadge } from "@/components/ui/UserBadge";
import { TEAM_MEMBERS } from "@/lib/user-colors";

interface InquiryItem {
  id: string;
  productName: string;
  lengthCm: number;
  color: string;
  quantity: number;
  unit: string;
  pricePerGram: number;
  itemTotal: number;
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
  customerPhotos: string | null;
  customerId: string | null;
  city: string | null;
  shippingMethod: string | null;
  paymentMethod: string | null;
  packetaPointId: string | null;
  packetaPointName: string | null;
  packetaPointCity: string | null;
  createdAt: string;
  items: InquiryItem[];
  subtotal: number;
  discountAmount: number;
  estimatedTotal: number;
}

function formatCZK(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800",
  CONTACTED: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

// STATUS_LABELS, COLOR_NAMES, itemCount moved inside component to access translations

export function InquiriesClient() {
  const t = useTranslations("inquiry");
  const tc = useTranslations("common");
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editAssigned, setEditAssigned] = useState("");
  const [saving, setSaving] = useState(false);

  const STATUS_LABELS: Record<string, string> = {
    NEW: t("statusNew"),
    CONTACTED: t("statusContacted"),
    COMPLETED: t("statusCompleted"),
    CANCELLED: t("statusCancelled"),
  };

  const COLOR_NAMES: Record<string, string> = {
    "1": t("colorPlatinumBlonde"),
    "2": t("colorLightBlonde"),
    "3": t("colorGoldenBlonde"),
    "4": t("colorNaturalBrown"),
    "5": t("colorCaramel"),
    "6": t("colorDarkBlonde"),
    "7": t("colorMediumBrown"),
    "8": t("colorDarkBrown"),
    "9": t("colorDark"),
    "10": t("colorBlack"),
  };

  function itemCount(n: number): string {
    if (n === 1) return t("itemOne");
    if (n >= 2 && n <= 4) return t("itemFew", { count: n });
    return t("itemMany", { count: n });
  }

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "ALL") params.set("status", filter);
    params.set("page", String(page));
    params.set("limit", "50");
    const res = await fetch(`/api/inquiries?${params}`);
    if (res.ok) {
      const json = await res.json();
      setInquiries(json.data);
      setTotalPages(json.totalPages);
      setTotal(json.total);
    }
    setLoading(false);
  }, [filter, page]);

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
    { key: "ALL", label: t("filterAll") },
    { key: "NEW", label: t("filterNew") },
    { key: "CONTACTED", label: t("filterContacted") },
    { key: "COMPLETED", label: t("filterCompleted") },
    { key: "CANCELLED", label: t("filterCancelled") },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setFilter(tab.key); setPage(1); }}
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
      ) : inquiries.length === 0 ? (
        <p className="text-muted">{t("noInquiries")}</p>
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
                      {inq.estimatedTotal > 0 && (
                        <span className="text-xs font-medium text-ink">
                          · {formatCZK(inq.estimatedTotal)} Kč
                        </span>
                      )}
                      {inq.assignedTo && (
                        <span className="text-xs font-medium flex items-center gap-1">
                          · <UserBadge name={inq.assignedTo} size="sm" />
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
                        <div>
                          <p className="text-xs font-medium text-muted uppercase">{t("customer")}</p>
                          {inq.customerId ? (
                            <Link href={`/customers/${inq.customerId}`} className="text-sm text-rose hover:underline">
                              {inq.name}
                            </Link>
                          ) : (
                            <p className="text-sm text-ink">{inq.name}</p>
                          )}
                        </div>
                        <Detail label={t("email")} value={inq.email} />
                        {inq.phone && <Detail label={t("phone")} value={inq.phone} />}
                        {inq.city && <Detail label={t("city")} value={inq.city} />}
                        {inq.shippingMethod && (
                          <Detail
                            label={t("shipping")}
                            value={
                              inq.shippingMethod === "PACKETA"
                                ? `Zásilkovna — ${inq.packetaPointName || ""} (${inq.packetaPointCity || ""})`
                                : inq.shippingMethod === "PERSONAL_DELIVERY"
                                ? "Osobní rozvoz"
                                : inq.shippingMethod === "PICKUP"
                                ? "Osobní vyzvednutí"
                                : "Česká pošta"
                            }
                          />
                        )}
                        {inq.paymentMethod && (
                          <Detail
                            label={t("payment")}
                            value={inq.paymentMethod === "TRANSFER" ? "Převodem" : inq.paymentMethod === "CARD" ? "Kartou online" : "Hotově"}
                          />
                        )}
                        {inq.salonName && <Detail label={t("salon")} value={inq.salonName} />}
                        {inq.promoCode && (
                          <Detail
                            label={t("promoCode")}
                            value={`${inq.promoCode}${inq.promoDiscount ? ` (sleva ${inq.promoDiscount.label})` : ""}`}
                          />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Detail
                          label={t("inquiryDate")}
                          value={new Date(inq.createdAt).toLocaleString("cs-CZ")}
                        />
                        {inq.assignedTo && (
                          <div>
                            <p className="text-xs font-medium text-muted uppercase">{t("assignedTo")}</p>
                            <p className="text-sm text-ink flex items-center gap-1.5">
                              <UserBadge name={inq.assignedTo} />
                              {inq.assignedAt && <span className="text-muted"> od {new Date(inq.assignedAt).toLocaleString("cs-CZ")}</span>}
                            </p>
                          </div>
                        )}
                        {inq.contactedAt && (
                          <Detail
                            label={t("contactedOn")}
                            value={new Date(inq.contactedAt).toLocaleString("cs-CZ")}
                          />
                        )}
                        {inq.completedAt && (
                          <Detail
                            label={t("completedOn")}
                            value={new Date(inq.completedAt).toLocaleString("cs-CZ")}
                          />
                        )}
                      </div>
                    </div>

                    {/* Items */}
                    <div className="mt-4">
                      <p className="text-xs font-medium text-muted uppercase mb-2">
                        {t("inquiredHair")} ({itemCount(inq.items.length)})
                      </p>
                      <div className="space-y-1">
                        {inq.items.map((item) => {
                          const hc = getHairColor(item.color);
                          const colorName = COLOR_NAMES[item.color] ?? t("shade", { color: item.color });
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
                                  {item.pricePerGram > 0 && ` · ${formatCZK(item.pricePerGram)} Kč/{item.unit}`}
                                </div>
                              </div>
                              {item.itemTotal > 0 && (
                                <span className="text-sm font-medium whitespace-nowrap">
                                  {formatCZK(item.itemTotal)} Kč
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {inq.subtotal > 0 && (
                      <div className="mt-3 pt-2 border-t border-line space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted">{t("subtotal")}</span>
                          <span>{formatCZK(inq.subtotal)} Kč</span>
                        </div>
                        {inq.discountAmount > 0 && (
                          <div className="flex justify-between text-red-600">
                            <span>Sleva {inq.promoDiscount?.label}</span>
                            <span>-{formatCZK(inq.discountAmount)} Kč</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold">
                          <span>{t("estimatedPrice")}</span>
                          <span>{formatCZK(inq.estimatedTotal)} Kč</span>
                        </div>
                      </div>
                    )}

                    {inq.message && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-muted uppercase mb-1">
                          {t("customerNote")}
                        </p>
                        <p className="text-sm text-ink whitespace-pre-wrap bg-nude-50 rounded-lg p-3">
                          {inq.message}
                        </p>
                      </div>
                    )}

                    {inq.customerPhotos && (() => {
                      const photoUrls: string[] = JSON.parse(inq.customerPhotos);
                      return photoUrls.length > 0 ? (
                        <div className="mt-4">
                          <p className="text-xs font-medium text-muted uppercase mb-2">
                            {t("customerPhotos")}
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {photoUrls.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block w-24 h-24 rounded-lg overflow-hidden border border-line hover:ring-2 hover:ring-rose transition-all">
                                <img src={url} alt="" className="w-full h-full object-cover" />
                              </a>
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })()}

                    {/* Edit / Note */}
                    <div className="mt-4 pt-4 border-t border-line">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-muted uppercase mb-1">
                              {t("inquiryStatus")}
                            </label>
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value)}
                              className="border border-line rounded-lg px-3 py-2 text-sm w-full max-w-xs"
                            >
                              <option value="NEW">{t("statusNew")}</option>
                              <option value="CONTACTED">{t("statusContacted")}</option>
                              <option value="COMPLETED">{t("statusCompleted")}</option>
                              <option value="CANCELLED">{t("statusCancelled")}</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted uppercase mb-1">
                              {t("assignedPerson")}
                            </label>
                            <select
                              value={editAssigned}
                              onChange={(e) => setEditAssigned(e.target.value)}
                              className="border border-line rounded-lg px-3 py-2 text-sm w-full max-w-xs"
                            >
                              <option value="">{t("unassigned")}</option>
                              {TEAM_MEMBERS.map((name) => (
                                <option key={name} value={name}>{name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted uppercase mb-1">
                              {t("internalNote")}
                            </label>
                            <textarea
                              value={editNote}
                              onChange={(e) => setEditNote(e.target.value)}
                              className="w-full border border-line rounded-lg px-3 py-2 text-sm"
                              rows={3}
                              placeholder={t("notePlaceholder")}
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSave(inq.id)}
                              disabled={saving}
                              className="px-4 py-2 bg-rose text-white text-sm rounded-lg hover:bg-rose-deep disabled:opacity-50"
                            >
                              {saving ? tc("saving") : tc("save")}
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
                            {inq.internalNote && (
                              <div>
                                <p className="text-xs font-medium text-muted uppercase mb-1">
                                  {t("internalNote")}
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
                            {tc("edit")}
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <span className="text-sm text-muted">
            {t("showingOf", { count: inquiries.length, total })}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-line text-sm disabled:opacity-30 hover:bg-nude-50"
            >
              &lt;
            </button>
            <span className="px-3 py-1.5 text-sm text-muted">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-line text-sm disabled:opacity-30 hover:bg-nude-50"
            >
              &gt;
            </button>
          </div>
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
