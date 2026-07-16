"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { Role } from "@prisma/client";

interface ReservationRow {
  id: string;
  reservationNumber?: string;
  status: string;
  customerType: string;
  grams: number;
  pieces: number;
  lineTotal: number;
  sellingMode: string;
  paymentDueDate: string;
  createdAt: string;
  variant: {
    lengthCm: number;
    color: string;
    sellingMode: string;
    product: { name: string };
  };
  salon?: { name: string } | null;
  customer?: { name: string } | null;
  contactName?: string | null;
}

function formatCZK(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-green-100 text-green-700",
  COMPLETED: "bg-nude-100 text-gray-600",
  EXPIRED: "bg-red-100 text-red-700",
  CANCELLED: "bg-nude-100 text-muted",
};

export function ReservationsClient({ role }: { role: Role }) {
  const t = useTranslations("reservation");
  const tCommon = useTranslations("common");
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (statusFilter) params.set("status", statusFilter);

    fetch(`/api/reservations?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setReservations(data.data ?? []);
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  const statuses = ["", "PENDING", "PAID", "COMPLETED", "EXPIRED", "CANCELLED"];

  const isStaff = ["OWNER", "EMPLOYEE"].includes(role);

  function getCustomerName(r: ReservationRow): string {
    return r.salon?.name ?? r.customer?.name ?? r.contactName ?? "—";
  }

  function getDaysLeft(dueDate: string): { text: string; overdue: boolean } {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { text: t("overdue"), overdue: true };
    return { text: t("daysLeft", { days: diff }), overdue: false };
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("title")}</h1>
        {isStaff && (
          <Link href="/reservations/new">
            <Button size="sm">{t("newReservation")}</Button>
          </Link>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {statuses.map((s) => (
          <button
            key={s}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap ${
              statusFilter === s
                ? "border-rose bg-rose/10 text-espresso"
                : "border-line hover:bg-nude-50"
            }`}
            onClick={() => {
              setStatusFilter(s);
              setPage(1);
            }}
          >
            {s === ""
              ? tCommon("all")
              : t(s.toLowerCase())}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted">{tCommon("loading")}</p>
      ) : reservations.length === 0 ? (
        <Card>
          <p className="text-muted text-center py-8">{t("noReservations")}</p>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted">
                  <th className="py-2 pr-3">{t("reservationNumber")}</th>
                  <th className="py-2 pr-3">{t("customer")}</th>
                  <th className="py-2 pr-3">{t("product")}</th>
                  <th className="py-2 pr-3 text-right">{t("quantity")}</th>
                  <th className="py-2 pr-3 text-right">{tCommon("total")}</th>
                  <th className="py-2 pr-3">{t("paymentDueDate")}</th>
                  <th className="py-2 pr-3">{t("status")}</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => {
                  const deadline = getDaysLeft(r.paymentDueDate);
                  return (
                    <tr key={r.id} className="border-b hover:bg-nude-50">
                      <td className="py-2 pr-3">
                        <Link
                          href={`/reservations/${r.id}`}
                          className="text-espresso hover:underline font-medium"
                        >
                          {r.reservationNumber ?? r.id.slice(0, 8)}
                        </Link>
                        <div className="text-xs text-muted">
                          {new Date(r.createdAt).toLocaleDateString("cs-CZ")}
                        </div>
                      </td>
                      <td className="py-2 pr-3">{getCustomerName(r)}</td>
                      <td className="py-2 pr-3">
                        {r.variant.product.name}{" "}
                        <span className="text-muted">
                          {r.variant.color} {r.variant.lengthCm}cm
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-right text-muted">
                        {r.sellingMode === "BY_PIECE"
                          ? `${r.pieces} ks`
                          : `${r.grams} g`}
                      </td>
                      <td className="py-2 pr-3 text-right font-medium">
                        {formatCZK(r.lineTotal)} CZK
                      </td>
                      <td className="py-2 pr-3">
                        {r.status === "PENDING" && (
                          <span
                            className={`text-xs ${
                              deadline.overdue ? "text-red-600 font-bold" : "text-muted"
                            }`}
                          >
                            {deadline.text}
                          </span>
                        )}
                        {r.status !== "PENDING" && (
                          <span className="text-xs text-muted">
                            {new Date(r.paymentDueDate).toLocaleDateString("cs-CZ")}
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            statusColors[r.status] ?? "bg-nude-100"
                          }`}
                        >
                          {t(r.status.toLowerCase())}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                {tCommon("back")}
              </Button>
              <span className="text-sm text-muted self-center">
                {page} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                {tCommon("next")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
