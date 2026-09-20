"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type FormData = {
  product: string;
  orderNumber: string;
  orderDate: string;
  receiveDate: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  bankAccount: string;
  note: string;
};

const inputClass =
  "w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose";
const labelClass = "block text-xs font-medium text-muted mb-1";

export function WithdrawalForm() {
  const t = useTranslations("public.withdrawal");
  const [form, setForm] = useState<FormData>({
    product: "",
    orderNumber: "",
    orderDate: "",
    receiveDate: "",
    name: "",
    address: "",
    email: "",
    phone: "",
    bankAccount: "",
    note: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean } | null>(null);

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/public/withdrawal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setResult({ success: true });
    } catch {
      setResult({ success: false });
    } finally {
      setSubmitting(false);
    }
  }

  if (result?.success) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-ink mb-2">{t("successTitle")}</h3>
        <p className="text-sm text-muted">{t("successMessage")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass}>{t("productLabel")} *</label>
        <input
          type="text"
          required
          value={form.product}
          onChange={(e) => setField("product", e.target.value)}
          placeholder={t("productPlaceholder")}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>{t("orderNumberLabel")} *</label>
        <input
          type="text"
          required
          value={form.orderNumber}
          onChange={(e) => setField("orderNumber", e.target.value)}
          placeholder={t("orderNumberPlaceholder")}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>{t("orderDateLabel")} *</label>
          <input
            type="date"
            required
            value={form.orderDate}
            onChange={(e) => setField("orderDate", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>{t("receiveDateLabel")} *</label>
          <input
            type="date"
            required
            value={form.receiveDate}
            onChange={(e) => setField("receiveDate", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>{t("nameLabel")} *</label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>{t("addressLabel")} *</label>
        <input
          type="text"
          required
          value={form.address}
          onChange={(e) => setField("address", e.target.value)}
          placeholder={t("addressPlaceholder")}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>{t("emailLabel")} *</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>{t("phoneLabel")}</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setField("phone", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>{t("bankAccountLabel")} *</label>
        <input
          type="text"
          required
          value={form.bankAccount}
          onChange={(e) => setField("bankAccount", e.target.value)}
          placeholder={t("bankAccountPlaceholder")}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>{t("noteLabel")}</label>
        <textarea
          value={form.note}
          onChange={(e) => setField("note", e.target.value)}
          rows={3}
          className={inputClass}
        />
      </div>

      {result && !result.success && (
        <p className="text-sm text-red-600">{t("errorMessage")}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 bg-rose text-white text-sm font-medium rounded-xl hover:bg-rose-deep transition-colors disabled:opacity-50"
      >
        {submitting ? t("submitting") : t("submitButton")}
      </button>
    </form>
  );
}
