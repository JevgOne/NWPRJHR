"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const REFERRAL_KEY = "hairland-referral";
const REFERRAL_EXPIRY_DAYS = 30;

export interface ReferralData {
  code: string;
  referrerName: string;
  discountType: string;
  discountValue: number;
  savedAt: number;
}

export function getReferralFromStorage(): ReferralData | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(REFERRAL_KEY);
    if (!stored) return null;
    const data: ReferralData = JSON.parse(stored);
    // Check expiry
    const expiryMs = REFERRAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    if (Date.now() - data.savedAt > expiryMs) {
      localStorage.removeItem(REFERRAL_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearReferralFromStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(REFERRAL_KEY);
}

export function ReferralTracker() {
  const searchParams = useSearchParams();
  const [banner, setBanner] = useState<ReferralData | null>(null);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      // Validate and store referral code
      fetch(`/api/public/referral/validate?code=${encodeURIComponent(ref)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.valid) {
            const referralData: ReferralData = {
              code: ref.toUpperCase(),
              referrerName: data.referrerName,
              discountType: data.discountType,
              discountValue: data.discountValue,
              savedAt: Date.now(),
            };
            localStorage.setItem(REFERRAL_KEY, JSON.stringify(referralData));
            setBanner(referralData);
          }
        })
        .catch(() => {});
    } else {
      // Show existing referral banner if stored
      const existing = getReferralFromStorage();
      if (existing) setBanner(existing);
    }
  }, [searchParams]);

  if (!banner) return null;

  const discountText =
    banner.discountType === "PERCENT"
      ? `${banner.discountValue / 100}%`
      : `${(banner.discountValue / 100).toLocaleString("cs-CZ")} Kč`;

  return (
    <div className="bg-gradient-to-r from-blush-100 to-nude-100 border-b border-blush-200 px-4 py-2.5 text-center">
      <p className="text-sm text-espresso">
        <span className="font-semibold text-rose-deep">{discountText} sleva</span>
        {" "}na první nákup díky doporučení od{" "}
        <span className="font-medium">{banner.referrerName}</span>
      </p>
    </div>
  );
}
