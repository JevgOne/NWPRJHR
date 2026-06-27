"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { Role } from "@prisma/client";

interface SalonDetail {
  id: string;
  name: string;
  type?: string;
  ico?: string;
  dic?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  city?: string;
  address?: string;
  language: string;
  tier: string;
  points: number;
  totalRevenue: number;
  archived: boolean;
  approved: boolean;
  website?: string;
  instagram?: string;
  notes?: string;
  startDate: string;
  orders: {
    id: string;
    status: string;
    estimatedTotal: number;
    createdAt: string;
  }[];
  sales: {
    id: string;
    saleNumber?: string;
    totalAmount: number;
    completedAt?: string;
    status: string;
  }[];
  invoices: {
    id: string;
    number: string;
    total: number;
    status: string;
    dueDate: string;
  }[];
  sampleRequests: {
    id: string;
    status: string;
    grams?: number;
    product: { name: string };
    createdAt: string;
  }[];
  stats?: { totalDebt: number; overdueCount: number };
}

function formatCZK(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

const tierColors: Record<string, string> = {
  BRONZE: "bg-amber-100 text-amber-700",
  SILVER: "bg-gray-200 text-gray-700",
  GOLD: "bg-yellow-100 text-yellow-700",
  PLATINUM: "bg-purple-100 text-purple-700",
};

export function SalonDetailClient({
  id,
  role,
}: {
  id: string;
  role: Role;
}) {
  const t = useTranslations("salon");
  const tLoyalty = useTranslations("loyalty");
  const tOrder = useTranslations("orderManagement");
  const tInvoice = useTranslations("invoice");
  const tSample = useTranslations("sampleManagement");
  const tCommon = useTranslations("common");
  const [salon, setSalon] = useState<SalonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);

  const isOwner = role === "OWNER";

  const load = () => {
    fetch(`/api/salons/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setSalon(data);
        setNotes(data.notes ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleArchive = async () => {
    await fetch(`/api/salons/${id}/archive`, { method: "POST" });
    load();
  };

  const handleApprove = async () => {
    await fetch(`/api/salons/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: true }),
    });
    load();
  };

  const handleSaveNotes = async () => {
    setNotesSaving(true);
    await fetch(`/api/salons/${id}/notes`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setNotesSaving(false);
  };

  if (loading) return <p className="text-gray-500">{tCommon("loading")}</p>;
  if (!salon) return <p className="text-red-500">{tCommon("error")}</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{salon.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                tierColors[salon.tier] ?? "bg-gray-100"
              }`}
            >
              {tLoyalty(salon.tier.toLowerCase())}
            </span>
            {salon.type === "HAIRDRESSER" && (
              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                {t("typeHairdresser")}
              </span>
            )}
            {salon.city && (
              <span className="text-gray-400 text-sm">{salon.city}</span>
            )}
            {!salon.approved && (
              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                {t("pendingApproval")}
              </span>
            )}
            {salon.archived && (
              <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                {t("archived")}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {isOwner && !salon.approved && (
            <Button size="sm" onClick={handleApprove}>
              Schválit salon
            </Button>
          )}
          {isOwner && (
            <Button size="sm" variant="secondary" onClick={handleArchive}>
              {salon.archived ? t("unarchive") : t("archive")}
            </Button>
          )}
          <Link href="/salons">
            <Button size="sm" variant="secondary">
              {tCommon("back")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Contact */}
      <Card padding="sm">
        <div className="grid grid-cols-2 gap-y-1 text-sm">
          {salon.contactPerson && (
            <>
              <span className="text-gray-500">{t("contactPerson")}</span>
              <span>{salon.contactPerson}</span>
            </>
          )}
          {salon.email && (
            <>
              <span className="text-gray-500">E-mail</span>
              <span>{salon.email}</span>
            </>
          )}
          {salon.phone && (
            <>
              <span className="text-gray-500">Tel</span>
              <span>{salon.phone}</span>
            </>
          )}
          {salon.ico && (
            <>
              <span className="text-gray-500">ICO</span>
              <span>{salon.ico}</span>
            </>
          )}
          {salon.address && (
            <>
              <span className="text-gray-500">{t("address")}</span>
              <span>{salon.address}</span>
            </>
          )}
          {salon.website && (
            <>
              <span className="text-gray-500">Web</span>
              <a href={salon.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{salon.website}</a>
            </>
          )}
          {salon.instagram && (
            <>
              <span className="text-gray-500">Instagram</span>
              <a href={salon.instagram.startsWith("http") ? salon.instagram : `https://instagram.com/${salon.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{salon.instagram}</a>
            </>
          )}
        </div>
      </Card>

      {/* Loyalty */}
      <Card padding="sm">
        <h3 className="text-xs text-gray-500 mb-2 uppercase">
          {tLoyalty("program")}
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">
              {formatCZK(salon.totalRevenue)}
            </div>
            <div className="text-xs text-gray-500">{t("revenueTotal")} CZK</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{salon.points}</div>
            <div className="text-xs text-gray-500">{tLoyalty("points")}</div>
          </div>
          <div>
            <div
              className={`text-lg font-bold px-2 py-1 rounded ${
                tierColors[salon.tier] ?? ""
              }`}
            >
              {tLoyalty(salon.tier.toLowerCase())}
            </div>
            <div className="text-xs text-gray-500">{tLoyalty("tier")}</div>
          </div>
        </div>
      </Card>

      {/* Debt (OWNER) */}
      {isOwner && salon.stats && salon.stats.totalDebt > 0 && (
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-red-600">
                {t("debt")}: {formatCZK(salon.stats.totalDebt)} CZK
              </span>
              {salon.stats.overdueCount > 0 && (
                <span className="ml-2 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                  {salon.stats.overdueCount}x {t("overdue")}
                </span>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Recent Orders */}
      {salon.orders.length > 0 && (
        <Card>
          <h3 className="font-medium text-sm mb-2">{tOrder("title")}</h3>
          {salon.orders.slice(0, 5).map((o) => (
            <div
              key={o.id}
              className="flex justify-between text-sm border-b py-1"
            >
              <Link
                href={`/orders/${o.id}`}
                className="text-indigo-600 hover:underline"
              >
                {new Date(o.createdAt).toLocaleDateString("cs-CZ")}
              </Link>
              <span className="text-gray-500">{tOrder(o.status.toLowerCase())}</span>
              <span className="font-medium">
                {formatCZK(o.estimatedTotal)} CZK
              </span>
            </div>
          ))}
        </Card>
      )}

      {/* Recent Invoices */}
      {salon.invoices.length > 0 && (
        <Card>
          <h3 className="font-medium text-sm mb-2">{tInvoice("invoice")}</h3>
          {salon.invoices.slice(0, 5).map((inv) => (
            <div
              key={inv.id}
              className="flex justify-between text-sm border-b py-1"
            >
              <Link
                href={`/invoices/${inv.id}`}
                className="text-indigo-600 hover:underline"
              >
                {inv.number}
              </Link>
              <span
                className={
                  inv.status === "OVERDUE" ? "text-red-600" : "text-gray-500"
                }
              >
                {inv.status}
              </span>
              <span className="font-medium">
                {formatCZK(inv.total)} CZK
              </span>
            </div>
          ))}
        </Card>
      )}

      {/* Samples */}
      {salon.sampleRequests.length > 0 && (
        <Card>
          <h3 className="font-medium text-sm mb-2">
            {tSample("title")}
          </h3>
          {salon.sampleRequests.slice(0, 5).map((sr) => (
            <div
              key={sr.id}
              className="flex justify-between text-sm border-b py-1"
            >
              <span>{sr.product.name}</span>
              <span className="text-gray-500">{sr.status}</span>
              {sr.grams && <span>{sr.grams}g</span>}
            </div>
          ))}
        </Card>
      )}

      {/* Notes */}
      <Card>
        <h3 className="font-medium text-sm mb-2">{t("notes")}</h3>
        <textarea
          className="w-full border border-gray-300 rounded-lg p-2 text-sm min-h-[100px]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <Button
          size="sm"
          onClick={handleSaveNotes}
          disabled={notesSaving}
          className="mt-2"
        >
          {tCommon("save")}
        </Button>
      </Card>
    </div>
  );
}
