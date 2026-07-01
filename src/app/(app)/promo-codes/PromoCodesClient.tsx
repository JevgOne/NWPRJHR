"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  minOrderValue: number | null;
  maxUses: number | null;
  usedCount: number;
  validFrom: string | null;
  validTo: string | null;
  active: boolean;
  createdAt: string;
}

export function PromoCodesClient() {
  const t = useTranslations("promoCodes");
  const tc = useTranslations("common");
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create form
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [error, setError] = useState("");

  const fetchCodes = () => {
    setLoading(true);
    fetch("/api/promo-codes")
      .then((r) => r.json())
      .then(setCodes)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(fetchCodes, []);

  const resetForm = () => {
    setCode("");
    setDescription("");
    setDiscountType("PERCENT");
    setDiscountValue("");
    setMinOrderValue("");
    setMaxUses("");
    setValidFrom("");
    setValidTo("");
    setError("");
  };

  const handleCreate = async () => {
    if (!code.trim() || !discountValue) {
      setError(t("fillRequired"));
      return;
    }

    setSaving(true);
    setError("");

    const body: Record<string, unknown> = {
      code: code.trim(),
      description: description.trim() || null,
      discountType,
      discountValue:
        discountType === "PERCENT"
          ? Math.round(parseFloat(discountValue) * 100) // e.g. 10% → 1000 basis points
          : Math.round(parseFloat(discountValue) * 100), // e.g. 100 CZK → 10000 halere
      minOrderValue: minOrderValue
        ? Math.round(parseFloat(minOrderValue) * 100)
        : null,
      maxUses: maxUses ? parseInt(maxUses) : null,
      validFrom: validFrom || null,
      validTo: validTo || null,
    };

    const res = await fetch("/api/promo-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setShowCreate(false);
      resetForm();
      fetchCodes();
    } else {
      const data = await res.json();
      setError(data.error === "Code already exists" ? t("codeExists") : data.error);
    }
    setSaving(false);
  };

  const toggleActive = async (promo: PromoCode) => {
    await fetch(`/api/promo-codes/${promo.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !promo.active }),
    });
    fetchCodes();
  };

  const deleteCode = async (promo: PromoCode) => {
    if (promo.usedCount > 0) return;
    await fetch(`/api/promo-codes/${promo.id}`, { method: "DELETE" });
    fetchCodes();
  };

  const formatDiscount = (promo: PromoCode) => {
    if (promo.discountType === "PERCENT") {
      return `${(promo.discountValue / 100).toFixed(0)}%`;
    }
    return `${(promo.discountValue / 100).toFixed(0)} CZK`;
  };

  const isExpired = (promo: PromoCode) => {
    if (!promo.validTo) return false;
    return new Date(promo.validTo) < new Date();
  };

  const isUsedUp = (promo: PromoCode) => {
    if (!promo.maxUses) return false;
    return promo.usedCount >= promo.maxUses;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <button
          onClick={() => {
            resetForm();
            setShowCreate(!showCreate);
          }}
          className="px-4 py-2 bg-rose text-white text-sm font-medium rounded-lg hover:bg-rose-deep transition-colors"
        >
          {showCreate ? tc("cancel") : t("createCode")}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white border border-line rounded-xl p-5 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-espresso uppercase mb-1">
                {t("code")} *
              </label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="LETO2026"
                className="w-full border border-line rounded-lg px-3 py-2 text-sm font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-espresso uppercase mb-1">
                {t("description")}
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("descriptionPlaceholder")}
                className="w-full border border-line rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-espresso uppercase mb-1">
                {t("discountType")}
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as "PERCENT" | "FIXED")}
                className="w-full border border-line rounded-lg px-3 py-2 text-sm"
              >
                <option value="PERCENT">{t("percent")}</option>
                <option value="FIXED">{t("fixedAmount")}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-espresso uppercase mb-1">
                {discountType === "PERCENT" ? t("discountPercent") : t("discountCZK")} *
              </label>
              <input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === "PERCENT" ? "10" : "500"}
                className="w-full border border-line rounded-lg px-3 py-2 text-sm"
                min="1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-espresso uppercase mb-1">
                {t("minOrder")} (CZK)
              </label>
              <input
                type="number"
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(e.target.value)}
                placeholder={t("noMinimum")}
                className="w-full border border-line rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-espresso uppercase mb-1">
                {t("maxUses")}
              </label>
              <input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder={t("unlimited")}
                className="w-full border border-line rounded-lg px-3 py-2 text-sm"
                min="1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-espresso uppercase mb-1">
                {t("validFrom")}
              </label>
              <input
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className="w-full border border-line rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-espresso uppercase mb-1">
                {t("validTo")}
              </label>
              <input
                type="date"
                value={validTo}
                onChange={(e) => setValidTo(e.target.value)}
                className="w-full border border-line rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={handleCreate}
            disabled={saving}
            className="px-5 py-2 bg-rose text-white text-sm font-medium rounded-lg hover:bg-rose-deep disabled:opacity-50 transition-colors"
          >
            {saving ? tc("loading") : t("createCode")}
          </button>
        </div>
      )}

      {/* Codes list */}
      {loading ? (
        <p className="text-muted">{tc("loading")}</p>
      ) : codes.length === 0 ? (
        <div className="bg-white border border-line rounded-xl p-8 text-center text-muted">
          {t("noCodes")}
        </div>
      ) : (
        <div className="space-y-2">
          {codes.map((promo) => {
            const expired = isExpired(promo);
            const usedUp = isUsedUp(promo);
            const inactive = !promo.active || expired || usedUp;

            return (
              <div
                key={promo.id}
                className={`bg-white border rounded-xl px-4 py-3 flex items-center gap-4 ${
                  inactive ? "border-line/50 opacity-60" : "border-line"
                }`}
              >
                {/* Code */}
                <span className="text-sm font-mono font-bold text-ink min-w-[100px]">
                  {promo.code}
                </span>

                {/* Discount */}
                <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                  -{formatDiscount(promo)}
                </span>

                {/* Description */}
                <span className="text-sm text-muted flex-1 truncate hidden sm:block">
                  {promo.description || "—"}
                </span>

                {/* Usage */}
                <span className="text-xs text-muted whitespace-nowrap">
                  {promo.usedCount}{promo.maxUses ? `/${promo.maxUses}` : ""} {t("used")}
                </span>

                {/* Validity */}
                {promo.validTo && (
                  <span className={`text-xs whitespace-nowrap ${expired ? "text-red-500" : "text-muted"}`}>
                    {expired ? t("expired") : `→ ${new Date(promo.validTo).toLocaleDateString("cs-CZ")}`}
                  </span>
                )}

                {/* Status badge */}
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    !promo.active
                      ? "bg-gray-100 text-gray-500"
                      : expired
                      ? "bg-red-50 text-red-600"
                      : usedUp
                      ? "bg-orange-50 text-orange-600"
                      : "bg-green-50 text-green-700"
                  }`}
                >
                  {!promo.active
                    ? t("inactive")
                    : expired
                    ? t("expired")
                    : usedUp
                    ? t("usedUp")
                    : t("active")}
                </span>

                {/* Actions */}
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleActive(promo)}
                    className="px-2 py-1 text-xs rounded-lg border border-line hover:bg-nude-50 transition-colors"
                    title={promo.active ? t("deactivate") : t("activate")}
                  >
                    {promo.active ? "⏸" : "▶"}
                  </button>
                  {promo.usedCount === 0 && (
                    <button
                      onClick={() => deleteCode(promo)}
                      className="px-2 py-1 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                      title={tc("delete")}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
