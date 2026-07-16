"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import confetti from "canvas-confetti";

interface ContactFormProps {
  reason?: string;
}

export function ContactForm({ reason }: ContactFormProps) {
  const t = useTranslations("public.contact");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const reasonPlaceholders: Record<string, string> = {
    "real-photo": t("form.reasonRealPhoto"),
    "photo-match": t("form.reasonPhotoMatch"),
    "show-in-person": t("form.reasonShowInPerson"),
  };

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    salonName: "",
    message: reason && reasonPlaceholders[reason] ? reasonPlaceholders[reason] : "",
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 3 - photos.length);
    const newPhotos = [...photos, ...files].slice(0, 3);
    setPhotos(newPhotos);
    const previews = newPhotos.map((f) => URL.createObjectURL(f));
    photoPreviews.forEach((p) => URL.revokeObjectURL(p));
    setPhotoPreviews(previews);
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotos(photos.filter((_, i) => i !== index));
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== index));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      // Upload photos first if any
      let customerPhotos: string[] = [];
      if (photos.length > 0) {
        const fd = new FormData();
        photos.forEach((f) => fd.append("files", f));
        const uploadRes = await fetch("/api/public/inquiry/upload", { method: "POST", body: fd });
        if (!uploadRes.ok) throw new Error("Photo upload failed");
        const uploadData = await uploadRes.json();
        customerPhotos = uploadData.urls;
      }

      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, customerPhotos, locale }),
      });

      if (res.ok) {
        setResult("success");
        setForm({ name: "", email: "", phone: "", salonName: "", message: "" });
        setPhotos([]);
        photoPreviews.forEach((p) => URL.revokeObjectURL(p));
        setPhotoPreviews([]);
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

      {/* Photo upload */}
      <div className="bg-rose/5 border border-rose/20 rounded-xl p-4">
        <p className="text-sm text-ink font-medium mb-1">{t("form.photoCtaTitle")}</p>
        <p className="text-xs text-muted mb-3">{t("form.photoCtaHint")}</p>
        {photoPreviews.length > 0 && (
          <div className="flex gap-2 mb-3">
            {photoPreviews.map((src, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-line">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center text-xs"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}
        {photos.length < 3 && (
          <label className="inline-flex items-center gap-2 px-3 py-2 border border-line rounded-lg text-sm text-muted hover:bg-white cursor-pointer transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>
            {t("form.photoButton")}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handlePhotoChange}
              className="hidden"
            />
          </label>
        )}
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
