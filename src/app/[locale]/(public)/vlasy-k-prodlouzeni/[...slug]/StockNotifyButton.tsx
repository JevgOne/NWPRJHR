"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";

const STORAGE_KEY = "hairland_stock_subs";

function getSubscribedIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function addSubscribedId(variantId: string) {
  const ids = getSubscribedIds();
  if (!ids.includes(variantId)) {
    ids.push(variantId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }
}

export function StockNotifyButton({ variantId }: { variantId: string }) {
  const t = useTranslations("public.productDetail");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "subscribed">("idle");

  useEffect(() => {
    if (getSubscribedIds().includes(variantId)) {
      setStatus("subscribed");
    }
  }, [variantId]);

  if (status === "success" || status === "subscribed") {
    return (
      <div className="flex items-center gap-1.5 mt-1.5">
        <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-xs text-emerald-700">
          {status === "subscribed" ? t("notifyAlreadySubscribed") : t("notifySuccess")}
        </span>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/stock-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, variantId, locale }),
      });
      if (res.ok) {
        addSubscribedId(variantId);
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
        placeholder={t("notifyEmailPlaceholder")}
        className="h-8 px-2.5 text-xs rounded-lg border border-line bg-white focus:outline-none focus:ring-1 focus:ring-brand w-44"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="h-8 px-3 text-xs font-medium rounded-lg bg-brand text-white hover:bg-brand/90 disabled:opacity-50 whitespace-nowrap"
      >
        {status === "loading" ? "..." : t("notifyWhenAvailable")}
      </button>
    </form>
  );
}
