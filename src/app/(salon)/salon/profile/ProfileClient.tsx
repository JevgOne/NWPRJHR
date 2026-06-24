"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";

interface SalonProfile {
  id: string;
  name: string;
  tier: string;
  points: number;
  totalRevenue: number;
  language: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  city?: string;
  address?: string;
  discountPercent: number;
  nextTier: {
    tier: string;
    revenueThreshold: number;
    remaining: number;
    discountPercent: number;
  } | null;
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

export function ProfileClient() {
  const t = useTranslations("salonPortal");
  const tLoyalty = useTranslations("loyalty");
  const tSalon = useTranslations("salon");
  const tCommon = useTranslations("common");
  const [profile, setProfile] = useState<SalonProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/salon-portal/profile")
      .then((r) => r.json())
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">{tCommon("loading")}</p>;
  if (!profile) return <p className="text-red-500">{tCommon("error")}</p>;

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold">{t("profile")}</h1>

      <Card>
        <h2 className="text-lg font-medium mb-3">{profile.name}</h2>
        <div className="space-y-2 text-sm">
          {profile.contactPerson && (
            <div className="flex justify-between">
              <span className="text-gray-500">{tSalon("contactPerson")}</span>
              <span>{profile.contactPerson}</span>
            </div>
          )}
          {profile.email && (
            <div className="flex justify-between">
              <span className="text-gray-500">{tSalon("email")}</span>
              <span>{profile.email}</span>
            </div>
          )}
          {profile.phone && (
            <div className="flex justify-between">
              <span className="text-gray-500">{tSalon("phone")}</span>
              <span>{profile.phone}</span>
            </div>
          )}
          {profile.city && (
            <div className="flex justify-between">
              <span className="text-gray-500">{tSalon("city")}</span>
              <span>{profile.city}</span>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <h3 className="font-medium mb-3">{tLoyalty("program")}</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{t("yourTier")}</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                tierColors[profile.tier] ?? "bg-gray-100"
              }`}
            >
              {tLoyalty(profile.tier.toLowerCase() as "bronze" | "silver" | "gold" | "platinum")}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t("yourDiscount")}</span>
            <span className="font-medium">
              {(profile.discountPercent / 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t("totalRevenue")}</span>
            <span>{formatCZK(profile.totalRevenue)} CZK</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t("loyaltyPoints")}</span>
            <span>{profile.points}</span>
          </div>
          {profile.nextTier && (
            <div className="pt-2 border-t text-sm">
              <span className="text-gray-500">{t("toNextTier")} </span>
              <span className="font-medium">
                {formatCZK(profile.nextTier.remaining)} CZK
              </span>
              <span className="text-gray-400">
                {" "}
                ({tLoyalty(profile.nextTier.tier.toLowerCase() as "bronze" | "silver" | "gold" | "platinum")}{" "}
                — {(profile.nextTier.discountPercent / 100).toFixed(1)}%)
              </span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
