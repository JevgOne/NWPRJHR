"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Role } from "@prisma/client";

interface SalonRow {
  id: string;
  name: string;
  type?: string;
  city?: string;
  tier: string;
  totalRevenue: number;
  archived: boolean;
  approved: boolean;
  _count: { orders: number; sales: number };
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

export function SalonsClient({ role }: { role: Role }) {
  const t = useTranslations("salon");
  const tLoyalty = useTranslations("loyalty");
  const tCommon = useTranslations("common");
  const [salons, setSalons] = useState<SalonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "archived">("active");
  const [typeFilter, setTypeFilter] = useState<"" | "SALON" | "HAIRDRESSER">("");
  const [search, setSearch] = useState("");

  const isOwner = role === "OWNER";

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("archived", tab === "archived" ? "true" : "false");
    if (search) params.set("search", search);
    if (typeFilter) params.set("type", typeFilter);

    fetch(`/api/salons?${params}`)
      .then((r) => r.json())
      .then((data) => setSalons(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab, search, typeFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("salon")}</h1>
        {isOwner && (
          <Link href="/salons/new">
            <Button size="sm">{t("newSalon")}</Button>
          </Link>
        )}
      </div>

      <div className="flex gap-2 items-center">
        <button
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            tab === "active"
              ? "border-indigo-600 bg-indigo-50 text-indigo-700"
              : "border-gray-200 hover:bg-gray-50"
          }`}
          onClick={() => setTab("active")}
        >
          {t("active")}
        </button>
        <button
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            tab === "archived"
              ? "border-indigo-600 bg-indigo-50 text-indigo-700"
              : "border-gray-200 hover:bg-gray-50"
          }`}
          onClick={() => setTab("archived")}
        >
          {t("archived")}
        </button>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as "" | "SALON" | "HAIRDRESSER")}
          className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 bg-white"
        >
          <option value="">{tCommon("all")}</option>
          <option value="SALON">{t("typeSalon")}</option>
          <option value="HAIRDRESSER">{t("typeHairdresser")}</option>
        </select>
        <Input
          placeholder={tCommon("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-auto max-w-xs"
        />
      </div>

      {loading ? (
        <p className="text-gray-500">{tCommon("loading")}</p>
      ) : salons.length === 0 ? (
        <Card>
          <p className="text-gray-500 text-center py-8">{t("noSalons")}</p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2 pr-3">{t("salon")}</th>
                <th className="py-2 pr-3">{tLoyalty("tier")}</th>
                <th className="py-2 pr-3 text-right">{t("revenueTotal")}</th>
                <th className="py-2 pr-3 text-right">{tLoyalty("points")}</th>
              </tr>
            </thead>
            <tbody>
              {salons.map((s) => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 pr-3">
                    <Link
                      href={`/salons/${s.id}`}
                      className="text-indigo-600 hover:underline font-medium"
                    >
                      {s.name}
                    </Link>
                    {s.city && (
                      <span className="text-gray-400 ml-1 text-xs">
                        {s.city}
                      </span>
                    )}
                    {s.type === "HAIRDRESSER" && (
                      <span className="ml-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                        {t("typeHairdresser")}
                      </span>
                    )}
                    {!s.approved && (
                      <span className="ml-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                        {t("pendingApproval")}
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        tierColors[s.tier] ?? "bg-gray-100"
                      }`}
                    >
                      {tLoyalty(s.tier.toLowerCase())}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-right font-medium">
                    {formatCZK(s.totalRevenue)} CZK
                  </td>
                  <td className="py-2 pr-3 text-right text-gray-500">
                    {s._count.orders}/{s._count.sales}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
