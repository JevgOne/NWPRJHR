"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function ContactForm() {
  const t = useTranslations("public.contact");
  const tCommon = useTranslations("common");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    salonName: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setResult("success");
        setForm({ name: "", email: "", phone: "", salonName: "", message: "" });
      } else {
        setResult("error");
      }
    } catch {
      setResult("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("form.name")} *
        </label>
        <input
          type="text"
          required
          maxLength={200}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("form.email")} *
        </label>
        <input
          type="email"
          required
          maxLength={200}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("form.phone")}
        </label>
        <input
          type="tel"
          maxLength={30}
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("form.salon")}
        </label>
        <input
          type="text"
          maxLength={200}
          value={form.salonName}
          onChange={(e) => setForm({ ...form, salonName: e.target.value })}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("form.message")} *
        </label>
        <textarea
          required
          maxLength={5000}
          rows={5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? tCommon("saving") : t("form.send")}
      </button>

      {result === "success" && (
        <p className="text-sm text-green-600 font-medium">{t("form.success")}</p>
      )}
      {result === "error" && (
        <p className="text-sm text-red-600 font-medium">{tCommon("error")}</p>
      )}
    </form>
  );
}
