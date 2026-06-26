"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import confetti from "canvas-confetti";

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

  useEffect(() => {
    if (result === "success") {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { x: 0.3, y: 0.5 } }), 300);
      setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { x: 0.7, y: 0.5 } }), 600);
    }
  }, [result]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-espresso mb-1">
          {t("form.name")} *
        </label>
        <input
          type="text"
          required
          maxLength={200}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="block w-full rounded-lg border border-line px-3 py-2 text-ink placeholder-muted focus:border-rose focus:outline-none focus:ring-1 focus:ring-rose sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-espresso mb-1">
          {t("form.email")} *
        </label>
        <input
          type="email"
          required
          maxLength={200}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="block w-full rounded-lg border border-line px-3 py-2 text-ink placeholder-muted focus:border-rose focus:outline-none focus:ring-1 focus:ring-rose sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-espresso mb-1">
          {t("form.phone")}
        </label>
        <input
          type="tel"
          maxLength={30}
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="block w-full rounded-lg border border-line px-3 py-2 text-ink placeholder-muted focus:border-rose focus:outline-none focus:ring-1 focus:ring-rose sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-espresso mb-1">
          {t("form.salon")}
        </label>
        <input
          type="text"
          maxLength={200}
          value={form.salonName}
          onChange={(e) => setForm({ ...form, salonName: e.target.value })}
          className="block w-full rounded-lg border border-line px-3 py-2 text-ink placeholder-muted focus:border-rose focus:outline-none focus:ring-1 focus:ring-rose sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-espresso mb-1">
          {t("form.message")} *
        </label>
        <textarea
          required
          maxLength={5000}
          rows={5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="block w-full rounded-lg border border-line px-3 py-2 text-ink placeholder-muted focus:border-rose focus:outline-none focus:ring-1 focus:ring-rose sm:text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full px-4 py-2 bg-rose text-white font-medium rounded-lg hover:bg-rose-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
