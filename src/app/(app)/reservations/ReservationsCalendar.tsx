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
  createdByUser?: { name: string | null } | null;
}

interface CalendarSale {
  id: string;
  saleNumber?: string;
  paymentType: string;
  totalAmount: number;
  completedAt: string;
  salonName?: string | null;
  customerName?: string | null;
  userName?: string | null;
  items: { grams: number; pieces: number; lineTotal: number }[];
}

interface CalendarOrder {
  id: string;
  orderNumber?: string;
  status: string;
  totalAmount?: number | null;
  estimatedTotal: number;
  createdAt: string;
  contactName?: string | null;
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
  createdByName?: string | null;
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

// --- Dot colors by status ---

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
  WRITEOFF: "bg-amber-300",
};

const ORDER_DOT: Record<string, string> = {
  NEW: "bg-sky-400",
  AWAITING_PAYMENT: "bg-amber-500",
  PAID: "bg-teal-500",
  SHIPPED: "bg-indigo-500",
  DELIVERED: "bg-cyan-500",
  COMPLETED: "bg-emerald-400",
  CANCELLED: "bg-red-300",
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
  WRITEOFF: "text-amber-600",
};

const ORDER_TEXT: Record<string, string> = {
  NEW: "text-sky-700",
  AWAITING_PAYMENT: "text-amber-700",
  PAID: "text-teal-700",
  SHIPPED: "text-indigo-700",
  DELIVERED: "text-cyan-700",
  COMPLETED: "text-emerald-600",
  CANCELLED: "text-red-400",
  REJECTED: "text-red-700",
};

// --- Emoji constants ---

const TYPE_EMOJI = {
  reservation: "📋",
  sale: "💰",
  order: "📦",
  delivery: "📥",
} as const;

const STATUS_EMOJI: Record<string, string> = {
  PENDING: "⏳",
  PAID: "✅",
  COMPLETED: "🔄",
  EXPIRED: "⌛",
  CANCELLED: "❌",
  TRANSFER: "🏦",
  CASH: "💵",
  CARD: "💳",
  PROMO: "🎁",
  WRITEOFF: "📝",
  NEW: "🆕",
  AWAITING_PAYMENT: "⏳",
  CONFIRMED: "✔️",
  PROCESSING: "⚙️",
  READY: "📦",
  SHIPPED: "🚚",
  DELIVERED: "📬",
  REJECTED: "🚫",
};

// --- Helpers ---

function formatCZK(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

const DAY_NAMES = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

function getDayBgIntensity(count: number): string {
  if (count === 0) return "";
  if (count <= 2) return "bg-rose/[0.03]";
  if (count <= 5) return "bg-rose/[0.06]";
  if (count <= 10) return "bg-rose/[0.10]";
  return "bg-rose/[0.15]";
}

function getEntryAmount(entry: CalendarEntry): number {
  if (entry.kind === "reservation") return entry.data.lineTotal;
  if (entry.kind === "sale") return entry.data.totalAmount;
  if (entry.kind === "order") return entry.data.totalAmount ?? entry.data.estimatedTotal;
  return 0;
}

function getDotColor(entry: CalendarEntry): string {
  if (entry.kind === "reservation") return RESERVATION_DOT[entry.data.status] ?? "bg-gray-300";
  if (entry.kind === "sale") return SALE_DOT[entry.data.paymentType] ?? "bg-gray-300";
  if (entry.kind === "delivery") return DELIVERY_DOT;
  return ORDER_DOT[entry.data.status] ?? "bg-gray-300";
}

function getEntryKey(entry: CalendarEntry): string {
  return `${entry.kind}-${entry.data.id}`;
}

function isCancelledEntry(entry: CalendarEntry): boolean {
  return (
    (entry.kind === "reservation" && entry.data.status === "CANCELLED") ||
    (entry.kind === "order" && entry.data.status === "CANCELLED") ||
    (entry.kind === "sale" && entry.data.paymentType === "WRITEOFF")
  );
}

// --- Sub-components ---

function DaySummary({ entries }: { entries: CalendarEntry[] }) {
  const counts = { reservation: 0, sale: 0, order: 0, delivery: 0 };
  for (const e of entries) counts[e.kind]++;

  const chips: { key: string; count: number; bg: string; text: string; emoji: string }[] = [];
  if (counts.reservation > 0) chips.push({ key: "r", count: counts.reservation, bg: "bg-amber-100", text: "text-amber-700", emoji: "📋" });
  if (counts.sale > 0) chips.push({ key: "s", count: counts.sale, bg: "bg-blue-100", text: "text-blue-700", emoji: "💰" });
  if (counts.order > 0) chips.push({ key: "o", count: counts.order, bg: "bg-indigo-100", text: "text-indigo-700", emoji: "📦" });
  if (counts.delivery > 0) chips.push({ key: "d", count: counts.delivery, bg: "bg-teal-100", text: "text-teal-700", emoji: "📥" });

  return (
    <div className="flex flex-col gap-0.5 mt-0.5">
      {chips.slice(0, 3).map(({ key, count, bg, text, emoji }) => (
        <div key={key} className={`flex items-center gap-0.5 rounded px-1 py-px text-[10px] font-medium leading-tight ${bg} ${text}`}>
          <span className="text-[9px]">{emoji}</span>
          <span>{count}</span>
        </div>
      ))}
      {chips.length > 3 && (
        <span className="text-[9px] text-muted">+{chips.length - 3}</span>
      )}
    </div>
  );
}

function DaySummaryInline({ entries }: { entries: CalendarEntry[] }) {
  const counts = { reservation: 0, sale: 0, order: 0, delivery: 0 };
  for (const e of entries) counts[e.kind]++;

  return (
    <div className="flex gap-1 flex-wrap">
      {counts.reservation > 0 && (
        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-medium">
          📋 {counts.reservation}
        </span>
      )}
      {counts.sale > 0 && (
        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-medium">
          💰 {counts.sale}
        </span>
      )}
      {counts.order > 0 && (
        <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] font-medium">
          📦 {counts.order}
        </span>
      )}
      {counts.delivery > 0 && (
        <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 text-[10px] font-medium">
          📥 {counts.delivery}
        </span>
      )}
    </div>
  );
}

function DayTooltip({ entries, day, monthLabel }: {
  entries: CalendarEntry[];
  day: number;
  monthLabel: string;
}) {
  if (entries.length === 0) return null;

  const counts = { reservation: 0, sale: 0, order: 0, delivery: 0 };
  let totalAmount = 0;
  for (const e of entries) {
    counts[e.kind]++;
    totalAmount += getEntryAmount(e);
  }

  return (
    <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 z-30
                    hidden group-hover:block
                    bg-ink text-white text-[11px] rounded-lg shadow-lg px-3 py-2 whitespace-nowrap">
      <div className="font-semibold mb-1">{day}. {monthLabel}</div>
      {counts.reservation > 0 && <div className="flex justify-between gap-3"><span>📋 Rezervace</span><span>{counts.reservation}</span></div>}
      {counts.sale > 0 && <div className="flex justify-between gap-3"><span>💰 Prodeje</span><span>{counts.sale}</span></div>}
      {counts.order > 0 && <div className="flex justify-between gap-3"><span>📦 Objednávky</span><span>{counts.order}</span></div>}
      {counts.delivery > 0 && <div className="flex justify-between gap-3"><span>📥 Naskladnění</span><span>{counts.delivery}</span></div>}
      {totalAmount > 0 && (
        <div className="mt-1 pt-1 border-t border-white/20 font-medium text-right">
          {formatCZK(totalAmount)} CZK
        </div>
      )}
      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0
                      border-l-[5px] border-r-[5px] border-t-[5px]
                      border-l-transparent border-r-transparent border-t-ink" />
    </div>
  );
}

function getEntryHref(entry: CalendarEntry): string {
  if (entry.kind === "reservation") return `/reservations/${entry.data.id}`;
  if (entry.kind === "sale") return `/sales/${entry.data.id}`;
  if (entry.kind === "order") return `/orders/${entry.data.id}`;
  return `/inventory/deliveries/${entry.data.id}`;
}

function getEntryLabel(entry: CalendarEntry): string | null {
  if (entry.kind === "reservation") return entry.data.reservationNumber ?? entry.data.id.slice(0, 8);
  if (entry.kind === "sale") return entry.data.saleNumber ?? entry.data.id.slice(0, 8);
  if (entry.kind === "order") return entry.data.orderNumber ?? entry.data.id.slice(0, 8);
  return null;
}

function WeekDayEntry({ entry }: { entry: CalendarEntry }) {
  const emoji = TYPE_EMOJI[entry.kind];
  const label = getEntryLabel(entry);
  const amount = getEntryAmount(entry);
  const href = getEntryHref(entry);
  const dot = getDotColor(entry);

  return (
    <Link href={href} className="flex items-center gap-1 text-[11px] hover:bg-nude-50 rounded px-1 py-0.5 transition-colors">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      <span className="text-[10px]">{emoji}</span>
      <span className="truncate text-muted">{label ?? "—"}</span>
      {amount > 0 && <span className="ml-auto text-ink font-medium whitespace-nowrap">{formatCZK(amount)}</span>}
    </Link>
  );
}

// --- Main component ---

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
  const [showStatusLegend, setShowStatusLegend] = useState(false);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const dow = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dow + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  // Filters — persisted to localStorage
  const [filters, setFilters] = useState({
    reservations: true,
    sales: true,
    orders: true,
    deliveries: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem("calendar-filters");
    if (saved) {
      try { setFilters(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("calendar-filters", JSON.stringify(filters));
  }, [filters]);

  const { from, to } = useMemo(() => {
    if (viewMode === "week") {
      const end = new Date(currentWeekStart);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59);
      return { from: currentWeekStart.toISOString(), to: end.toISOString() };
    }
    return {
      from: currentMonth.toISOString(),
      to: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59).toISOString(),
    };
  }, [viewMode, currentMonth, currentWeekStart]);

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

    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const days: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
    while (days.length % 7 !== 0) days.push(null);

    return days;
  }, [currentMonth]);

  // Group entries by day — respects filters
  const byDay = useMemo(() => {
    const map = new Map<number, CalendarEntry[]>();

    if (filters.reservations) {
      for (const r of reservations) {
        const d = new Date(r.paymentDueDate).getDate();
        const arr = map.get(d) ?? [];
        arr.push({ kind: "reservation", data: r });
        map.set(d, arr);
      }
    }

    if (filters.sales) {
      for (const s of sales) {
        if (!s.completedAt) continue;
        const d = new Date(s.completedAt).getDate();
        const arr = map.get(d) ?? [];
        arr.push({ kind: "sale", data: s });
        map.set(d, arr);
      }
    }

    if (filters.orders) {
      for (const o of orders) {
        const d = new Date(o.createdAt).getDate();
        const arr = map.get(d) ?? [];
        arr.push({ kind: "order", data: o });
        map.set(d, arr);
      }
    }

    if (filters.deliveries) {
      for (const dl of deliveries) {
        const d = new Date(dl.stockedAt).getDate();
        const arr = map.get(d) ?? [];
        arr.push({ kind: "delivery", data: dl });
        map.set(d, arr);
      }
    }

    return map;
  }, [reservations, sales, orders, deliveries, filters]);

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === currentMonth.getFullYear() &&
    today.getMonth() === currentMonth.getMonth();

  const prevMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - 7);
    setCurrentWeekStart(d);
  };
  const nextWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + 7);
    setCurrentWeekStart(d);
  };

  const monthLabel = currentMonth.toLocaleDateString("cs-CZ", {
    month: "long",
    year: "numeric",
  });

  const shortMonthLabel = currentMonth.toLocaleDateString("cs-CZ", { month: "short" });

  // Week days for weekly view
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentWeekStart]);

  const weekLabel = `${weekDays[0].getDate()}.${weekDays[0].getMonth() + 1}. — ${weekDays[6].getDate()}.${weekDays[6].getMonth() + 1}.${weekDays[6].getFullYear()}`;

  // For week view, group by actual Date (not just day number within month)
  const byDayWeek = useMemo(() => {
    if (viewMode !== "week") return new Map<string, CalendarEntry[]>();
    const map = new Map<string, CalendarEntry[]>();

    function addEntry(dateStr: string, entry: CalendarEntry) {
      const d = new Date(dateStr);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const arr = map.get(key) ?? [];
      arr.push(entry);
      map.set(key, arr);
    }

    if (filters.reservations) {
      for (const r of reservations) addEntry(r.paymentDueDate, { kind: "reservation", data: r });
    }
    if (filters.sales) {
      for (const s of sales) { if (s.completedAt) addEntry(s.completedAt, { kind: "sale", data: s }); }
    }
    if (filters.orders) {
      for (const o of orders) addEntry(o.createdAt, { kind: "order", data: o });
    }
    if (filters.deliveries) {
      for (const dl of deliveries) addEntry(dl.stockedAt, { kind: "delivery", data: dl });
    }

    return map;
  }, [viewMode, reservations, sales, orders, deliveries, filters]);

  const selectedEntries = selectedDay ? byDay.get(parseInt(selectedDay)) ?? [] : [];

  return (
    <div className="space-y-4">
      {/* Filter chips = legend */}
      <div className="flex flex-wrap gap-2">
        {([
          { key: "reservations" as const, label: tCal("reservation"), emoji: "📋", active: "bg-amber-50 text-amber-700 border-amber-200", count: reservations.length },
          { key: "sales" as const, label: tCal("sales"), emoji: "💰", active: "bg-blue-50 text-blue-700 border-blue-200", count: sales.length },
          { key: "orders" as const, label: tCal("orders"), emoji: "📦", active: "bg-indigo-50 text-indigo-700 border-indigo-200", count: orders.length },
          { key: "deliveries" as const, label: tCal("deliveries"), emoji: "📥", active: "bg-teal-50 text-teal-700 border-teal-200", count: deliveries.length },
        ]).map(({ key, label, emoji, active, count }) => (
          <button
            key={key}
            onClick={() => setFilters(f => ({ ...f, [key]: !f[key] }))}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
              filters[key] ? active : "bg-nude-50/50 text-muted/50 border-line/50 line-through"
            }`}
          >
            <span className="text-sm">{emoji}</span>
            {label}
            <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${
              filters[key] ? "bg-white/60" : "bg-nude-100/50"
            }`}>
              {count}
            </span>
          </button>
        ))}

        <button
          onClick={() => setShowStatusLegend(v => !v)}
          className="text-[11px] text-muted hover:text-ink transition-colors self-center ml-auto"
        >
          {showStatusLegend ? tCal("hideLegend") : tCal("showLegend")}
        </button>
      </div>

      {/* Collapsible status legend */}
      {showStatusLegend && (
        <div className="bg-nude-50 rounded-xl p-3 text-xs text-muted grid grid-cols-2 sm:grid-cols-4 gap-3">
          {filters.reservations && (
            <div>
              <span className="font-medium text-ink">📋 {t("title")}</span>
              <div className="flex flex-col gap-0.5 mt-1">
                {Object.entries(RESERVATION_DOT).map(([key, color]) => (
                  <span key={key} className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${color}`} />
                    <span>{STATUS_EMOJI[key] ?? ""}</span>
                    {t(key.toLowerCase())}
                  </span>
                ))}
              </div>
            </div>
          )}
          {filters.sales && (
            <div>
              <span className="font-medium text-ink">💰 {tCal("sales")}</span>
              <div className="flex flex-col gap-0.5 mt-1">
                {Object.entries(SALE_DOT).map(([key, color]) => (
                  <span key={key} className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${color}`} />
                    <span>{STATUS_EMOJI[key] ?? ""}</span>
                    {tCal(key.toLowerCase())}
                  </span>
                ))}
              </div>
            </div>
          )}
          {filters.orders && (
            <div>
              <span className="font-medium text-ink">📦 {tCal("orders")}</span>
              <div className="flex flex-col gap-0.5 mt-1">
                {Object.entries(ORDER_DOT).map(([key, color]) => (
                  <span key={key} className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${color}`} />
                    <span>{STATUS_EMOJI[key] ?? ""}</span>
                    {tCal(`order_${key.toLowerCase()}`)}
                  </span>
                ))}
              </div>
            </div>
          )}
          {filters.deliveries && (
            <div>
              <span className="font-medium text-ink">📥 {tCal("deliveries")}</span>
              <div className="flex flex-col gap-0.5 mt-1">
                <span className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${DELIVERY_DOT}`} />
                  {tCal("delivery")}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation + view toggle */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={viewMode === "month" ? prevMonth : prevWeek}
          className="px-3 py-1.5 rounded-lg border border-line hover:bg-nude-50 text-sm"
        >
          &lt;
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-ink capitalize">
            {viewMode === "month" ? monthLabel : weekLabel}
          </h2>
          <div className="flex gap-1 bg-nude-50 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === "month" ? "bg-white shadow-sm text-ink" : "text-muted hover:text-ink"
              }`}
            >
              {tCal("month")}
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === "week" ? "bg-white shadow-sm text-ink" : "text-muted hover:text-ink"
              }`}
            >
              {tCal("week")}
            </button>
          </div>
        </div>
        <button
          onClick={viewMode === "month" ? nextMonth : nextWeek}
          className="px-3 py-1.5 rounded-lg border border-line hover:bg-nude-50 text-sm"
        >
          &gt;
        </button>
      </div>

      {/* Calendar content */}
      {loading ? (
        <p className="text-muted text-center py-8">...</p>
      ) : (
        <>
          {/* Desktop: calendar grid or weekly view */}
          {viewMode === "week" ? (
            <div className="hidden sm:block border border-line rounded-xl overflow-hidden">
              <div className="grid grid-cols-7 bg-nude-50 border-b border-line">
                {weekDays.map((wd) => {
                  const isToday = wd.toDateString() === today.toDateString();
                  return (
                    <div key={wd.toISOString()} className="text-center py-2">
                      <div className="text-xs font-medium text-muted">{DAY_NAMES[wd.getDay() === 0 ? 6 : wd.getDay() - 1]}</div>
                      <div className={`text-sm font-bold ${isToday ? "text-rose" : "text-ink"}`}>
                        {wd.getDate()}.{wd.getMonth() + 1}.
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-7">
                {weekDays.map((wd) => {
                  const key = `${wd.getFullYear()}-${wd.getMonth()}-${wd.getDate()}`;
                  const dayEntries = byDayWeek.get(key) ?? [];
                  const isToday = wd.toDateString() === today.toDateString();
                  return (
                    <div
                      key={wd.toISOString()}
                      className={`min-h-[8rem] p-1.5 border-r border-line/50 space-y-0.5 ${
                        isToday ? "ring-2 ring-rose/40 ring-inset bg-rose/[0.03]" : getDayBgIntensity(dayEntries.length)
                      }`}
                    >
                      {dayEntries.map((entry) => (
                        <WeekDayEntry key={getEntryKey(entry)} entry={entry} />
                      ))}
                      {dayEntries.length === 0 && (
                        <span className="text-[10px] text-muted/40 block pt-2 text-center">—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="hidden sm:block border border-line rounded-xl overflow-hidden">
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
                      className={`group relative min-h-[4.5rem] p-1.5 border-b border-r transition-colors text-left ${
                        !day
                          ? "bg-nude-50/50 border-line/50"
                          : isToday
                            ? `ring-2 ring-rose/40 ring-inset ${isSelected ? "bg-rose/10" : getDayBgIntensity(dayEntries.length)} border-rose/20`
                            : isSelected
                              ? "bg-rose/10 ring-1 ring-rose/30 ring-inset border-line/50"
                              : `${getDayBgIntensity(dayEntries.length)} hover:bg-nude-50 cursor-pointer border-line/30`
                      }`}
                    >
                      {day && (
                        <>
                          <div className={`text-xs font-bold mb-0.5 ${
                            isToday
                              ? "text-white bg-rose w-5 h-5 rounded-full flex items-center justify-center shadow-sm"
                              : dayEntries.length > 0 ? "text-ink" : "text-muted"
                          }`}>
                            {day}
                          </div>
                          {dayEntries.length > 0 && (
                            <>
                              <DaySummary entries={dayEntries} />
                              <DayTooltip entries={dayEntries} day={day} monthLabel={shortMonthLabel} />
                            </>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mobile: list view */}
          <div className="block sm:hidden space-y-1">
            {Array.from(byDay.entries())
              .sort(([a], [b]) => a - b)
              .map(([day, entries]) => {
                const totalAmount = entries.reduce((sum, e) => sum + getEntryAmount(e), 0);
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(selectedDay === String(day) ? null : String(day))}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl border transition-colors text-left ${
                      selectedDay === String(day)
                        ? "bg-rose/10 border-rose/20"
                        : "bg-white border-line hover:bg-nude-50"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      isCurrentMonth && day === today.getDate()
                        ? "bg-rose text-white"
                        : "bg-nude-50 text-ink"
                    }`}>
                      {day}
                    </div>
                    <div className="flex gap-1.5 flex-1 min-w-0">
                      <DaySummaryInline entries={entries} />
                    </div>
                    {totalAmount > 0 && (
                      <span className="text-xs text-muted flex-shrink-0">
                        {formatCZK(totalAmount)} CZK
                      </span>
                    )}
                  </button>
                );
              })
            }
            {byDay.size === 0 && (
              <p className="text-sm text-muted text-center py-6">{tCal("noEntries")}</p>
            )}
          </div>
        </>
      )}

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
              const cancelled = isCancelledEntry(entry);

              if (entry.kind === "reservation") {
                const r = entry.data;
                return (
                  <Link
                    key={`r-${r.id}`}
                    href={`/reservations/${r.id}`}
                    className={`flex items-start gap-2 py-1.5 hover:bg-nude-50 rounded-lg px-2 -mx-2 transition-colors ${cancelled ? "opacity-50" : ""}`}
                  >
                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${RESERVATION_DOT[r.status] ?? "bg-gray-300"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                          📋 {tCal("reservation")}
                        </span>
                        <span className="text-sm font-medium text-ink">
                          {r.reservationNumber ?? r.id.slice(0, 8)}
                        </span>
                        <span className={`text-xs font-medium ${RESERVATION_TEXT[r.status] ?? "text-gray-500"}`}>
                          {STATUS_EMOJI[r.status] ?? ""} {t(r.status.toLowerCase())}
                        </span>
                      </div>
                      <div className="text-xs text-muted">
                        {r.salon?.name ?? r.customer?.name ?? r.contactName ?? "—"},{" "}
                        {r.variant.product.name} {r.variant.color} {r.variant.lengthCm}cm
                      </div>
                      <div className="text-xs text-muted">
                        {r.sellingMode === "BY_PIECE" ? `${r.pieces} ks` : `${r.grams} g`} — {formatCZK(r.lineTotal)} CZK
                      </div>
                      {r.createdByUser?.name && (
                        <div className="text-xs text-muted/70">
                          {tCal("createdBy")}: {r.createdByUser.name}
                        </div>
                      )}
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
                    className={`flex items-start gap-2 py-1.5 hover:bg-nude-50 rounded-lg px-2 -mx-2 transition-colors ${cancelled ? "opacity-50" : ""}`}
                  >
                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${SALE_DOT[s.paymentType] ?? "bg-gray-300"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                          💰 {tCal("sale")}
                        </span>
                        <span className="text-sm font-medium text-ink">
                          {s.saleNumber ?? s.id.slice(0, 8)}
                        </span>
                        <span className={`text-xs font-medium ${SALE_TEXT[s.paymentType] ?? "text-gray-500"}`}>
                          {STATUS_EMOJI[s.paymentType] ?? ""} {tCal(s.paymentType.toLowerCase())}
                        </span>
                      </div>
                      <div className="text-xs text-muted">
                        {s.salonName ?? s.customerName ?? "—"}
                      </div>
                      <div className="text-xs text-muted">
                        {formatCZK(s.totalAmount)} CZK
                      </div>
                      {s.userName && (
                        <div className="text-xs text-muted/70">
                          {tCal("createdBy")}: {s.userName}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              }

              if (entry.kind === "delivery") {
                const dl = entry.data;
                return (
                  <Link
                    key={`d-${dl.id}`}
                    href={`/inventory/deliveries/${dl.id}`}
                    className="flex items-start gap-2 py-1.5 hover:bg-nude-50 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${DELIVERY_DOT}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded">
                          📥 {tCal("delivery")}
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
                      {dl.createdByName && (
                        <div className="text-xs text-muted/70">
                          {tCal("stockedBy")}: {dl.createdByName}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              }

              const o = entry.data;
              return (
                <Link
                  key={`o-${o.id}`}
                  href={`/orders/${o.id}`}
                  className={`flex items-start gap-2 py-1.5 hover:bg-nude-50 rounded-lg px-2 -mx-2 transition-colors ${cancelled ? "opacity-50" : ""}`}
                >
                  <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${ORDER_DOT[o.status] ?? "bg-gray-300"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                        📦 {tCal("order")}
                      </span>
                      <span className="text-sm font-medium text-ink">
                        {o.orderNumber ?? o.id.slice(0, 8)}
                      </span>
                      <span className={`text-xs font-medium ${ORDER_TEXT[o.status] ?? "text-gray-500"}`}>
                        {STATUS_EMOJI[o.status] ?? ""} {tCal(`order_${o.status.toLowerCase()}`)}
                      </span>
                    </div>
                    <div className="text-xs text-muted">
                      {o.salon?.name ?? o.customer?.name ?? o.contactName ?? "—"}
                    </div>
                    <div className="text-xs text-muted">
                      {formatCZK(o.totalAmount ?? o.estimatedTotal)} CZK
                    </div>
                    {o.contactName && (
                      <div className="text-xs text-muted/70">
                        {tCal("orderedBy")}: {o.contactName}
                      </div>
                    )}
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
