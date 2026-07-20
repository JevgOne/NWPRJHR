"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";

interface OrderRow {
  id: string;
  status: string;
  estimatedTotal: number;
  createdAt: string;
}

interface Profile {
  tier: string;
  discountPercent: number;
  points: number;
}

const statusColors: Record<string, string> = {
  NEW: "bg-rose/15 text-espresso",
  CONFIRMED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  READY: "bg-green-100 text-green-700",
  SHIPPED: "bg-nude-200 text-espresso",
  COMPLETED: "bg-nude-100 text-muted",
  CANCELLED: "bg-nude-100 text-muted",
};

const statusKey: Record<string, string> = {
  NEW: "new",
  CONFIRMED: "confirmed",
  REJECTED: "rejected",
  READY: "ready",
  SHIPPED: "shipped",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

function formatCZK(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function DashboardClient({
  salonName,
}: {
  salonName: string;
  salonId: string;
}) {
  const t = useTranslations("salonPortal");
  const tOrder = useTranslations("orderManagement");
  const tLoyalty = useTranslations("loyalty");
  const tCommon = useTranslations("common");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/orders?limit=5").then((r) => r.json()),
      fetch("/api/salon-portal/profile").then((r) => r.json()),
    ])
      .then(([ordersData, profileData]) => {
        setOrders(ordersData.data ?? []);
        setProfile(profileData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted">{tCommon("loading")}</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">
        {t("welcomeBack")}, {salonName}
      </h1>

      {/* Loyalty & discount */}
      {profile && (
        <div className="grid grid-cols-3 gap-3">
          <Card padding="sm">
            <div className="text-xs text-muted">{t("yourTier")}</div>
            <div className="text-lg font-bold">
              {tLoyalty(profile.tier.toLowerCase() as "bronze" | "silver" | "gold" | "platinum")}
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-xs text-muted">{t("yourDiscount")}</div>
            <div className="text-lg font-bold">
              {(profile.discountPercent / 100).toFixed(1)}%
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-xs text-muted">{t("loyaltyPoints")}</div>
            <div className="text-lg font-bold">{profile.points}</div>
          </Card>
        </div>
      )}

      {/* Recent orders */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">{t("recentOrders")}</h2>
          <Link
            href="/salon/orders"
            className="text-xs text-espresso hover:underline"
          >
            {t("myOrders")} &rarr;
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="text-muted text-sm">{tOrder("noOrders")}</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b last:border-0">
                  <td className="py-2 pr-3 text-muted">
                    {new Date(order.createdAt).toLocaleDateString("cs-CZ")}
                  </td>
                  <td className="py-2 pr-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        statusColors[order.status] ?? "bg-nude-100"
                      }`}
                    >
                      {tOrder(statusKey[order.status] ?? order.status)}
                    </span>
                  </td>
                  <td className="py-2 text-right font-medium">
                    {formatCZK(order.estimatedTotal)} {t("currencyShort")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Quick links */}
      <Card>
        <h2 className="font-medium mb-3">{t("quickLinks")}</h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { href: "/salon/catalog", label: t("catalog") },
            { href: "/salon/orders", label: t("myOrders") },
            { href: "/salon/invoices", label: t("myInvoices") },
            { href: "/salon/samples", label: t("mySamples") },
            { href: "/salon/profile", label: t("profile") },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 rounded-lg bg-nude-50 text-sm text-espresso hover:bg-nude-100 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
