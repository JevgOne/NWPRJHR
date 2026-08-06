"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface SaleItem {
  grams: number;
  pieces: number;
  lineTotal: number;
  variant: {
    color: string;
    lengthCm: number;
    sellingMode: string;
    product: { name: string };
  };
}

interface SaleSummary {
  id: string;
  saleNumber?: string;
  totalAmount: number;
  completedAt: string;
  paymentType?: string;
  items: SaleItem[];
}

interface ReservationSummary {
  id: string;
  reservationNumber?: string;
  status: string;
  lineTotal: number;
  grams: number;
  pieces: number;
  sellingMode: string;
  paymentDueDate: string;
  paidAt?: string | null;
  createdAt: string;
  variant: {
    color: string;
    lengthCm: number;
    product: { name: string };
  };
  invoices: {
    id: string;
    number: string;
    total: number;
    status: string;
  }[];
}

interface InvoiceSummary {
  id: string;
  number: string;
  type: string;
  total: number;
  status: string;
  issueDate: string;
}

interface OrderSummary {
  id: string;
  orderNumber?: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

interface CustomerDetail {
  id: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  instagram?: string | null;
  note?: string | null;
  totalSpent: number;
  salesCount: number;
  inquiriesCount: number;
  totalGramsBought: number;
  totalPiecesBought: number;
  averageOrderValue: number;
  firstPurchaseDate?: string | null;
  lastPurchaseDate?: string | null;
  reservationsCount: number;
  activeReservations: number;
  ordersCount: number;
  invoicesCount: number;
  sales: SaleSummary[];
  inquiries: {
    id: string;
    status: string;
    createdAt: string;
    items: { id: string }[];
  }[];
  productReservations: ReservationSummary[];
  invoices: InvoiceSummary[];
  orders: OrderSummary[];
  referrals: {
    id: string;
    code: string;
    usedCount: number;
    maxUses: number | null;
    active: boolean;
  }[];
}

const RES_STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
  PAID: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  EXPIRED: "bg-red-50 text-red-700 border border-red-200",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const INV_STATUS_STYLE: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  CANCELLED: "bg-gray-100 text-gray-500",
  AWAITING: "bg-amber-50 text-amber-700 border border-amber-200",
};

const ORDER_STATUS_STYLE: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  SHIPPED: "bg-blue-50 text-blue-700 border border-blue-200",
  AWAITING_PAYMENT: "bg-amber-50 text-amber-700 border border-amber-200",
  NEW: "bg-amber-50 text-amber-700 border border-amber-200",
  CANCELLED: "bg-gray-100 text-gray-500",
  REJECTED: "bg-red-50 text-red-700 border border-red-200",
};

function formatCZK(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function CustomerDetailClient({ id }: { id: string }) {
  const t = useTranslations("customer");
  const tSale = useTranslations("sale");
  const tCommon = useTranslations("common");
  const tRes = useTranslations("reservation");
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editInstagram, setEditInstagram] = useState("");
  const [editNote, setEditNote] = useState("");
  const [depositLoading, setDepositLoading] = useState<string | null>(null);
  const [depositSuccess, setDepositSuccess] = useState<string | null>(null);

  const loadCustomer = () => {
    fetch(`/api/customers/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setCustomer(data);
        setEditFirstName(data.firstName || data.name?.split(" ")[0] || "");
        setEditLastName(data.lastName || data.name?.split(" ").slice(1).join(" ") || "");
        setEditEmail(data.email || "");
        setEditPhone(data.phone || "");
        setEditCity(data.city || "");
        setEditInstagram(data.instagram || "");
        setEditNote(data.note || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadCustomer(); }, [id]);

  const handleSendDeposit = async (reservationId: string) => {
    setDepositLoading(reservationId);
    setDepositSuccess(null);
    try {
      const res = await fetch(`/api/reservations/${reservationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend_deposit" }),
      });
      if (res.ok) {
        setDepositSuccess(reservationId);
        loadCustomer();
      }
    } finally {
      setDepositLoading(null);
    }
  };

  const handleSave = async () => {
    const res = await fetch(`/api/customers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        email: editEmail || undefined,
        phone: editPhone || undefined,
        city: editCity || undefined,
        instagram: editInstagram || undefined,
        note: editNote || undefined,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCustomer((prev) => (prev ? { ...prev, ...updated } : prev));
      setEditing(false);
    }
  };

  if (loading) return <p className="text-muted py-8 text-center">{tCommon("loading")}</p>;
  if (!customer) return <p className="text-red-500 py-8 text-center">{tCommon("error")}</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">{customer.name}</h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditing(!editing)}
          >
            {tCommon("edit")}
          </Button>
          <Link href="/customers">
            <Button variant="ghost" size="sm">
              {tCommon("back")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-line border-t-2 border-t-gold rounded-xl px-4 py-3 text-center">
          <p className="text-2xl font-bold text-ink">{formatCZK(customer.totalSpent)}</p>
          <p className="text-xs text-muted uppercase tracking-wide">{t("totalSpent")}</p>
        </div>
        <div className="bg-white border border-line border-t-2 border-t-gold rounded-xl px-4 py-3 text-center">
          <p className="text-2xl font-bold text-ink">{customer.salesCount}</p>
          <p className="text-xs text-muted uppercase tracking-wide">{t("salesCount")}</p>
        </div>
        <div className="bg-white border border-line border-t-2 border-t-gold rounded-xl px-4 py-3 text-center">
          <p className="text-2xl font-bold text-ink">{customer.totalGramsBought}g</p>
          <p className="text-xs text-muted uppercase tracking-wide">{t("totalGrams")}</p>
        </div>
        <div className="bg-white border border-line border-t-2 border-t-gold rounded-xl px-4 py-3 text-center">
          <p className="text-2xl font-bold text-ink">{formatCZK(customer.averageOrderValue)}</p>
          <p className="text-xs text-muted uppercase tracking-wide">{t("avgOrder")}</p>
        </div>
      </div>

      {/* Contact info / Edit form */}
      {editing ? (
        <Card className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input
              label={t("firstName")}
              value={editFirstName}
              onChange={(e) => setEditFirstName(e.target.value)}
            />
            <Input
              label={t("lastName")}
              value={editLastName}
              onChange={(e) => setEditLastName(e.target.value)}
            />
          </div>
          <Input
            label={t("email")}
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            type="email"
          />
          <Input
            label={t("phone")}
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
          />
          <Input
            label={t("city")}
            value={editCity}
            onChange={(e) => setEditCity(e.target.value)}
          />
          <Input
            label="Instagram"
            value={editInstagram}
            onChange={(e) => setEditInstagram(e.target.value)}
            placeholder="@username"
          />
          <div>
            <label className="block text-sm font-medium text-ink mb-1">{t("note")}</label>
            <textarea
              className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose"
              rows={3}
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              placeholder={t("notePlaceholder")}
              maxLength={1000}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>
              {tCommon("save")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(false)}
            >
              {tCommon("cancel")}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="bg-white border border-line rounded-xl overflow-hidden">
          <div className="bg-nude-100 px-4 py-2.5 border-b border-line">
            <h2 className="text-sm font-semibold text-espresso">{t("title")}</h2>
          </div>
          <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted w-20 shrink-0">{t("email")}</span>
              <span className="text-ink font-medium truncate">{customer.email || "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted w-20 shrink-0">{t("phone")}</span>
              <span className="text-ink font-medium">{customer.phone || "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted w-20 shrink-0">{t("city")}</span>
              <span className="text-ink font-medium">{customer.city || "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted w-20 shrink-0">Instagram</span>
              {customer.instagram ? (
                <a
                  href={`https://instagram.com/${customer.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-rose hover:underline font-medium"
                >
                  {customer.instagram}
                </a>
              ) : (
                <span className="text-ink font-medium">-</span>
              )}
            </div>
            {customer.note && (
              <div className="flex items-start gap-2 sm:col-span-2">
                <span className="text-muted w-20 shrink-0">{t("note")}</span>
                <span className="text-ink font-medium text-sm">{customer.note}</span>
              </div>
            )}
            {customer.firstPurchaseDate && (
              <div className="flex items-center gap-2">
                <span className="text-muted w-20 shrink-0">{t("firstPurchase")}</span>
                <span className="text-ink font-medium">
                  {new Date(customer.firstPurchaseDate).toLocaleDateString("cs-CZ")}
                </span>
              </div>
            )}
            {customer.lastPurchaseDate && (
              <div className="flex items-center gap-2">
                <span className="text-muted w-20 shrink-0">{t("lastPurchase")}</span>
                <span className="text-ink font-medium">
                  {new Date(customer.lastPurchaseDate).toLocaleDateString("cs-CZ")}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reservations */}
      {customer.productReservations.length > 0 && (
        <div className="bg-white border border-line rounded-xl overflow-hidden">
          <div className="bg-nude-100 px-4 py-2.5 border-b border-line flex items-center justify-between">
            <h2 className="text-sm font-semibold text-espresso">
              {t("reservations")} ({customer.reservationsCount})
            </h2>
            {customer.activeReservations > 0 && (
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                {customer.activeReservations} {t("active")}
              </span>
            )}
          </div>
          <div className="divide-y divide-line/50">
            {customer.productReservations.map((res) => {
              const isActive = res.status === "PENDING" || res.status === "PAID";
              const depositInvoice = res.invoices?.[0];
              const hasDeposit = res.invoices && res.invoices.length > 0;
              const depositPaid = depositInvoice?.status === "PAID";
              const depositAmount = hasDeposit
                ? depositInvoice.total
                : Math.ceil(res.lineTotal / 2);
              const remaining = res.lineTotal - (hasDeposit && !depositPaid ? 0 : hasDeposit && depositPaid ? depositInvoice.total : 0);

              return (
                <div
                  key={res.id}
                  className={`px-4 py-3 ${
                    isActive ? "border-l-3 border-l-amber-400 bg-amber-50/30" : ""
                  }`}
                >
                  {/* Row 1: Status + number + total */}
                  <Link href={`/reservations/${res.id}`}>
                    <div className="flex justify-between items-center hover:opacity-80 transition-opacity">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            RES_STATUS_STYLE[res.status] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {tRes(res.status.toLowerCase())}
                        </span>
                        {res.reservationNumber && (
                          <span className="text-xs text-muted font-mono">
                            {res.reservationNumber}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-ink">
                        {formatCZK(res.lineTotal)} CZK
                      </span>
                    </div>
                  </Link>

                  {/* Row 2: Product info */}
                  <div className="text-xs text-muted mt-1">
                    {res.variant.product.name} — {res.variant.color} {res.variant.lengthCm}cm
                    {res.sellingMode === "BY_PIECE"
                      ? ` (${res.pieces}ks)`
                      : ` (${res.grams}g)`}
                  </div>

                  {/* Row 3: Deposit & payment overview */}
                  {isActive && (
                    <div className="mt-2 pt-2 border-t border-line/50">
                      {hasDeposit ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted">Záloha 50%</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-ink">
                                {formatCZK(depositInvoice.total)} CZK
                              </span>
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                depositPaid
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}>
                                {depositPaid ? "Zaplaceno" : "Čeká na platbu"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted">Doplatek</span>
                            <span className="text-xs font-medium text-ink">
                              {formatCZK(res.lineTotal - depositInvoice.total)} CZK
                              {depositPaid ? "" : " (po zaplacení zálohy)"}
                            </span>
                          </div>
                          {!depositPaid && res.status === "PENDING" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="mt-1"
                              onClick={() => handleSendDeposit(res.id)}
                              disabled={depositLoading === res.id}
                            >
                              {depositLoading === res.id ? "Odesílám..." : "Znovu odeslat platební odkaz"}
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted">Záloha 50%</span>
                            <span className="text-xs font-medium text-ink">
                              {formatCZK(depositAmount)} CZK
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted">Doplatek 50%</span>
                            <span className="text-xs font-medium text-ink">
                              {formatCZK(res.lineTotal - depositAmount)} CZK
                            </span>
                          </div>
                          {res.status === "PENDING" && (
                            <Button
                              size="sm"
                              className="mt-1"
                              onClick={() => handleSendDeposit(res.id)}
                              disabled={depositLoading === res.id}
                            >
                              {depositLoading === res.id ? "Odesílám..." : "Odeslat zálohu klientovi"}
                            </Button>
                          )}
                          {depositSuccess === res.id && (
                            <p className="text-xs text-emerald-600 mt-1">Záloha odeslána na {customer.email}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sales history */}
      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <div className="bg-nude-100 px-4 py-2.5 border-b border-line">
          <h2 className="text-sm font-semibold text-espresso">
            {t("purchaseHistory")} ({customer.salesCount})
          </h2>
        </div>
        {customer.sales.length === 0 ? (
          <p className="text-muted text-sm py-8 text-center italic">{tSale("noSales")}</p>
        ) : (
          <div className="divide-y divide-line/50">
            {customer.sales.map((sale) => (
              <Link key={sale.id} href={`/sales/${sale.id}`}>
                <div className="px-4 py-3 hover:bg-nude-50 transition-colors">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {sale.saleNumber && (
                        <span className="text-xs text-muted font-mono">
                          #{sale.saleNumber}
                        </span>
                      )}
                      <span className="text-sm text-ink">
                        {sale.completedAt
                          ? new Date(sale.completedAt).toLocaleDateString("cs-CZ")
                          : "-"}
                      </span>
                      {sale.paymentType && (
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                          {sale.paymentType}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-ink">
                      {formatCZK(sale.totalAmount)} CZK
                    </span>
                  </div>
                  {sale.items.length > 0 && (
                    <div className="text-xs text-muted mt-1">
                      {sale.items.map((item, i) => (
                        <span key={i}>
                          {i > 0 && ", "}
                          {item.variant.product.name} {item.variant.color}{" "}
                          {item.variant.lengthCm}cm
                          {item.variant.sellingMode === "BY_PIECE"
                            ? ` (${item.pieces}ks)`
                            : ` (${item.grams}g)`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Invoices */}
      {customer.invoices.length > 0 && (
        <div className="bg-white border border-line rounded-xl overflow-hidden">
          <div className="bg-nude-100 px-4 py-2.5 border-b border-line">
            <h2 className="text-sm font-semibold text-espresso">
              {t("invoicesTitle")} ({customer.invoicesCount})
            </h2>
          </div>
          <div className="divide-y divide-line/50">
            {customer.invoices.map((inv) => (
              <Link key={inv.id} href={`/invoices/${inv.id}`}>
                <div className="px-4 py-3 hover:bg-nude-50 transition-colors flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted">{inv.number}</span>
                    <span className="text-xs text-muted">
                      {new Date(inv.issueDate).toLocaleDateString("cs-CZ")}
                    </span>
                    {inv.type !== "INVOICE" && (
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                        {inv.type}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink">
                      {formatCZK(inv.total)} CZK
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        INV_STATUS_STYLE[inv.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Orders */}
      {customer.orders.length > 0 && (
        <div className="bg-white border border-line rounded-xl overflow-hidden">
          <div className="bg-nude-100 px-4 py-2.5 border-b border-line">
            <h2 className="text-sm font-semibold text-espresso">
              {t("ordersTitle")} ({customer.ordersCount})
            </h2>
          </div>
          <div className="divide-y divide-line/50">
            {customer.orders.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <div className="px-4 py-3 hover:bg-nude-50 transition-colors flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {order.orderNumber && (
                      <span className="text-xs text-muted font-mono">
                        #{order.orderNumber}
                      </span>
                    )}
                    <span className="text-xs text-muted">
                      {new Date(order.createdAt).toLocaleDateString("cs-CZ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink">
                      {order.totalAmount ? formatCZK(order.totalAmount) : "-"} CZK
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        ORDER_STATUS_STYLE[order.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Referrals */}
      {customer.referrals.length > 0 && (
        <div className="bg-white border border-line rounded-xl overflow-hidden">
          <div className="bg-nude-100 px-4 py-2.5 border-b border-line">
            <h2 className="text-sm font-semibold text-espresso">
              {t("referralsTitle")} ({customer.referrals.length})
            </h2>
          </div>
          <div className="divide-y divide-line/50">
            {customer.referrals.map((ref) => (
              <div key={ref.id} className="px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-ink">{ref.code}</span>
                  <span className="text-xs text-muted">
                    {t("referralUsed")}: {ref.usedCount}
                    {ref.maxUses !== null && `/${ref.maxUses}`}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    ref.active
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {ref.active ? t("referralActive") : t("referralInactive")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inquiries */}
      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <div className="bg-nude-100 px-4 py-2.5 border-b border-line">
          <h2 className="text-sm font-semibold text-espresso">
            {t("inquiries")} ({customer.inquiriesCount})
          </h2>
        </div>
        {customer.inquiries.length === 0 ? (
          <p className="text-muted text-sm py-8 text-center italic">{t("noInquiries")}</p>
        ) : (
          <div className="divide-y divide-line/50">
            {customer.inquiries.map((inq) => (
              <Link key={inq.id} href={`/inquiries/${inq.id}`}>
                <div className="px-4 py-3 hover:bg-nude-50 transition-colors flex justify-between items-center">
                  <span className="text-sm text-ink">
                    {new Date(inq.createdAt).toLocaleDateString("cs-CZ")}
                  </span>
                  <span className="text-xs text-muted">
                    {inq.items.length > 0
                      ? `${inq.items.length} ${t("inquiryItems")}`
                      : t("consultation")}
                  </span>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      inq.status === "NEW"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : inq.status === "CONTACTED"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : inq.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {inq.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
