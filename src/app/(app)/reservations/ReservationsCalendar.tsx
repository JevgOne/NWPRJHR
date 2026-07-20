"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface CalendarReservation {
  id: string;
  reservationNumber?: string;
  status: string;
  paymentDueDate: string;
  lineTotal: number;
  grams: number;
  pieces: number;
  sellingMode: string;
  contactName?: string | null;
  variant: {
    color: string;
    lengthCm: number;
    product: { name: string };
  };
  salon?: { name: string } | null;
  customer?: { name: string } | null;
}

interface CalendarSale {
  id: string;
  saleNumber?: string;
  paymentType: string;
  totalAmount: number;
  completedAt: string;
  salonName?: string | null;
  customerName?: string | null;
  items: { grams: number; pieces: number; lineTotal: number }[];
}

interface CalendarOrder {
  id: string;
  orderNumber?: string;
  status: string;
  totalAmount?: number | null;
  estimatedTotal: number;
  createdAt: string;
  salon?: { name: string } | null;
  customer?: { name: string; email?: string } | null;
  _count?: { items: number };
}

interface CalendarDelivery {
  id: string;
  stockedAt: string;
  initialGrams: number;
  initialPieces: number;
  remainingGrams: number;
  remainingPieces: number;
  variant?: {
    color: string;
    lengthCm: number;
    product: { name: string };
  } | null;
}

type CalendarEntry =
  | { kind: "reservation"; data: CalendarReservation }
  | { kind: "sale"; data: CalendarSale }
  | { kind: "order"; data: CalendarOrder }
  | { kind: "delivery"; data: CalendarDelivery };

const RESERVATION_DOT: Record<string, string> = {
  PENDING: "bg-yellow-400",
  PAID: "bg-lime-500",
  COMPLETED: "bg-emerald-700",
  EXPIRED: "bg-rose-400",
  CANCELLED: "bg-stone-400",
};

const SALE_DOT: Record<string, string> = {
  TRANSFER: "bg-blue-500",
  CASH: "bg-green-500",
  CARD: "bg-purple-500",
  PROMO: "bg-orange-500",
  WRITEOFF: "bg-zinc-400",
};

const ORDER_DOT: Record<string, string> = {
  NEW: "bg-sky-400",
  AWAITING_PAYMENT: "bg-amber-500",
  PAID: "bg-teal-500",
  SHIPPED: "bg-indigo-500",
  DELIVERED: "bg-cyan-500",
  COMPLETED: "bg-emerald-400",
  CANCELLED: "bg-gray-300",
  REJECTED: "bg-red-500",
};

const DELIVERY_DOT = "bg-fuchsia-500";

const RESERVATION_TEXT: Record<string, string> = {
  PENDING: "text-yellow-700",
  PAID: "text-lime-700",
  COMPLETED: "text-emerald-800",
  EXPIRED: "text-rose-700",
  CANCELLED: "text-stone-500",
};

const SALE_TEXT: Record<string, string> = {
  TRANSFER: "text-blue-700",
  CASH: "text-green-700",
  CARD: "text-purple-700",
  PROMO: "text-orange-700",
  WRITEOFF: "text-zinc-500",
};

const ORDER_TEXT: Record<string, string> = {
  NEW: "text-sky-700",
  AWAITING_PAYMENT: "text-amber-700",
  PAID: "text-teal-700",
  SHIPPED: "text-indigo-700",
  DELIVERED: "text-cyan-700",
  COMPLETED: "text-emerald-600",
  CANCELLED: "text-gray-400",
  REJECTED: "text-red-700",
};

function formatCZK(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

const DAY_NAMES = ["Po", "Ut", "St", "Ct", "Pa", "So", "Ne"];

export function ActivityCalendar() {
  const t = useTranslations("reservation");
  const tCal = useTranslations("calendar");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [reservations, setReservations] = useState<CalendarReservation[]>([]);
  const [sales, setSales] = useState<CalendarSale[]>([]);
  const [orders, setOrders] = useState<CalendarOrder[]>([]);
  const [deliveries, setDeliveries] = useState<CalendarDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const from = currentMonth.toISOString();
  const to = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59).toISOString();

  useEffect(() => {
    setLoading(true);
    const resParams = new URLSearchParams({ view: "calendar", from, to });
    const saleParams = new URLSearchParams({ from, to, limit: "500" });
    const orderParams = new URLSearchParams({ from, to, limit: "500" });

    const deliveryParams = new URLSearchParams({ from, to });

    Promise.all([
      fetch(`/api/reservations?${resParams}`).then((r) => r.json()),
      fetch(`/api/sales?${saleParams}`).then((r) => r.json()),
      fetch(`/api/orders?${orderParams}`).then((r) => r.json()),
      fetch(`/api/deliveries?${deliveryParams}`).then((r) => r.json()),
    ])
      .then(([resData, saleData, orderData, deliveryData]) => {
        setReservations(resData.data ?? []);
        setSales(saleData.data ?? []);
        setOrders(orderData.data ?? []);
        setDeliveries(Array.isArray(deliveryData) ? deliveryData : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [from, to]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Monday = 0, Sunday = 6
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const days: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
    while (days.length % 7 !== 0) days.push(null);

    return days;
  }, [currentMonth]);

  // Group entries by day
  const byDay = useMemo(() => {
    const map = new Map<number, CalendarEntry[]>();

    for (const r of reservations) {
      const d = new Date(r.paymentDueDate).getDate();
      const arr = map.get(d) ?? [];
      arr.push({ kind: "reservation", data: r });
      map.set(d, arr);
    }

    for (const s of sales) {
      if (!s.completedAt) continue;
      const d = new Date(s.completedAt).getDate();
      const arr = map.get(d) ?? [];
      arr.push({ kind: "sale", data: s });
      map.set(d, arr);
    }

    for (const o of orders) {
      const d = new Date(o.createdAt).getDate();
      const arr = map.get(d) ?? [];
      arr.push({ kind: "order", data: o });
      map.set(d, arr);
    }

    for (const dl of deliveries) {
      const d = new Date(dl.stockedAt).getDate();
      const arr = map.get(d) ?? [];
      arr.push({ kind: "delivery", data: dl });
      map.set(d, arr);
    }

    return map;
  }, [reservations, sales, orders, deliveries]);

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === currentMonth.getFullYear() &&
    today.getMonth() === currentMonth.getMonth();

  const prevMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const monthLabel = currentMonth.toLocaleDateString("cs-CZ", {
    month: "long",
    year: "numeric",
  });

  const selectedEntries = selectedDay ? byDay.get(parseInt(selectedDay)) ?? [] : [];

  function getDotColor(entry: CalendarEntry): string {
    if (entry.kind === "reservation") {
      return RESERVATION_DOT[entry.data.status] ?? "bg-gray-300";
    }
    if (entry.kind === "sale") {
      return SALE_DOT[entry.data.paymentType] ?? "bg-gray-300";
    }
    if (entry.kind === "delivery") {
      return DELIVERY_DOT;
    }
    return ORDER_DOT[entry.data.status] ?? "bg-gray-300";
  }

  function getEntryKey(entry: CalendarEntry): string {
    return `${entry.kind}-${entry.data.id}`;
  }

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="px-3 py-1.5 rounded-lg border border-line hover:bg-nude-50 text-sm"
        >
          &lt;
        </button>
        <h2 className="text-lg font-bold text-ink capitalize">{monthLabel}</h2>
        <button
          onClick={nextMonth}
          className="px-3 py-1.5 rounded-lg border border-line hover:bg-nude-50 text-sm"
        >
          &gt;
        </button>
      </div>

      {/* Calendar grid */}
      {loading ? (
        <p className="text-muted text-center py-8">...</p>
      ) : (
        <div className="border border-line rounded-xl overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-7 bg-nude-50 border-b border-line">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const dayEntries = day ? byDay.get(day) ?? [] : [];
              const isToday = isCurrentMonth && day === today.getDate();
              const isSelected = selectedDay === String(day);
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={!day}
                  onClick={() => day && setSelectedDay(isSelected ? null : String(day))}
                  className={`min-h-[3.5rem] p-1 border-b border-r border-line/50 text-left transition-colors ${
                    !day
                      ? "bg-nude-50/50"
                      : isSelected
                        ? "bg-rose/10"
                        : "hover:bg-nude-50"
                  }`}
                >
                  {day && (
                    <>
                      <div className={`text-xs font-medium mb-0.5 ${
                        isToday
                          ? "text-white bg-rose w-5 h-5 rounded-full flex items-center justify-center"
                          : "text-ink"
                      }`}>
                        {day}
                      </div>
                      {dayEntries.length > 0 && (
                        <div className="flex flex-wrap gap-0.5">
                          {dayEntries.slice(0, 6).map((entry) => (
                            <span
                              key={getEntryKey(entry)}
                              className={`w-2 h-2 rounded-full ${getDotColor(entry)}`}
                            />
                          ))}
                          {dayEntries.length > 6 && (
                            <span className="text-[9px] text-muted">+{dayEntries.length - 6}</span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-6 text-xs text-muted">
        <div>
          <span className="font-medium text-ink">{t("title")}</span>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
            {Object.entries(RESERVATION_DOT).map(([key, color]) => (
              <span key={key} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${color}`} />
                {t(key.toLowerCase())}
              </span>
            ))}
          </div>
        </div>
        <div>
          <span className="font-medium text-ink">{tCal("sales")}</span>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
            {Object.entries(SALE_DOT).map(([key, color]) => (
              <span key={key} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${color}`} />
                {tCal(key.toLowerCase())}
              </span>
            ))}
          </div>
        </div>
        <div>
          <span className="font-medium text-ink">{tCal("orders")}</span>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
            {Object.entries(ORDER_DOT).map(([key, color]) => (
              <span key={key} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${color}`} />
                {tCal(`order_${key.toLowerCase()}`)}
              </span>
            ))}
          </div>
        </div>
        <div>
          <span className="font-medium text-ink">{tCal("deliveries")}</span>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${DELIVERY_DOT}`} />
              {tCal("delivery")}
            </span>
          </div>
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="bg-white border border-line rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-bold text-ink">
            {parseInt(selectedDay)}. {currentMonth.toLocaleDateString("cs-CZ", { month: "long", year: "numeric" })}
          </h3>
          {selectedEntries.length === 0 ? (
            <p className="text-sm text-muted">{tCal("noEntriesDay")}</p>
          ) : (
            selectedEntries.map((entry) => {
              if (entry.kind === "reservation") {
                const r = entry.data;
                return (
                  <Link
                    key={`r-${r.id}`}
                    href={`/reservations/${r.id}`}
                    className="flex items-start gap-2 py-1.5 hover:bg-nude-50 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${RESERVATION_DOT[r.status] ?? "bg-gray-300"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                          {tCal("reservation")}
                        </span>
                        <span className="text-sm font-medium text-ink">
                          {r.reservationNumber ?? r.id.slice(0, 8)}
                        </span>
                        <span className={`text-xs font-medium ${RESERVATION_TEXT[r.status] ?? "text-gray-500"}`}>
                          {t(r.status.toLowerCase())}
                        </span>
                      </div>
                      <div className="text-xs text-muted">
                        {r.salon?.name ?? r.customer?.name ?? r.contactName ?? "—"},{" "}
                        {r.variant.product.name} {r.variant.color} {r.variant.lengthCm}cm
                      </div>
                      <div className="text-xs text-muted">
                        {r.sellingMode === "BY_PIECE" ? `${r.pieces} ks` : `${r.grams} g`} — {formatCZK(r.lineTotal)} CZK
                      </div>
                    </div>
                  </Link>
                );
              }

              if (entry.kind === "sale") {
                const s = entry.data;
                return (
                  <Link
                    key={`s-${s.id}`}
                    href={`/sales/${s.id}`}
                    className="flex items-start gap-2 py-1.5 hover:bg-nude-50 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${SALE_DOT[s.paymentType] ?? "bg-gray-300"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                          {tCal("sale")}
                        </span>
                        <span className="text-sm font-medium text-ink">
                          {s.saleNumber ?? s.id.slice(0, 8)}
                        </span>
                        <span className={`text-xs font-medium ${SALE_TEXT[s.paymentType] ?? "text-gray-500"}`}>
                          {tCal(s.paymentType.toLowerCase())}
                        </span>
                      </div>
                      <div className="text-xs text-muted">
                        {s.salonName ?? s.customerName ?? "—"}
                      </div>
                      <div className="text-xs text-muted">
                        {formatCZK(s.totalAmount)} CZK
                      </div>
                    </div>
                  </Link>
                );
              }

              if (entry.kind === "delivery") {
                const dl = entry.data;
                return (
                  <div
                    key={`d-${dl.id}`}
                    className="flex items-start gap-2 py-1.5 px-2 -mx-2"
                  >
                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${DELIVERY_DOT}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded">
                          {tCal("delivery")}
                        </span>
                        {dl.variant && (
                          <span className="text-sm font-medium text-ink">
                            {dl.variant.product.name} {dl.variant.color} {dl.variant.lengthCm}cm
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted">
                        {dl.initialGrams} g, {dl.initialPieces} ks
                      </div>
                    </div>
                  </div>
                );
              }

              const o = entry.data;
              return (
                <Link
                  key={`o-${o.id}`}
                  href={`/orders/${o.id}`}
                  className="flex items-start gap-2 py-1.5 hover:bg-nude-50 rounded-lg px-2 -mx-2 transition-colors"
                >
                  <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${ORDER_DOT[o.status] ?? "bg-gray-300"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                        {tCal("order")}
                      </span>
                      <span className="text-sm font-medium text-ink">
                        {o.orderNumber ?? o.id.slice(0, 8)}
                      </span>
                      <span className={`text-xs font-medium ${ORDER_TEXT[o.status] ?? "text-gray-500"}`}>
                        {tCal(`order_${o.status.toLowerCase()}`)}
                      </span>
                    </div>
                    <div className="text-xs text-muted">
                      {o.salon?.name ?? o.customer?.name ?? "—"}
                    </div>
                    <div className="text-xs text-muted">
                      {formatCZK(o.totalAmount ?? o.estimatedTotal)} CZK
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
