"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Role } from "@prisma/client";

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

interface StylistProfile {
  id: string;
  name: string;
  slug: string;
  photo: string | null;
  bio: string | null;
  specializations: string[];
  languages: string[];
  certifications: string[];
  phone: string | null;
  email: string | null;
  instagram: string | null;
  telegram: string | null;
  whatsapp: string | null;
  city: string | null;
  experience: number | null;
  active: boolean;
}

function formatCZK(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

const tierColors: Record<string, string> = {
  BRONZE: "bg-amber-100 text-amber-700",
  SILVER: "bg-nude-200 text-espresso",
  GOLD: "bg-yellow-100 text-yellow-700",
  PLATINUM: "bg-purple-100 text-purple-700",
};

const LANGUAGE_OPTIONS = [
  { code: "cs", label: "Čeština" },
  { code: "uk", label: "Українська" },
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
];

function TagInput({
  tags,
  onChange,
  placeholder,
  addLabel,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  addLabel: string;
}) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) {
      onChange([...tags, val]);
    }
    setInput("");
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-nude-100 text-espresso rounded text-xs"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="text-muted hover:text-red-500"
            >
              &times;
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder}
          className="flex-1 px-2 py-1 text-sm border border-line rounded-lg focus:outline-none focus:ring-1 focus:ring-rose"
        />
        <button
          type="button"
          onClick={addTag}
          className="px-2 py-1 text-xs text-espresso bg-nude-100 rounded-lg hover:bg-nude-200"
        >
          {addLabel}
        </button>
      </div>
    </div>
  );
}

function StylistForm({ salonName }: { salonName: string }) {
  const t = useTranslations("salonPortal");
  const tSalon = useTranslations("salon");
  const tCommon = useTranslations("common");

  const [form, setForm] = useState({
    name: "",
    bio: "",
    photo: "",
    phone: "",
    email: "",
    instagram: "",
    telegram: "",
    whatsapp: "",
    city: "",
    experience: "",
    languages: [] as string[],
    specializations: [] as string[],
    certifications: [] as string[],
    active: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/salon-portal/stylist-profile")
      .then((r) => r.json())
      .then((data: StylistProfile | null) => {
        if (data) {
          setForm({
            name: data.name,
            bio: data.bio ?? "",
            photo: data.photo ?? "",
            phone: data.phone ?? "",
            email: data.email ?? "",
            instagram: data.instagram ?? "",
            telegram: data.telegram ?? "",
            whatsapp: data.whatsapp ?? "",
            city: data.city ?? "",
            experience: data.experience != null ? String(data.experience) : "",
            languages: data.languages,
            specializations: data.specializations,
            certifications: data.certifications,
            active: data.active,
          });
        } else {
          setForm((f) => ({ ...f, name: salonName }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [salonName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/salon-portal/stylist-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          experience: form.experience ? Number(form.experience) : null,
        }),
      });
      if (res.ok) setSaved(true);
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/stylist-photo", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setForm((f) => ({ ...f, photo: data.url }));
      }
    } catch {
      /* ignore */
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <p className="text-muted">{tCommon("loading")}</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium">{t("stylistProfile")}</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-muted">{t("activeProfile")}</span>
            <button
              type="button"
              role="switch"
              aria-checked={form.active}
              onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                form.active ? "bg-emerald-500" : "bg-nude-200"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                  form.active ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
          </label>
        </div>
        {!form.active && (
          <p className="text-xs text-muted mb-3">{t("activeProfileHint")}</p>
        )}

        <div className="space-y-3">
          <Input
            label={tSalon("name")}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />

          <div>
            <label className="block text-sm font-medium text-espresso mb-1">
              {t("bio")}
            </label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-line rounded-lg focus:outline-none focus:ring-1 focus:ring-rose text-ink"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-espresso mb-1">
              {t("uploadPhoto")}
            </label>
            <div className="flex items-center gap-3">
              {form.photo ? (
                <div className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.photo}
                    alt=""
                    className="w-16 h-16 rounded-full object-cover border border-line"
                  />
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, photo: "" }))}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    &times;
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-nude-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              <div>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-sm font-medium text-espresso bg-nude-100 rounded-lg hover:bg-nude-200 transition-colors disabled:opacity-50"
                >
                  {uploading ? t("uploading") : form.photo ? t("changePhoto") : t("uploadPhoto")}
                </button>
                {form.photo && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, photo: "" }))}
                    className="ml-2 text-xs text-muted hover:text-red-500"
                  >
                    {t("removePhoto")}
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoUpload(file);
                  e.target.value = "";
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-medium mb-3">{tSalon("contactPerson")}</h3>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={tSalon("phone")}
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <Input
            label={tSalon("email")}
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <Input
            label={t("instagram")}
            value={form.instagram}
            onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
            placeholder="@username"
          />
          <Input
            label={t("telegram")}
            value={form.telegram}
            onChange={(e) => setForm((f) => ({ ...f, telegram: e.target.value }))}
            placeholder="@username"
          />
          <Input
            label={t("whatsapp")}
            value={form.whatsapp}
            onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
          />
          <Input
            label={tSalon("city")}
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          />
          <Input
            label={t("experience")}
            type="number"
            min={0}
            value={form.experience}
            onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}
          />
        </div>
      </Card>

      <Card>
        <h3 className="font-medium mb-3">{t("languages")}</h3>
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.map(({ code, label }) => (
            <button
              key={code}
              type="button"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  languages: f.languages.includes(code)
                    ? f.languages.filter((l) => l !== code)
                    : [...f.languages, code],
                }))
              }
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                form.languages.includes(code)
                  ? "bg-rose/10 text-espresso border border-rose"
                  : "bg-nude-50 text-muted border border-line"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-medium mb-3">{t("specializations")}</h3>
        <TagInput
          tags={form.specializations}
          onChange={(tags) => setForm((f) => ({ ...f, specializations: tags }))}
          placeholder={t("newSpecialization")}
          addLabel={t("addTag")}
        />
      </Card>

      <Card>
        <h3 className="font-medium mb-3">{t("certifications")}</h3>
        <TagInput
          tags={form.certifications}
          onChange={(tags) => setForm((f) => ({ ...f, certifications: tags }))}
          placeholder={t("newCertification")}
          addLabel={t("addTag")}
        />
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? t("saving") : t("saveProfile")}
        </Button>
        {saved && <span className="text-sm text-emerald-600">{t("saved")}</span>}
      </div>
    </form>
  );
}

export function ProfileClient({ role }: { role: Role }) {
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

  if (loading) return <p className="text-muted">{tCommon("loading")}</p>;
  if (!profile) return <p className="text-red-500">{tCommon("error")}</p>;

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold">{t("profile")}</h1>

      <Card>
        <h2 className="text-lg font-medium mb-3">{profile.name}</h2>
        <div className="space-y-2 text-sm">
          {profile.contactPerson && (
            <div className="flex justify-between">
              <span className="text-muted">{tSalon("contactPerson")}</span>
              <span>{profile.contactPerson}</span>
            </div>
          )}
          {profile.email && (
            <div className="flex justify-between">
              <span className="text-muted">{tSalon("email")}</span>
              <span>{profile.email}</span>
            </div>
          )}
          {profile.phone && (
            <div className="flex justify-between">
              <span className="text-muted">{tSalon("phone")}</span>
              <span>{profile.phone}</span>
            </div>
          )}
          {profile.city && (
            <div className="flex justify-between">
              <span className="text-muted">{tSalon("city")}</span>
              <span>{profile.city}</span>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <h3 className="font-medium mb-3">{tLoyalty("program")}</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">{t("yourTier")}</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                tierColors[profile.tier] ?? "bg-nude-100"
              }`}
            >
              {tLoyalty(profile.tier.toLowerCase() as "bronze" | "silver" | "gold" | "platinum")}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">{t("yourDiscount")}</span>
            <span className="font-medium">
              {(profile.discountPercent / 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">{t("totalRevenue")}</span>
            <span>{formatCZK(profile.totalRevenue)} CZK</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">{t("loyaltyPoints")}</span>
            <span>{profile.points}</span>
          </div>
          {profile.nextTier && (
            <div className="pt-2 border-t text-sm">
              <span className="text-muted">{t("toNextTier")} </span>
              <span className="font-medium">
                {formatCZK(profile.nextTier.remaining)} CZK
              </span>
              <span className="text-muted">
                {" "}
                ({tLoyalty(profile.nextTier.tier.toLowerCase() as "bronze" | "silver" | "gold" | "platinum")}{" "}
                — {(profile.nextTier.discountPercent / 100).toFixed(1)}%)
              </span>
            </div>
          )}
        </div>
      </Card>

      {role === "HAIRDRESSER" && (
        <StylistForm salonName={profile.name} />
      )}
    </div>
  );
}
