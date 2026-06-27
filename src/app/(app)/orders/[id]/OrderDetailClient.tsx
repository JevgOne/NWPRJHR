"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Role } from "@prisma/client";

interface OrderDetail {
  id: string;
  status: string;
  estimatedTotal: number;
  note?: string;
  internalNote?: string;
  rejectedReason?: string;
  createdAt: string;
  confirmedAt?: string;
  completedAt?: string;
  salon: { id: string; name: string; tier: string };
  items: {
    id: string;
    grams: number;
    pieces: number;
    pricePerGram: number;
    lineTotal: number;
    variant: {
      id: string;
      lengthCm: number;
      color: string;
      product: { name: string };
    };
  }[];
  sale?: { id: string; saleNumber?: string };
}

function formatCZK(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function OrderDetailClient({
  id,
  role,
  userId,
}: {
  id: string;
  role: Role;
  userId: string;
}) {
  const t = useTranslations("orderManagement");
  const tCommon = useTranslations("common");
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  const isOwner = role === "OWNER";
  const isStaff = ["OWNER", "EMPLOYEE"].includes(role);

  const load = () => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then(setOrder)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const doAction = async (action: string, body?: Record<string, unknown>) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...body }),
    });
    if (res.ok) load();
  };

  if (loading) return <p className="text-muted">{tCommon("loading")}</p>;
  if (!order) return <p className="text-red-500">{tCommon("error")}</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{t("orderDetail")}</h1>
          <div className="text-sm text-muted">
            {order.salon.name} |{" "}
            {new Date(order.createdAt).toLocaleDateString("cs-CZ")}
          </div>
        </div>
        <Link href="/orders">
          <Button variant="secondary" size="sm">
            {tCommon("back")}
          </Button>
        </Link>
      </div>

      {/* Items */}
      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted">
              <th className="py-1 pr-2">-</th>
              <th className="py-1 pr-2 text-right">{t("quantity")}</th>
              <th className="py-1 pr-2 text-right">{t("pricePerGram")}</th>
              <th className="py-1 text-right">{t("estimatedTotal")}</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="py-1.5 pr-2">
                  {item.variant.product.name} {item.variant.lengthCm}cm{" "}
                  {item.variant.color}
                </td>
                <td className="py-1.5 pr-2 text-right">
                  {item.grams}g{item.pieces > 0 ? ` / ${item.pieces}ks` : ""}
                </td>
                <td className="py-1.5 pr-2 text-right">
                  {formatCZK(item.pricePerGram)}
                </td>
                <td className="py-1.5 text-right font-medium">
                  {formatCZK(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 pt-3 border-t flex justify-between font-bold">
          <span>{t("estimatedTotal")}</span>
          <span>{formatCZK(order.estimatedTotal)} CZK</span>
        </div>
      </Card>

      {/* Notes */}
      {order.note && (
        <Card padding="sm">
          <div className="text-sm">
            <span className="text-muted">{t("note")}: </span>
            {order.note}
          </div>
        </Card>
      )}

      {order.rejectedReason && (
        <Card padding="sm">
          <div className="text-sm text-red-600">
            <span className="font-medium">{t("rejectReason")}: </span>
            {order.rejectedReason}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {order.status === "NEW" && isOwner && (
          <>
            <Button size="sm" onClick={() => doAction("confirm")}>
              {t("confirmOrder")}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowReject(!showReject)}
            >
              {t("rejectOrder")}
            </Button>
          </>
        )}

        {order.status === "CONFIRMED" && isStaff && (
          <Button
            size="sm"
            onClick={() => doAction("status", { status: "READY" })}
          >
            {t("markReady")}
          </Button>
        )}

        {order.status === "READY" && isStaff && (
          <Button
            size="sm"
            onClick={() => doAction("status", { status: "IN_TRANSIT" })}
          >
            {t("markInTransit")}
          </Button>
        )}

        {["CONFIRMED", "READY", "IN_TRANSIT"].includes(order.status) &&
          isStaff && (
            <Button size="sm" onClick={() => doAction("complete")}>
              {t("completeOrder")}
            </Button>
          )}

        {!["COMPLETED", "CANCELLED", "REJECTED"].includes(order.status) && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => doAction("cancel")}
          >
            {t("cancelOrder")}
          </Button>
        )}
      </div>

      {showReject && (
        <Card padding="sm">
          <Input
            label={t("rejectReason")}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <Button
            size="sm"
            className="mt-2"
            onClick={() => {
              if (rejectReason.trim()) {
                doAction("reject", { reason: rejectReason });
                setShowReject(false);
              }
            }}
          >
            {tCommon("confirm")}
          </Button>
        </Card>
      )}

      {/* Sale link */}
      {order.sale && (
        <Link
          href={`/sales/${order.sale.id}`}
          className="text-sm text-espresso hover:underline"
        >
          {order.sale.saleNumber || order.sale.id.slice(0, 8)}
        </Link>
      )}
    </div>
  );
}
