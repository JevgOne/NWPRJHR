"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Stylist } from "@prisma/client";
import { slugify } from "@/lib/slugify";

interface Props {
  stylist?: Stylist;
  salons: Array<{ id: string; name: string }>;
}

export function StylistForm({ stylist, salons }: Props) {
  const router = useRouter();
  const t = useTranslations("stylist");
  const tc = useTranslations("common");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(stylist?.name ?? "");
  const [slug, setSlug] = useState(stylist?.slug ?? "");
  const [bio, setBio] = useState(stylist?.bio ?? "");
  const [bioUk, setBioUk] = useState(stylist?.bioUk ?? "");
  const [bioRu, setBioRu] = useState(stylist?.bioRu ?? "");
  const [phone, setPhone] = useState(stylist?.phone ?? "");
  const [email, setEmail] = useState(stylist?.email ?? "");
  const [instagram, setInstagram] = useState(stylist?.instagram ?? "");
  const [telegram, setTelegram] = useState(stylist?.telegram ?? "");
  const [whatsapp, setWhatsapp] = useState(stylist?.whatsapp ?? "");
  const [city, setCity] = useState(stylist?.city ?? "");
  const [experience, setExperience] = useState(stylist?.experience?.toString() ?? "");
  const [salonId, setSalonId] = useState(stylist?.salonId ?? "");
  const [featured, setFeatured] = useState(stylist?.featured ?? false);
  const [active, setActive] = useState(stylist?.active ?? true);

  const existingSpecs: string[] = JSON.parse(stylist?.specializations ?? "[]");
  const existingLangs: string[] = JSON.parse(stylist?.languages ?? "[]");
  const existingCerts: string[] = JSON.parse(stylist?.certifications ?? "[]");

  const [specializations, setSpecializations] = useState(existingSpecs.join(", "));
  const [languages, setLanguages] = useState(existingLangs);
  const [certifications, setCertifications] = useState(existingCerts.join(", "));

  const allLangs = [
    { code: "cs", flag: "🇨🇿", label: t("langCs") },
    { code: "uk", flag: "🇺🇦", label: t("langUk") },
    { code: "ru", flag: "🇷🇺", label: t("langRu") },
    { code: "en", flag: "🇬🇧", label: t("langEn") },
  ];

  function handleNameChange(val: string) {
    setName(val);
    if (!stylist) setSlug(slugify(val));
  }

  function toggleLang(code: string) {
    setLanguages((prev) =>
      prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const body = {
      name,
      slug,
      bio,
      bioUk: bioUk || null,
      bioRu: bioRu || null,
      phone: phone || null,
      email: email || null,
      instagram: instagram || null,
      telegram: telegram || null,
      whatsapp: whatsapp || null,
      city: city || null,
      experience: experience ? parseInt(experience) : null,
      salonId: salonId || null,
      featured,
      active,
      specializations: JSON.stringify(
        specializations.split(",").map((s) => s.trim()).filter(Boolean)
      ),
      languages: JSON.stringify(languages),
      certifications: JSON.stringify(
        certifications.split(",").map((s) => s.trim()).filter(Boolean)
      ),
    };

    try {
      const url = stylist ? `/api/stylists/${stylist.id}` : "/api/stylists";
      const method = stylist ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t("saveError"));
      }

      router.push("/stylists");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("unknownError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-line shadow-sm p-6 space-y-4">
        <h2 className="text-base font-semibold text-ink">{t("basicInfo")}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-espresso mb-1">{t("nameLabel")} *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:ring-2 focus:ring-rose focus:border-rose"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-espresso mb-1">{t("slugLabel")} *</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:ring-2 focus:ring-rose focus:border-rose"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-espresso mb-1">📍 {t("cityLabel")}</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:ring-2 focus:ring-rose focus:border-rose"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-espresso mb-1">🎓 {t("experienceLabel")}</label>
            <input
              type="number"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:ring-2 focus:ring-rose focus:border-rose"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-espresso mb-1">🏠 {t("salonLabel")}</label>
          <select
            value={salonId}
            onChange={(e) => setSalonId(e.target.value)}
            className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:ring-2 focus:ring-rose focus:border-rose"
          >
            <option value="">{t("noSalon")}</option>
            {salons.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="rounded border-line text-espresso" />
            ⭐ {t("featured")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="rounded border-line text-espresso" />
            ✅ {t("activeLabel")}
          </label>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-line shadow-sm p-6 space-y-4">
        <h2 className="text-base font-semibold text-ink">📝 {t("bioTitle")}</h2>

        <div>
          <label className="block text-sm font-medium text-espresso mb-1">🇨🇿 {t("bioCz")}</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:ring-2 focus:ring-rose focus:border-rose"
            placeholder={`${t("bioPlaceholder")} ✨💇‍♀️`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-espresso mb-1">🇺🇦 {t("bioUk")}</label>
          <textarea
            value={bioUk}
            onChange={(e) => setBioUk(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:ring-2 focus:ring-rose focus:border-rose"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-espresso mb-1">🇷🇺 {t("bioRu")}</label>
          <textarea
            value={bioRu}
            onChange={(e) => setBioRu(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:ring-2 focus:ring-rose focus:border-rose"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-line shadow-sm p-6 space-y-4">
        <h2 className="text-base font-semibold text-ink">💼 {t("specTitle")}</h2>

        <div>
          <label className="block text-sm font-medium text-espresso mb-1">{t("specLabel")}</label>
          <input
            type="text"
            value={specializations}
            onChange={(e) => setSpecializations(e.target.value)}
            className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:ring-2 focus:ring-rose focus:border-rose"
            placeholder={t("specPlaceholder")}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-espresso mb-2">{t("languagesLabel")}</label>
          <div className="flex gap-3">
            {allLangs.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => toggleLang(l.code)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  languages.includes(l.code)
                    ? "bg-rose/15 text-espresso ring-2 ring-rose"
                    : "bg-nude-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span className="text-lg">{l.flag}</span> {l.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-espresso mb-1">🏅 {t("certsLabel")}</label>
          <input
            type="text"
            value={certifications}
            onChange={(e) => setCertifications(e.target.value)}
            className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:ring-2 focus:ring-rose focus:border-rose"
            placeholder={t("certsPlaceholder")}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-line shadow-sm p-6 space-y-4">
        <h2 className="text-base font-semibold text-ink">📞 {t("contactsTitle")}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-espresso mb-1">📱 {t("phoneLabel")}</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:ring-2 focus:ring-rose focus:border-rose" />
          </div>
          <div>
            <label className="block text-sm font-medium text-espresso mb-1">✉️ {t("emailLabel")}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:ring-2 focus:ring-rose focus:border-rose" />
          </div>
          <div>
            <label className="block text-sm font-medium text-espresso mb-1">📸 {t("instagramLabel")}</label>
            <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:ring-2 focus:ring-rose focus:border-rose" placeholder="@username" />
          </div>
          <div>
            <label className="block text-sm font-medium text-espresso mb-1">✈️ {t("telegramLabel")}</label>
            <input type="text" value={telegram} onChange={(e) => setTelegram(e.target.value)} className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:ring-2 focus:ring-rose focus:border-rose" placeholder="@username" />
          </div>
          <div>
            <label className="block text-sm font-medium text-espresso mb-1">💬 {t("whatsappLabel")}</label>
            <input type="text" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:ring-2 focus:ring-rose focus:border-rose" placeholder="+420..." />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-rose text-white rounded-lg text-sm font-medium hover:bg-rose-deep disabled:opacity-50"
        >
          {saving ? tc("saving") : stylist ? t("saveChanges") : t("createStylist")}
        </button>
        <a
          href="/stylists"
          className="px-6 py-2.5 bg-white text-espresso border border-line rounded-lg text-sm font-medium hover:bg-nude-50"
        >
          {tc("back")}
        </a>
      </div>
    </form>
  );
}
