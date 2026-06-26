"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";

export function RegisterForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    salonName: "",
    contactPerson: "",
    email: "",
    phone: "",
    ico: "",
    city: "",
    address: "",
    website: "",
    instagram: "",
    password: "",
    passwordConfirm: "",
    language: "cs",
    terms: false,
  });

  const setField = (key: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.terms) {
      setError("Musíte souhlasit s obchodními podmínkami");
      return;
    }
    if (form.password.length < 6) {
      setError("Heslo musí mít alespoň 6 znaků");
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setError("Hesla se neshodují");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/public/register-salon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        salonName: form.salonName,
        contactPerson: form.contactPerson,
        email: form.email,
        phone: form.phone,
        ico: form.ico,
        city: form.city,
        address: form.address,
        website: form.website,
        instagram: form.instagram,
        password: form.password,
        language: form.language,
      }),
    });

    setLoading(false);

    if (res.ok) {
      setSuccess(true);
    } else {
      const data = await res.json().catch(() => ({}));
      if (data.error === "EMAIL_EXISTS") {
        setError("Tento email je již registrován");
      } else if (res.status === 429) {
        setError("Příliš mnoho pokusů, zkuste to později");
      } else {
        setError("Registrace se nezdařila, zkuste to znovu");
      }
    }
  }

  useEffect(() => {
    if (success) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 100,
          origin: { x: 0.3, y: 0.5 },
        });
      }, 300);
      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 100,
          origin: { x: 0.7, y: 0.5 },
        });
      }, 600);
    }
  }, [success]);

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="bg-amber-50 rounded-2xl p-8 border border-amber-200">
          <div className="text-4xl mb-3">⏳</div>
          <h2 className="text-xl font-bold text-ink mb-2">Registrace odeslána!</h2>
          <p className="text-sm text-muted mb-2">
            Vaše žádost o B2B účet byla přijata. Ověříme údaje o vašem salonu a aktivujeme váš účet — obvykle do 24 hodin.
          </p>
          <p className="text-sm text-muted mb-4">
            O schválení vás budeme informovat emailem.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-2.5 bg-rose text-white font-medium rounded-lg hover:bg-rose-deep transition-colors"
          >
            Zpět na hlavní stránku
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">Registrace salonu</h1>
        <p className="text-sm text-muted mt-1">
          B2B účet pro velkoobchodní nákup vlasů. Po ověření vašeho salonu aktivujeme přístup — obvykle do 24 hodin.
        </p>
      </div>

      {/* Salon info */}
      <div className="bg-white rounded-2xl border border-line p-5 space-y-3">
        <div className="text-xs font-semibold text-muted uppercase tracking-wider">Údaje o salonu</div>
        <div>
          <label className="block text-sm font-medium text-espresso mb-1">Název salonu *</label>
          <input
            type="text"
            required
            value={form.salonName}
            onChange={(e) => setField("salonName", e.target.value)}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose focus:border-rose"
            placeholder="např. Beauty Studio Praha"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-espresso mb-1">IČO *</label>
            <input
              type="text"
              required
              value={form.ico}
              onChange={(e) => setField("ico", e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose focus:border-rose"
              placeholder="12345678"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-espresso mb-1">Město *</label>
            <input
              type="text"
              required
              value={form.city}
              onChange={(e) => setField("city", e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose focus:border-rose"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-espresso mb-1">Adresa salonu *</label>
          <input
            type="text"
            required
            value={form.address}
            onChange={(e) => setField("address", e.target.value)}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose focus:border-rose"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-espresso mb-1">Web salonu</label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => setField("website", e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose focus:border-rose"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-espresso mb-1">Instagram</label>
            <input
              type="text"
              value={form.instagram}
              onChange={(e) => setField("instagram", e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose focus:border-rose"
              placeholder="@vassalon"
            />
          </div>
        </div>
      </div>

      {/* Contact info */}
      <div className="bg-white rounded-2xl border border-line p-5 space-y-3">
        <div className="text-xs font-semibold text-muted uppercase tracking-wider">Kontaktní údaje</div>
        <div>
          <label className="block text-sm font-medium text-espresso mb-1">Kontaktní osoba *</label>
          <input
            type="text"
            required
            value={form.contactPerson}
            onChange={(e) => setField("contactPerson", e.target.value)}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose focus:border-rose"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-espresso mb-1">Email *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose focus:border-rose"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-espresso mb-1">Telefon *</label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose focus:border-rose"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-espresso mb-1">Preferovaný jazyk</label>
          <select
            value={form.language}
            onChange={(e) => setField("language", e.target.value)}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose focus:border-rose"
          >
            <option value="cs">Čeština</option>
            <option value="uk">Українська</option>
            <option value="ru">Русский</option>
          </select>
        </div>
      </div>

      {/* Password */}
      <div className="bg-white rounded-2xl border border-line p-5 space-y-3">
        <div className="text-xs font-semibold text-muted uppercase tracking-wider">Přístupové údaje</div>
        <div>
          <label className="block text-sm font-medium text-espresso mb-1">Heslo *</label>
          <input
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => setField("password", e.target.value)}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose focus:border-rose"
            placeholder="min. 6 znaků"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-espresso mb-1">Heslo znovu *</label>
          <input
            type="password"
            required
            value={form.passwordConfirm}
            onChange={(e) => setField("passwordConfirm", e.target.value)}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose focus:border-rose"
          />
        </div>
      </div>

      {/* Terms */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={form.terms}
          onChange={(e) => setField("terms", e.target.checked)}
          className="mt-0.5 rounded border-line text-rose focus:ring-rose"
        />
        <span className="text-sm text-muted">
          Souhlasím s{" "}
          <Link href="/obchodni-podminky" className="text-rose underline" target="_blank">
            obchodními podmínkami
          </Link>{" "}
          a{" "}
          <Link href="/privacy" className="text-rose underline" target="_blank">
            zásadami ochrany osobních údajů
          </Link>{" "}
          *
        </span>
      </label>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-rose text-white font-semibold rounded-xl hover:bg-rose-deep transition-colors disabled:opacity-50"
      >
        {loading ? "Odesílám..." : "Odeslat žádost o registraci"}
      </button>

      <p className="text-center text-sm text-muted">
        Již máte účet?{" "}
        <Link href="/login" className="text-rose font-medium hover:underline">
          Přihlaste se
        </Link>
      </p>
    </form>
  );
}
