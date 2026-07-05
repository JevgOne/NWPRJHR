"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";

interface ReferralData {
  hasReferral: boolean;
  code?: string;
  shareUrl?: string;
  active?: boolean;
  totalConversions?: number;
  completedConversions?: number;
  pendingConversions?: number;
  referrerRewardType?: string;
  referrerRewardValue?: number;
  refereeDiscountType?: string;
  refereeDiscountValue?: number;
  conversions?: Array<{
    id: string;
    refereeType: string;
    status: string;
    createdAt: string;
  }>;
}

export function ReferralClient() {
  const t = useTranslations("salonPortal");
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/referrals/my");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const createReferral = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        await fetchData();
      }
    } finally {
      setCreating(false);
    }
  };

  const copyLink = async () => {
    if (!data?.shareUrl) return;
    await navigator.clipboard.writeText(data.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    if (!data?.shareUrl) return;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`Objednejte si prémiové vlasy na Hairland se slevou: ${data.shareUrl}`)}`,
      "_blank"
    );
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-muted">
        <div className="animate-spin h-6 w-6 border-2 border-rose border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  const formatDiscount = (type?: string, value?: number) => {
    if (!type || !value) return "—";
    return type === "PERCENT" ? `${value / 100}%` : `${(value / 100).toLocaleString("cs-CZ")} Kč`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">{t("referralTitle")}</h1>
        <p className="text-muted mt-1">{t("referralDesc")}</p>
      </div>

      {!data?.hasReferral ? (
        <Card className="p-8 text-center">
          <p className="text-muted mb-4">{t("referralNoCode")}</p>
          <button
            onClick={createReferral}
            disabled={creating}
            className="px-6 py-2.5 rounded-lg bg-rose text-white hover:bg-rose-deep transition-colors disabled:opacity-50"
          >
            {creating ? "..." : t("referralCreate")}
          </button>
        </Card>
      ) : (
        <>
          {/* Referral code & share */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <p className="text-xs text-muted uppercase tracking-wider mb-1">{t("referralCode")}</p>
                <p className="text-2xl font-bold text-espresso tracking-widest">{data.code}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyLink}
                  className="px-4 py-2 rounded-lg bg-rose text-white hover:bg-rose-deep transition-colors text-sm"
                >
                  {copied ? t("referralCopied") : t("referralCopy")}
                </button>
                <button
                  onClick={shareWhatsApp}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors text-sm"
                >
                  {t("referralShareWhatsApp")}
                </button>
                <button
                  onClick={copyLink}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity text-sm"
                >
                  {t("referralShareInstagram")}
                </button>
              </div>
            </div>

            <div className="mt-4 p-3 bg-nude-50 rounded-lg">
              <p className="text-xs text-muted mb-1">{t("referralLink")}</p>
              <p className="text-sm text-espresso font-mono break-all">{data.shareUrl}</p>
            </div>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <p className="text-xs text-muted uppercase tracking-wider">{t("referralTotalConversions")}</p>
              <p className="text-3xl font-bold text-espresso mt-1">{data.totalConversions ?? 0}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-muted uppercase tracking-wider">{t("referralCompleted")}</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{data.completedConversions ?? 0}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-muted uppercase tracking-wider">{t("referralPending")}</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{data.pendingConversions ?? 0}</p>
            </Card>
          </div>

          {/* Reward info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-4">
              <p className="text-xs text-muted uppercase tracking-wider mb-1">{t("referralReward")}</p>
              <p className="text-lg font-semibold text-espresso">
                {formatDiscount(data.referrerRewardType, data.referrerRewardValue)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted uppercase tracking-wider mb-1">{t("referralRefereeDiscount")}</p>
              <p className="text-lg font-semibold text-espresso">
                {formatDiscount(data.refereeDiscountType, data.refereeDiscountValue)}
              </p>
            </Card>
          </div>

          {/* Conversions list */}
          {data.conversions && data.conversions.length > 0 && (
            <Card className="p-4">
              <h2 className="text-sm font-semibold text-ink mb-3">{t("referralStats")}</h2>
              <div className="divide-y divide-line">
                {data.conversions.map((c) => (
                  <div key={c.id} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="text-sm text-espresso">{c.refereeType}</span>
                      <span className="text-xs text-muted ml-2">
                        {new Date(c.createdAt).toLocaleDateString("cs-CZ")}
                      </span>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        c.status === "COMPLETED"
                          ? "bg-green-100 text-green-700"
                          : c.status === "PENDING"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
