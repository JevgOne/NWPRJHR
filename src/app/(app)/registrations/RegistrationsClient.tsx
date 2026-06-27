"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Role } from "@prisma/client";

interface RegistrationRow {
  id: string;
  name: string;
  type?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  city?: string;
  ico?: string;
  language?: string;
  createdAt: string;
}

export function RegistrationsClient({ role }: { role: Role }) {
  const t = useTranslations("registrations");
  const tSalon = useTranslations("salon");
  const tCommon = useTranslations("common");
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"ALL" | "SALON" | "HAIRDRESSER">("ALL");
  const [approving, setApproving] = useState<string | null>(null);

  const isOwner = role === "OWNER";

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ archived: "false", approved: "false" });
    if (tab !== "ALL") params.set("type", tab);

    fetch(`/api/salons?${params}`)
      .then((r) => r.json())
      .then((data) => setRegistrations(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleApprove(id: string) {
    setApproving(id);
    try {
      const res = await fetch(`/api/salons/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true }),
      });
      if (res.ok) {
        setRegistrations((prev) => prev.filter((r) => r.id !== id));
      }
    } catch {
      // silently fail
    } finally {
      setApproving(null);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("cs-CZ");
  }

  const salons = registrations.filter((r) => r.type === "SALON" || !r.type);
  const hairdressers = registrations.filter((r) => r.type === "HAIRDRESSER");

  const displayed = tab === "ALL" ? registrations : tab === "SALON" ? salons : hairdressers;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t("title")}</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["ALL", "SALON", "HAIRDRESSER"] as const).map((key) => {
          const count = key === "ALL" ? registrations.length : key === "SALON" ? salons.length : hairdressers.length;
          const label = key === "ALL" ? t("all") : key === "SALON" ? t("pendingSalons") : t("pendingHairdressers");
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                tab === key
                  ? "border-amber-600 bg-amber-50 text-amber-700"
                  : "border-line hover:bg-nude-50"
              }`}
            >
              {label}
              {count > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-muted">{tCommon("loading")}</p>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-xl border border-line p-8 text-center text-muted">
          {t("noRegistrations")}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted text-xs uppercase tracking-wider">
                <th className="py-2 pr-3">{tSalon("salon")}</th>
                <th className="py-2 pr-3">Typ</th>
                <th className="py-2 pr-3">Kontakt</th>
                <th className="py-2 pr-3">{t("registeredAt")}</th>
                {isOwner && <th className="py-2 pr-3"></th>}
              </tr>
            </thead>
            <tbody>
              {displayed.map((r) => (
                <tr key={r.id} className="border-b hover:bg-nude-50">
                  <td className="py-3 pr-3">
                    <Link
                      href={`/salons/${r.id}`}
                      className="text-espresso hover:underline font-medium"
                    >
                      {r.name}
                    </Link>
                    {r.contactPerson && (
                      <span className="text-muted ml-1 text-xs">
                        ({r.contactPerson})
                      </span>
                    )}
                    {r.city && (
                      <span className="text-muted ml-1 text-xs">
                        — {r.city}
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      r.type === "HAIRDRESSER"
                        ? "bg-nude-100 text-espresso"
                        : "bg-rose/15 text-espresso"
                    }`}>
                      {r.type === "HAIRDRESSER" ? tSalon("typeHairdresser") : tSalon("typeSalon")}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-xs text-gray-600">
                    {r.email && <div>{r.email}</div>}
                    {r.phone && <div>{r.phone}</div>}
                  </td>
                  <td className="py-3 pr-3 text-muted text-xs whitespace-nowrap">
                    {formatDate(r.createdAt)}
                  </td>
                  {isOwner && (
                    <td className="py-3 pr-3">
                      <button
                        onClick={() => handleApprove(r.id)}
                        disabled={approving === r.id}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        {approving === r.id ? "..." : t("approve")}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
