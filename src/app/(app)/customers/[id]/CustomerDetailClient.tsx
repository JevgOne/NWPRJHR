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
      {(() => {
        const activeResTotal = customer.productReservations
          .filter((r) => r.status === "PENDING" || r.status === "PAID")
          .reduce((sum, r) => sum + r.lineTotal, 0);
        const hasStats = customer.totalSpent > 0 || customer.salesCount > 0;
        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-line border-t-2 border-t-gold rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-bold text-ink">
                {hasStats ? formatCZK(customer.totalSpent) : "—"}
              </p>
              <p className="text-xs text-muted uppercase tracking-wide">Utraceno celkem</p>
            </div>
            <div className="bg-white border border-line border-t-2 border-t-gold rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-bold text-ink">{customer.salesCount}</p>
              <p className="text-xs text-muted uppercase tracking-wide">Prodeje</p>
            </div>
            <div className="bg-white border border-line border-t-2 border-t-gold rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-bold text-ink">
                {customer.totalGramsBought > 0 ? `${customer.totalGramsBought}g` : "—"}
              </p>
              <p className="text-xs text-muted uppercase tracking-wide">Nakoupeno gramů</p>
            </div>
            {activeResTotal > 0 ? (
              <div className="bg-white border border-line border-t-2 border-t-amber-400 rounded-xl px-4 py-3 text-center">
                <p className="text-2xl font-bold text-amber-700">{formatCZK(activeResTotal)}</p>
                <p className="text-xs text-amber-600 uppercase tracking-wide">Rezervováno</p>
              </div>
            ) : (
              <div className="bg-white border border-line border-t-2 border-t-gold rounded-xl px-4 py-3 text-center">
                <p className="text-2xl font-bold text-ink">
                  {hasStats ? formatCZK(customer.averageOrderValue) : "—"}
                </p>
                <p className="text-xs text-muted uppercase tracking-wide">Prům. nákup</p>
              </div>
            )}
          </div>
        );
      })()}

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
            <h2 className="text-sm font-semibold text-espresso">Kontaktní údaje</h2>
          </div>
          <div className="px-4 py-3 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {customer.email && (
                <div className="flex items-center gap-3 bg-nude-50/50 rounded-lg px-3 py-2">
                  <svg className="w-4 h-4 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted uppercase tracking-wider">E-mail</p>
                    <p className="text-sm text-ink font-medium truncate">{customer.email}</p>
                  </div>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-3 bg-nude-50/50 rounded-lg px-3 py-2">
                  <svg className="w-4 h-4 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted uppercase tracking-wider">Telefon</p>
                    <p className="text-sm text-ink font-medium">{customer.phone}</p>
                  </div>
                </div>
              )}
              {customer.city && (
                <div className="flex items-center gap-3 bg-nude-50/50 rounded-lg px-3 py-2">
                  <svg className="w-4 h-4 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
                  </svg>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted uppercase tracking-wider">Město</p>
                    <p className="text-sm text-ink font-medium">{customer.city}</p>
                  </div>
                </div>
              )}
              {customer.instagram && (
                <div className="flex items-center gap-3 bg-nude-50/50 rounded-lg px-3 py-2">
                  <svg className="w-4 h-4 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <rect x="2" y="2" width="20" height="20" rx="5" />
                    <circle cx="12" cy="12" r="5" />
                    <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" />
                  </svg>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted uppercase tracking-wider">Instagram</p>
                    <a
                      href={`https://instagram.com/${customer.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-rose hover:underline font-medium"
                    >
                      {customer.instagram}
                    </a>
                  </div>
                </div>
              )}
            </div>
            {!customer.email && !customer.phone && !customer.city && !customer.instagram && (
              <p className="text-sm text-muted italic py-1">Žádné kontaktní údaje</p>
            )}
            {customer.note && (
              <div className="bg-amber-50/50 border border-amber-100 rounded-lg px-3 py-2">
                <p className="text-[10px] text-amber-600 uppercase tracking-wider mb-0.5">Poznámka</p>
                <p className="text-sm text-ink">{customer.note}</p>
              </div>
            )}
            {(customer.firstPurchaseDate || customer.lastPurchaseDate) && (
              <div className="flex gap-4 pt-1 border-t border-line/50">
                {customer.firstPurchaseDate && (
                  <div className="text-xs">
                    <span className="text-muted">První nákup: </span>
                    <span className="text-ink font-medium">
                      {new Date(customer.firstPurchaseDate).toLocaleDateString("cs-CZ")}
                    </span>
                  </div>
                )}
                {customer.lastPurchaseDate && (
                  <div className="text-xs">
                    <span className="text-muted">Poslední nákup: </span>
                    <span className="text-ink font-medium">
                      {new Date(customer.lastPurchaseDate).toLocaleDateString("cs-CZ")}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rezervace */}
      {customer.productReservations.length > 0 && (
        <div className="bg-white border border-line rounded-xl overflow-hidden">
          <div className="bg-nude-100 px-4 py-2.5 border-b border-line flex items-center justify-between">
            <h2 className="text-sm font-semibold text-espresso">
              Rezervace ({customer.reservationsCount})
            </h2>
            {customer.activeReservations > 0 && (
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                {customer.activeReservations} aktivní
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
              const dueDate = new Date(res.paymentDueDate);
              const createdDate = new Date(res.createdAt);

              const statusLabel: Record<string, string> = {
                PENDING: "Čeká na platbu",
                PAID: "Zaplaceno",
                COMPLETED: "Dokončeno",
                EXPIRED: "Vypršela",
                CANCELLED: "Zrušena",
              };

              return (
                <div
                  key={res.id}
                  className={`px-4 py-4 ${
                    isActive ? "border-l-3 border-l-amber-400 bg-amber-50/20" : ""
                  }`}
                >
                  {/* Hlavička: status + číslo + celková cena */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            RES_STATUS_STYLE[res.status] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {statusLabel[res.status] ?? res.status}
                        </span>
                        {res.reservationNumber && (
                          <Link href={`/reservations/${res.id}`} className="text-xs text-rose hover:underline font-mono">
                            {res.reservationNumber}
                          </Link>
                        )}
                      </div>
                      <p className="text-sm text-ink font-medium">
                        {res.variant.product.name} — {res.variant.color}, {res.variant.lengthCm} cm
                        {res.sellingMode === "BY_PIECE"
                          ? ` (${res.pieces} ks)`
                          : ` (${res.grams} g)`}
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        Vytvořeno {createdDate.toLocaleDateString("cs-CZ")}
                        {isActive && <> — splatnost do {dueDate.toLocaleDateString("cs-CZ")}</>}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-ink">{formatCZK(res.lineTotal)} CZK</p>
                      <p className="text-[10px] text-muted uppercase">celková cena</p>
                    </div>
                  </div>

                  {/* Přehled plateb */}
                  {isActive && (
                    <div className="mt-3 bg-white border border-line rounded-lg px-3 py-2.5">
                      <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2">Platební přehled</p>

                      {hasDeposit ? (
                        <>
                          {/* Záloha odeslána */}
                          <div className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${depositPaid ? "bg-emerald-500" : "bg-amber-400"}`} />
                              <span className="text-sm text-ink">Zálohová faktura ({depositInvoice.number})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-ink">{formatCZK(depositInvoice.total)} CZK</span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                depositPaid
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}>
                                {depositPaid ? "Zaplaceno" : "Čeká na platbu"}
                              </span>
                            </div>
                          </div>

                          {/* Doplatek */}
                          <div className="flex items-center justify-between py-1 border-t border-dashed border-line/50">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-gray-300" />
                              <span className="text-sm text-muted">
                                Doplatek {depositPaid ? "(hotově, kartou nebo převodem)" : "(po zaplacení zálohy)"}
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-ink">
                              {formatCZK(res.lineTotal - depositInvoice.total)} CZK
                            </span>
                          </div>

                          {/* Tlačítko: znovu odeslat */}
                          {!depositPaid && res.status === "PENDING" && (
                            <div className="mt-2 pt-2 border-t border-line/50">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleSendDeposit(res.id)}
                                disabled={depositLoading === res.id}
                              >
                                {depositLoading === res.id
                                  ? "Odesílám..."
                                  : `Znovu odeslat platební odkaz na ${customer.email ?? "email"}`}
                              </Button>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Záloha ještě neodeslána */}
                          <div className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-gray-300" />
                              <span className="text-sm text-muted">Záloha 50%</span>
                            </div>
                            <span className="text-sm font-semibold text-ink">{formatCZK(depositAmount)} CZK</span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-t border-dashed border-line/50">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-gray-300" />
                              <span className="text-sm text-muted">Doplatek 50% (hotově, kartou nebo převodem)</span>
                            </div>
                            <span className="text-sm font-semibold text-ink">{formatCZK(res.lineTotal - depositAmount)} CZK</span>
                          </div>

                          {/* Tlačítko: odeslat zálohu */}
                          {res.status === "PENDING" && customer.email && (
                            <div className="mt-2 pt-2 border-t border-line/50">
                              <p className="text-xs text-muted mb-2">
                                Klientovi se odešle výzva k zaplacení zálohy {formatCZK(depositAmount)} CZK
                                na email {customer.email} s platebním odkazem přes Comgate.
                              </p>
                              <Button
                                size="sm"
                                onClick={() => handleSendDeposit(res.id)}
                                disabled={depositLoading === res.id}
                              >
                                {depositLoading === res.id
                                  ? "Odesílám výzvu..."
                                  : `Odeslat výzvu k zaplacení zálohy na ${customer.email}`}
                              </Button>
                              {depositSuccess === res.id && (
                                <p className="text-xs text-emerald-600 font-medium mt-2">
                                  Výzva k zaplacení zálohy odeslána na {customer.email}
                                </p>
                              )}
                            </div>
                          )}
                          {res.status === "PENDING" && !customer.email && (
                            <p className="text-xs text-red-500 mt-2">
                              Chybí email — doplňte email zákazníka pro odeslání výzvy k platbě.
                            </p>
                          )}
                        </>
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
