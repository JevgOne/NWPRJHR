"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";

type FormData = {
  customerType: "RETAIL" | "SALON" | "HAIRDRESSER" | "";
  name: string;
  email: string;
  phone: string;
  salonName: string;
  complaintType: "DEFECT" | "RETURN" | "WITHDRAWAL" | "";
  orderNumber: string;
  description: string;
  photos: string[];
  desiredResolution: "REPAIR" | "REPLACEMENT" | "DISCOUNT" | "REFUND" | "";
  termsAccepted: boolean;
};

const STEPS = ["terms", "customerType", "contact", "details", "photos", "summary"] as const;

export function ComplaintForm() {
  const t = useTranslations("public.complaintForm");
  const tCommon = useTranslations("common");

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({
    customerType: "",
    name: "",
    email: "",
    phone: "",
    salonName: "",
    complaintType: "",
    orderNumber: "",
    description: "",
    photos: [],
    desiredResolution: "",
    termsAccepted: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; ticketNumber?: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const currentStep = STEPS[step];

  function canProceed(): boolean {
    switch (currentStep) {
      case "terms":
        return form.termsAccepted;
      case "customerType":
        return form.customerType !== "";
      case "contact":
        return form.name.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
      case "details":
        return form.complaintType !== "" && form.description.trim().length >= 10;
      case "photos":
        return true; // optional
      case "summary":
        return true;
      default:
        return false;
    }
  }

  async function uploadFile(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/public/complaint-tickets/upload", {
      method: "POST",
      body: fd,
    });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.url as string;
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        if (form.photos.length + urls.length >= 10) break;
        const url = await uploadFile(file);
        urls.push(url);
      }
      setForm((prev) => ({ ...prev, photos: [...prev.photos, ...urls] }));
    } catch {
      // silent — user can retry
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removePhoto(index: number) {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/public/complaint-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerType: form.customerType,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          salonName: form.salonName.trim() || undefined,
          complaintType: form.complaintType,
          orderNumber: form.orderNumber.trim() || undefined,
          description: form.description.trim(),
          photos: form.photos,
          desiredResolution: form.desiredResolution || undefined,
          termsAccepted: true,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({ success: true, ticketNumber: data.ticketNumber });
      } else {
        setResult({ success: false });
      }
    } catch {
      setResult({ success: false });
    } finally {
      setSubmitting(false);
    }
  }

  // Success screen
  if (result?.success) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-ink mb-2">{t("success.title")}</h3>
        <p className="text-sm text-muted mb-4">{t("success.message")}</p>
        <p className="text-lg font-mono font-bold text-ink mb-6">{result.ticketNumber}</p>
        <p className="text-sm text-muted">{t("success.emailSent")}</p>
      </div>
    );
  }

  const inputClass =
    "block w-full rounded-lg border border-line px-3 py-2 text-ink placeholder-muted focus:border-rose focus:outline-none focus:ring-1 focus:ring-rose sm:text-sm";
  const labelClass = "block text-sm font-medium text-espresso mb-1";

  return (
    <div>
      {/* Progress bar */}
      <div className="flex gap-1 mb-6">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= step ? "bg-rose" : "bg-line"
            }`}
          />
        ))}
      </div>

      {/* Step indicator */}
      <p className="text-xs text-muted mb-4">
        {t("stepOf", { current: step + 1, total: STEPS.length })}
      </p>

      {/* Step 1: Terms */}
      {currentStep === "terms" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-ink">{t("terms.title")}</h3>
          <p className="text-sm text-muted leading-relaxed">{t("terms.description")}</p>
          <div className="bg-nude-50 rounded-xl p-4 text-sm text-muted max-h-48 overflow-y-auto leading-relaxed">
            {t("terms.summary")}
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.termsAccepted}
              onChange={(e) => setForm({ ...form, termsAccepted: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-line text-rose focus:ring-rose"
            />
            <span className="text-sm text-ink">
              {t("terms.accept")}{" "}
              <Link href="/reklamacni-rad" target="_blank" className="text-rose underline">
                {t("terms.linkText")}
              </Link>{" "}
              {t("terms.and")}{" "}
              <Link href="/obchodni-podminky" target="_blank" className="text-rose underline">
                {t("terms.termsLinkText")}
              </Link>
            </span>
          </label>
        </div>
      )}

      {/* Step 2: Customer type */}
      {currentStep === "customerType" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-ink">{t("type.title")}</h3>
          <p className="text-sm text-muted">{t("type.description")}</p>
          <div className="grid gap-3">
            {(["RETAIL", "SALON", "HAIRDRESSER"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setForm({ ...form, customerType: type })}
                className={`text-left p-4 rounded-xl border transition-colors ${
                  form.customerType === type
                    ? "border-rose bg-rose/5"
                    : "border-line hover:border-muted"
                }`}
              >
                <div className="font-medium text-ink text-sm">{t(`type.${type}`)}</div>
                <div className="text-xs text-muted mt-0.5">{t(`type.${type}Desc`)}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Contact info */}
      {currentStep === "contact" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-ink">{t("contact.title")}</h3>
          <div>
            <label className={labelClass}>{t("contact.name")} *</label>
            <input
              type="text"
              required
              maxLength={200}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t("contact.email")} *</label>
            <input
              type="email"
              required
              maxLength={200}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t("contact.phone")}</label>
            <input
              type="tel"
              maxLength={30}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputClass}
            />
          </div>
          {(form.customerType === "SALON" || form.customerType === "HAIRDRESSER") && (
            <div>
              <label className={labelClass}>{t("contact.salonName")}</label>
              <input
                type="text"
                maxLength={200}
                value={form.salonName}
                onChange={(e) => setForm({ ...form, salonName: e.target.value })}
                className={inputClass}
              />
            </div>
          )}
        </div>
      )}

      {/* Step 4: Complaint details */}
      {currentStep === "details" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-ink">{t("details.title")}</h3>

          <div>
            <label className={labelClass}>{t("details.complaintType")} *</label>
            <div className="grid gap-2">
              {(["DEFECT", "RETURN", "WITHDRAWAL"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm({ ...form, complaintType: type })}
                  className={`text-left p-3 rounded-lg border transition-colors ${
                    form.complaintType === type
                      ? "border-rose bg-rose/5"
                      : "border-line hover:border-muted"
                  }`}
                >
                  <div className="font-medium text-ink text-sm">{t(`details.${type}`)}</div>
                  <div className="text-xs text-muted mt-0.5">{t(`details.${type}Desc`)}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>{t("details.orderNumber")}</label>
            <input
              type="text"
              maxLength={100}
              value={form.orderNumber}
              onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
              placeholder={t("details.orderNumberPlaceholder")}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>{t("details.description")} *</label>
            <textarea
              required
              minLength={10}
              maxLength={5000}
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={t("details.descriptionPlaceholder")}
              className={inputClass}
            />
            <p className="text-xs text-muted mt-1">
              {form.description.length}/5000
            </p>
          </div>

          <div>
            <label className={labelClass}>{t("details.desiredResolution")}</label>
            <select
              value={form.desiredResolution}
              onChange={(e) =>
                setForm({ ...form, desiredResolution: e.target.value as FormData["desiredResolution"] })
              }
              className={inputClass}
            >
              <option value="">{t("details.selectResolution")}</option>
              <option value="REPAIR">{t("details.REPAIR")}</option>
              <option value="REPLACEMENT">{t("details.REPLACEMENT")}</option>
              <option value="DISCOUNT">{t("details.DISCOUNT")}</option>
              <option value="REFUND">{t("details.REFUND")}</option>
            </select>
          </div>
        </div>
      )}

      {/* Step 5: Photos */}
      {currentStep === "photos" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-ink">{t("photos.title")}</h3>
          <p className="text-sm text-muted">{t("photos.description")}</p>

          {form.photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {form.photos.map((url, i) => (
                <div key={i} className="relative group">
                  <img
                    src={url}
                    alt={`Photo ${i + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}

          {form.photos.length < 10 && (
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-line rounded-xl p-6 text-center hover:border-muted transition-colors">
                {uploading ? (
                  <p className="text-sm text-muted">{t("photos.uploading")}</p>
                ) : (
                  <>
                    <svg className="w-8 h-8 mx-auto text-muted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-muted">{t("photos.clickToUpload")}</p>
                    <p className="text-xs text-muted mt-1">JPG, PNG, WebP (max 10 MB)</p>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          )}

          <p className="text-xs text-muted">
            {t("photos.count", { current: form.photos.length, max: 10 })}
          </p>
        </div>
      )}

      {/* Step 6: Summary */}
      {currentStep === "summary" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-ink">{t("summary.title")}</h3>

          <div className="bg-nude-50 rounded-xl p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">{t("type.title")}</span>
              <span className="text-ink font-medium">{t(`type.${form.customerType}`)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">{t("contact.name")}</span>
              <span className="text-ink font-medium">{form.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">{t("contact.email")}</span>
              <span className="text-ink font-medium">{form.email}</span>
            </div>
            {form.phone && (
              <div className="flex justify-between">
                <span className="text-muted">{t("contact.phone")}</span>
                <span className="text-ink font-medium">{form.phone}</span>
              </div>
            )}
            {form.salonName && (
              <div className="flex justify-between">
                <span className="text-muted">{t("contact.salonName")}</span>
                <span className="text-ink font-medium">{form.salonName}</span>
              </div>
            )}
            <hr className="border-line" />
            <div className="flex justify-between">
              <span className="text-muted">{t("details.complaintType")}</span>
              <span className="text-ink font-medium">{t(`details.${form.complaintType}`)}</span>
            </div>
            {form.orderNumber && (
              <div className="flex justify-between">
                <span className="text-muted">{t("details.orderNumber")}</span>
                <span className="text-ink font-medium">{form.orderNumber}</span>
              </div>
            )}
            {form.desiredResolution && (
              <div className="flex justify-between">
                <span className="text-muted">{t("details.desiredResolution")}</span>
                <span className="text-ink font-medium">{t(`details.${form.desiredResolution}`)}</span>
              </div>
            )}
            <hr className="border-line" />
            <div>
              <span className="text-muted block mb-1">{t("details.description")}</span>
              <p className="text-ink text-sm whitespace-pre-line">{form.description}</p>
            </div>
            {form.photos.length > 0 && (
              <div>
                <span className="text-muted block mb-1">{t("photos.title")}</span>
                <div className="flex gap-2 flex-wrap">
                  {form.photos.map((url, i) => (
                    <img key={i} src={url} alt={`Photo ${i + 1}`} className="w-16 h-16 object-cover rounded-lg" />
                  ))}
                </div>
              </div>
            )}
          </div>

          {result && !result.success && (
            <p className="text-sm text-red-600 font-medium">{t("summary.error")}</p>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="px-4 py-2 text-sm font-medium text-muted border border-line rounded-lg hover:bg-nude-50 transition-colors"
          >
            {t("nav.back")}
          </button>
        )}

        <div className="flex-1" />

        {currentStep === "summary" ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 bg-rose text-white font-medium text-sm rounded-lg hover:bg-rose-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? tCommon("saving") : t("nav.submit")}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="px-6 py-2 bg-rose text-white font-medium text-sm rounded-lg hover:bg-rose-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("nav.next")}
          </button>
        )}
      </div>
    </div>
  );
}
