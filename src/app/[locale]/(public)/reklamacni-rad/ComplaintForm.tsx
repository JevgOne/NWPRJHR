"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type ProductItem = { brand: string; frequency: string };

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
  appliedBy: string;
  processedBy: string;
  productsShampoo: ProductItem;
  productsConditioner: ProductItem;
  productsMask: ProductItem;
  productsOilSerum: ProductItem;
  productsAmpoule: ProductItem;
  productsThermoprotection: ProductItem;
  usesFlatiron: "yes" | "no" | "";
  flatironTemp: string;
  thermoprotectionFreq: "always" | "sometimes" | "never" | "";
  usesDye: "yes" | "no" | "";
  dyeDetails: string;
  poolSea: "yes" | "no" | "";
  sleepsLoose: "yes" | "no" | "";
};

const PRODUCT_KEYS = ["Shampoo", "Conditioner", "Mask", "OilSerum", "Ampoule", "Thermoprotection"] as const;
const PRODUCT_I18N: Record<string, string> = {
  Shampoo: "shampoo", Conditioner: "conditioner", Mask: "mask",
  OilSerum: "oilSerum", Ampoule: "ampoule", Thermoprotection: "thermoprotection",
};
const FREQ_I18N: Record<string, string> = {
  daily: "freqDaily", "2-3week": "freq2_3Week", weekly: "freqWeekly",
  "2-3month": "freq2_3Month", rarely: "freqRarely", never: "freqNever",
};

const STEPS = ["terms", "customerType", "contact", "details", "products", "heatChemical", "photos", "summary"] as const;

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
    appliedBy: "",
    processedBy: "",
    productsShampoo: { brand: "", frequency: "" },
    productsConditioner: { brand: "", frequency: "" },
    productsMask: { brand: "", frequency: "" },
    productsOilSerum: { brand: "", frequency: "" },
    productsAmpoule: { brand: "", frequency: "" },
    productsThermoprotection: { brand: "", frequency: "" },
    usesFlatiron: "",
    flatironTemp: "",
    thermoprotectionFreq: "",
    usesDye: "",
    dyeDetails: "",
    poolSea: "",
    sleepsLoose: "",
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
      case "products":
        return form.productsShampoo.brand.trim().length > 0;
      case "heatChemical":
        return form.usesFlatiron !== "" && form.thermoprotectionFreq !== "";
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
          appliedBy: form.appliedBy.trim() || undefined,
          processedBy: form.processedBy.trim() || undefined,
          products: {
            shampoo: form.productsShampoo.brand ? form.productsShampoo : undefined,
            conditioner: form.productsConditioner.brand ? form.productsConditioner : undefined,
            mask: form.productsMask.brand ? form.productsMask : undefined,
            oilSerum: form.productsOilSerum.brand ? form.productsOilSerum : undefined,
            ampoule: form.productsAmpoule.brand ? form.productsAmpoule : undefined,
            thermoprotection: form.productsThermoprotection.brand ? form.productsThermoprotection : undefined,
          },
          heatChemical: {
            usesFlatiron: form.usesFlatiron || undefined,
            flatironTemp: form.flatironTemp.trim() || undefined,
            thermoprotectionFreq: form.thermoprotectionFreq || undefined,
            usesDye: form.usesDye || undefined,
            dyeDetails: form.dyeDetails.trim() || undefined,
            poolSea: form.poolSea || undefined,
            sleepsLoose: form.sleepsLoose || undefined,
          },
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

          <div>
            <label className={labelClass}>{t("details.appliedBy")}</label>
            <input
              type="text"
              maxLength={500}
              value={form.appliedBy}
              onChange={(e) => setForm({ ...form, appliedBy: e.target.value })}
              placeholder={t("details.appliedByPlaceholder")}
              className={inputClass}
            />
            <p className="text-xs text-muted mt-1">{t("details.appliedByHint")}</p>
          </div>

          <div>
            <label className={labelClass}>{t("details.processedBy")}</label>
            <input
              type="text"
              maxLength={500}
              value={form.processedBy}
              onChange={(e) => setForm({ ...form, processedBy: e.target.value })}
              placeholder={t("details.processedByPlaceholder")}
              className={inputClass}
            />
            <p className="text-xs text-muted mt-1">{t("details.processedByHint")}</p>
          </div>
        </div>
      )}

      {/* Step 5: Products */}
      {currentStep === "products" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-ink">{t("products.title")}</h3>
          <p className="text-sm text-muted">{t("products.description")}</p>

          {PRODUCT_KEYS.map((key) => {
            const fieldKey = `products${key}` as keyof FormData;
            const value = form[fieldKey] as ProductItem;
            const i18nKey = PRODUCT_I18N[key];
            return (
              <div key={key} className="bg-nude-50 rounded-xl p-4">
                <label className="block text-sm font-medium text-espresso mb-2">
                  {t(`products.${i18nKey}`)}
                  {key === "Shampoo" && " *"}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted mb-1">{t("products.brandLabel")}</label>
                    <input
                      type="text"
                      maxLength={200}
                      value={value.brand}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          [fieldKey]: { ...value, brand: e.target.value },
                        }))
                      }
                      placeholder={t("products.brandPlaceholder")}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">{t("products.frequencyLabel")}</label>
                    <select
                      value={value.frequency}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          [fieldKey]: { ...value, frequency: e.target.value },
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="">{t("products.frequencySelect")}</option>
                      <option value="daily">{t("products.freqDaily")}</option>
                      <option value="2-3week">{t("products.freq2_3Week")}</option>
                      <option value="weekly">{t("products.freqWeekly")}</option>
                      <option value="2-3month">{t("products.freq2_3Month")}</option>
                      <option value="rarely">{t("products.freqRarely")}</option>
                      <option value="never">{t("products.freqNever")}</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Step 6: Heat & Chemical */}
      {currentStep === "heatChemical" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-ink">{t("heat.title")}</h3>
          <p className="text-sm text-muted">{t("heat.description")}</p>

          <div>
            <label className={labelClass}>{t("heat.flatiron")} *</label>
            <div className="flex gap-3">
              {(["yes", "no"] as const).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setForm({ ...form, usesFlatiron: val })}
                  className={`px-4 py-2 rounded-lg border text-sm ${
                    form.usesFlatiron === val ? "border-rose bg-rose/5 text-ink" : "border-line text-muted"
                  }`}
                >
                  {t(`heat.${val}`)}
                </button>
              ))}
            </div>
          </div>

          {form.usesFlatiron === "yes" && (
            <div>
              <label className={labelClass}>{t("heat.flatironTemp")}</label>
              <input
                type="text"
                maxLength={50}
                value={form.flatironTemp}
                onChange={(e) => setForm({ ...form, flatironTemp: e.target.value })}
                placeholder={t("heat.flatironTempPlaceholder")}
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label className={labelClass}>{t("heat.thermoprotection")} *</label>
            <div className="flex gap-2 flex-wrap">
              {(["always", "sometimes", "never"] as const).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setForm({ ...form, thermoprotectionFreq: val })}
                  className={`px-4 py-2 rounded-lg border text-sm ${
                    form.thermoprotectionFreq === val ? "border-rose bg-rose/5 text-ink" : "border-line text-muted"
                  }`}
                >
                  {t(`heat.thermo_${val}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>{t("heat.dyeing")}</label>
            <div className="flex gap-3">
              {(["yes", "no"] as const).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setForm({ ...form, usesDye: val })}
                  className={`px-4 py-2 rounded-lg border text-sm ${
                    form.usesDye === val ? "border-rose bg-rose/5 text-ink" : "border-line text-muted"
                  }`}
                >
                  {t(`heat.${val}`)}
                </button>
              ))}
            </div>
          </div>

          {form.usesDye === "yes" && (
            <div>
              <label className={labelClass}>{t("heat.dyeDetails")}</label>
              <input
                type="text"
                maxLength={500}
                value={form.dyeDetails}
                onChange={(e) => setForm({ ...form, dyeDetails: e.target.value })}
                placeholder={t("heat.dyeDetailsPlaceholder")}
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label className={labelClass}>{t("heat.poolSea")}</label>
            <div className="flex gap-3">
              {(["yes", "no"] as const).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setForm({ ...form, poolSea: val })}
                  className={`px-4 py-2 rounded-lg border text-sm ${
                    form.poolSea === val ? "border-rose bg-rose/5 text-ink" : "border-line text-muted"
                  }`}
                >
                  {t(`heat.${val}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>{t("heat.sleepsLoose")}</label>
            <div className="flex gap-3">
              {(["yes", "no"] as const).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setForm({ ...form, sleepsLoose: val })}
                  className={`px-4 py-2 rounded-lg border text-sm ${
                    form.sleepsLoose === val ? "border-rose bg-rose/5 text-ink" : "border-line text-muted"
                  }`}
                >
                  {t(`heat.${val}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 7: Photos */}
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

      {/* Step 8: Summary */}
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
            {(form.appliedBy || form.processedBy) && (
              <>
                <hr className="border-line" />
                {form.appliedBy && (
                  <div className="flex justify-between">
                    <span className="text-muted">{t("details.appliedBy")}</span>
                    <span className="text-ink font-medium text-right max-w-[60%]">{form.appliedBy}</span>
                  </div>
                )}
                {form.processedBy && (
                  <div className="flex justify-between">
                    <span className="text-muted">{t("details.processedBy")}</span>
                    <span className="text-ink font-medium text-right max-w-[60%]">{form.processedBy}</span>
                  </div>
                )}
              </>
            )}
            <hr className="border-line" />
            <div>
              <span className="text-muted block mb-1">{t("products.title")}</span>
              <div className="space-y-1 text-sm">
                {PRODUCT_KEYS.map((key) => {
                  const fieldKey = `products${key}` as keyof FormData;
                  const value = form[fieldKey] as ProductItem;
                  if (!value.brand) return null;
                  const i18nKey = PRODUCT_I18N[key];
                  return (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted">{t(`products.${i18nKey}`)}</span>
                      <span className="text-ink">
                        {value.brand}
                        {value.frequency && FREQ_I18N[value.frequency] && ` (${t(`products.${FREQ_I18N[value.frequency]}`)})`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <hr className="border-line" />
            <div className="space-y-1 text-sm">
              <span className="text-muted block mb-1">{t("heat.title")}</span>
              {form.usesFlatiron && (
                <div className="flex justify-between">
                  <span className="text-muted">{t("heat.flatiron")}</span>
                  <span className="text-ink">{t(`heat.${form.usesFlatiron}`)}{form.flatironTemp ? ` (${form.flatironTemp})` : ""}</span>
                </div>
              )}
              {form.thermoprotectionFreq && (
                <div className="flex justify-between">
                  <span className="text-muted">{t("heat.thermoprotection")}</span>
                  <span className="text-ink">{t(`heat.thermo_${form.thermoprotectionFreq}`)}</span>
                </div>
              )}
              {form.usesDye && (
                <div className="flex justify-between">
                  <span className="text-muted">{t("heat.dyeing")}</span>
                  <span className="text-ink">{t(`heat.${form.usesDye}`)}{form.dyeDetails ? ` — ${form.dyeDetails}` : ""}</span>
                </div>
              )}
              {form.poolSea && (
                <div className="flex justify-between">
                  <span className="text-muted">{t("heat.poolSea")}</span>
                  <span className="text-ink">{t(`heat.${form.poolSea}`)}</span>
                </div>
              )}
              {form.sleepsLoose && (
                <div className="flex justify-between">
                  <span className="text-muted">{t("heat.sleepsLoose")}</span>
                  <span className="text-ink">{t(`heat.${form.sleepsLoose}`)}</span>
                </div>
              )}
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
