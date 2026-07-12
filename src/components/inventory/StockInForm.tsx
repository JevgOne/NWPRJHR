"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { getHairColor, COLOR_CODES } from "@/lib/hair-colors";
import { TEXTURE_OPTIONS } from "@/lib/hair-textures";
import { ORIGIN_OPTIONS } from "@/lib/origin-flags";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface SupplierOption {
  id: string;
  name: string;
}

interface SuccessData {
  productId: string;
  productName: string;
  totalGrams: number;
  totalPieces: number;
  sellingMode: "BY_GRAM" | "BY_PIECE";
  barcode: string;
}

type Category = "VIRGIN" | "PREMIUM" | "STANDARD" | "SALE";

const LENGTH_PRESETS = [30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];

export function StockInForm({ suppliers }: { suppliers: SupplierOption[] }) {
  const t = useTranslations("stock");
  const tCommon = useTranslations("common");
  const tCat = useTranslations("category");
  const tColors = useTranslations("public.colors");
  const router = useRouter();

  // Progressive form state
  const [category, setCategory] = useState<Category | "">("");
  const [origin, setOrigin] = useState("");
  const [texture, setTexture] = useState("");
  const [color, setColor] = useState("");
  const [lengthCm, setLengthCm] = useState<number | null>(null);
  const [customLength, setCustomLength] = useState("");

  // Selling mode
  const [sellingMode, setSellingMode] = useState<"BY_GRAM" | "BY_PIECE">("BY_GRAM");
  const [totalPieces, setTotalPieces] = useState("");
  const [pieceWeightGrams, setPieceWeightGrams] = useState("");
  const [purchasePricePerPieceCzk, setPurchasePricePerPieceCzk] = useState("");
  const [pricePerPieceCzk, setPricePerPieceCzk] = useState("");
  const [retailPricePerPieceCzk, setRetailPricePerPieceCzk] = useState("");

  // Details form state
  const [supplierId, setSupplierId] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [totalGrams, setTotalGrams] = useState("");
  const [stockedAt, setStockedAt] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [note, setNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Preview URLs for selected files
  const filePreviews = useMemo(() => {
    return selectedFiles.map((f) =>
      f.type.startsWith("image/") ? URL.createObjectURL(f) : null
    );
  }, [selectedFiles]);

  const handleFilesSelected = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    setSelectedFiles((prev) => [...prev, ...Array.from(files)]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Auto-scroll to the next form section after selection
  const scrollTo = useCallback((id: string) => {
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }, []);

  const colorName = (code: string) => {
    const { nameKey } = getHairColor(code);
    try {
      return tColors(nameKey as "c1");
    } catch {
      return code;
    }
  };

  // Reset from a given level forward
  function resetFrom(level: number) {
    if (level <= 1) { setCategory(""); setOrigin(""); setTexture(""); setColor(""); setLengthCm(null); setCustomLength(""); }
    if (level === 2) { setOrigin(""); setTexture(""); setColor(""); setLengthCm(null); setCustomLength(""); }
    if (level === 3) { setTexture(""); setColor(""); setLengthCm(null); setCustomLength(""); }
    if (level === 4) { setColor(""); setLengthCm(null); setCustomLength(""); }
    if (level === 5) { setLengthCm(null); setCustomLength(""); }
  }

  // Badge row showing selected attributes
  function BadgeRow() {
    const badges: { label: string; level: number }[] = [];
    if (category)
      badges.push({ label: tCat(category.toLowerCase() as "virgin"), level: 1 });
    if (origin) badges.push({ label: origin, level: 2 });
    if (texture) badges.push({ label: texture, level: 3 });
    if (color) badges.push({ label: colorName(color), level: 4 });
    if (lengthCm) badges.push({ label: `${lengthCm} cm`, level: 5 });

    if (badges.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1.5 mb-4">
        {badges.map((b) => (
          <button
            key={b.level}
            type="button"
            onClick={() => resetFrom(b.level)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-nude-100 text-espresso hover:bg-nude-200 transition-colors"
          >
            {b.label}
            <span className="text-muted ml-0.5">&times;</span>
          </button>
        ))}
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !origin || !texture || !color || !lengthCm) return;
    setSubmitting(true);
    setError("");

    const isByPiece = sellingMode === "BY_PIECE";
    const parsedPieces = isByPiece ? parseInt(totalPieces) : 0;
    const parsedPieceWeight = isByPiece ? parseInt(pieceWeightGrams) : undefined;
    const computedGrams = isByPiece && parsedPieceWeight
      ? parsedPieces * parsedPieceWeight
      : parseInt(totalGrams);

    const body = {
      category,
      origin,
      texture,
      color,
      lengthCm,
      supplierId,
      purchasePricePerGramRaw: isByPiece
        ? (parsedPieceWeight ? Math.round((parseFloat(purchasePricePerPieceCzk) * 100) / parsedPieceWeight) : 0)
        : Math.round(parseFloat(purchasePrice) * 100),
      currency: "CZK" as const,
      exchangeRate: 10000,
      totalGrams: computedGrams,
      totalPieces: parsedPieces,
      sellingMode,
      ...(isByPiece ? {
        pieceWeightGrams: parsedPieceWeight,
        purchasePricePerPiece: Math.round(parseFloat(purchasePricePerPieceCzk) * 100),
        pricePerPiece: Math.round(parseFloat(pricePerPieceCzk) * 100),
        ...(retailPricePerPieceCzk
          ? { retailPricePerPiece: Math.round(parseFloat(retailPricePerPieceCzk) * 100) }
          : {}),
      } : {}),
      stockedAt: new Date(stockedAt).toISOString(),
      ...(note ? { note } : {}),
    };

    const res = await fetch("/api/deliveries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(
        data.error?.formErrors?.[0] ?? JSON.stringify(data.error) ?? "Error"
      );
      setSubmitting(false);
      return;
    }

    const result = await res.json();

    // Upload photos if any were selected
    if (selectedFiles.length > 0) {
      const formData = new FormData();
      for (const file of selectedFiles) {
        formData.append("files", file);
      }
      try {
        const mediaRes = await fetch(`/api/products/${result.productId}/media`, {
          method: "POST",
          body: formData,
        });
        const mediaData = await mediaRes.json();
        if (mediaRes.ok) {
          setUploadedPhotos(mediaData.photos ?? []);
          if (mediaData.video) setUploadedVideo(mediaData.video);
        } else {
          setUploadError(mediaData.error || "Upload selhal");
        }
      } catch {
        setUploadError("Upload selhal");
      }
    }

    const saleUrl = `${window.location.origin}/sales/new?variantId=${result.variantId}`;
    const QRCode = await import("qrcode");
    const dataUrl = await QRCode.toDataURL(saleUrl, {
      errorCorrectionLevel: "M",
      width: 200,
      margin: 2,
    });
    setQrDataUrl(dataUrl);
    setSuccessData({
      productId: result.productId,
      productName: result.productName ?? "",
      totalGrams: computedGrams,
      totalPieces: parsedPieces,
      sellingMode,
      barcode: result.barcode ?? "",
    });
    setSubmitting(false);
  }

  // Handle media upload
  async function handleMediaUpload(files: FileList | null) {
    if (!files || files.length === 0 || !successData) return;
    setUploading(true);
    setUploadError("");

    const formData = new FormData();
    for (const file of Array.from(files)) {
      formData.append("files", file);
    }

    try {
      const res = await fetch(`/api/products/${successData.productId}/media`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload selhal");
      setUploadedPhotos(data.photos ?? []);
      if (data.video) setUploadedVideo(data.video);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload selhal");
    } finally {
      setUploading(false);
    }
  }

  // Success screen
  if (successData) {
    return (
      <Card>
        <div className="flex flex-col items-center py-8 max-w-lg mx-auto text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-espresso">
            {t("stockedSuccess")}
          </h2>
          <p className="text-sm text-muted">
            {successData.productName} &mdash;{" "}
            {successData.sellingMode === "BY_PIECE"
              ? `${successData.totalPieces} ${t("perPiece")} (${successData.totalGrams} g)`
              : `${successData.totalGrams} g`}
          </p>
          {qrDataUrl && (
            <img
              src={qrDataUrl}
              alt="QR"
              width={200}
              height={200}
              className="mx-auto"
            />
          )}
          {successData.barcode && (
            <p className="text-xs text-muted font-mono">{successData.barcode}</p>
          )}
          <p className="text-xs text-muted">{t("qrLinkDesc")}</p>

          {/* Uploaded photos preview */}
          {(uploadedPhotos.length > 0 || uploadedVideo) && (
            <div className="w-full border-t border-line pt-4 mt-2 text-left">
              <h3 className="text-sm font-semibold text-espresso mb-2">
                {t("photosUploaded")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {uploadedPhotos.map((url, i) => (
                  <img key={i} src={url} alt={`Foto ${i + 1}`} className="w-16 h-16 rounded-lg object-cover border border-line" />
                ))}
                {uploadedVideo && (
                  <div className="w-16 h-16 rounded-lg border border-line bg-ink/5 flex items-center justify-center">
                    <svg className="w-6 h-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fallback upload if no photos were added during the form */}
          {uploadedPhotos.length === 0 && !uploadedVideo && (
            <div className="w-full border-t border-line pt-4 mt-2 text-left">
              <h3 className="text-sm font-semibold text-espresso mb-2">
                {t("uploadPhotos")}
              </h3>
              {uploadError && (
                <p className="text-xs text-red-600 mb-2">{uploadError}</p>
              )}
              <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-line text-sm font-medium transition-colors cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : "hover:border-espresso/30 hover:bg-nude-50"}`}>
                <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {uploading ? tCommon("loading") : t("uploadPhotos")}
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                  className="hidden"
                  onChange={(e) => handleMediaUpload(e.target.files)}
                  disabled={uploading}
                />
              </label>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => window.print()}
            >
              {t("printLabel")}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setSuccessData(null);
                setQrDataUrl("");
                setUploadedPhotos([]);
                setUploadedVideo(null);
                setUploadError("");
                setSelectedFiles([]);
                setCategory("");
                setOrigin("");
                setTexture("");
                setColor("");
                setLengthCm(null);
                setCustomLength("");
                setSellingMode("BY_GRAM");
                setTotalPieces("");
                setPieceWeightGrams("");
                setPurchasePricePerPieceCzk("");
                setPricePerPieceCzk("");
                setRetailPricePerPieceCzk("");
                setSupplierId("");
                setPurchasePrice("");
                setTotalGrams("");
                setNote("");
                setStockedAt(new Date().toISOString().slice(0, 10));
              }}
            >
              {t("stockAnother")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                router.push("/inventory");
                router.refresh();
              }}
            >
              {tCommon("done")}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <BadgeRow />

      <div className="space-y-6">
        {/* Category — always visible */}
        <div id="section-category">
          <h2 className="text-sm font-medium text-espresso mb-3">
            {t("wizCategory")}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {(["VIRGIN", "PREMIUM", "STANDARD", "SALE"] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => { setCategory(cat); resetFrom(2); scrollTo("section-origin"); }}
                className={`p-4 rounded-xl border-2 text-sm font-semibold transition-colors ${
                  category === cat
                    ? "border-rose bg-rose/5 text-ink"
                    : "border-line bg-white text-muted hover:border-espresso/30"
                }`}
              >
                {tCat(cat.toLowerCase() as "virgin")}
              </button>
            ))}
          </div>
        </div>

        {/* Origin — after category */}
        {category && (
          <div id="section-origin">
            <h2 className="text-sm font-medium text-espresso mb-3">
              {t("wizOrigin")}
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {ORIGIN_OPTIONS.map((o) => (
                <button
                  key={o.name}
                  type="button"
                  onClick={() => { setOrigin(o.name); resetFrom(3); scrollTo("section-texture"); }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-medium transition-colors ${
                    origin === o.name
                      ? "border-rose bg-rose/5 text-ink"
                      : "border-line bg-white text-muted hover:border-espresso/30"
                  }`}
                >
                  <span className="text-xl">{o.flag}</span>
                  {o.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Texture — after origin */}
        {category && origin && (
          <div id="section-texture">
            <h2 className="text-sm font-medium text-espresso mb-3">
              {t("wizTexture")}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {TEXTURE_OPTIONS.map((tex) => (
                <button
                  key={tex.name}
                  type="button"
                  onClick={() => { setTexture(tex.name); resetFrom(4); scrollTo("section-color"); }}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 text-sm font-medium transition-colors ${
                    texture === tex.name
                      ? "border-rose bg-rose/5 text-ink"
                      : "border-line bg-white text-muted hover:border-espresso/30"
                  }`}
                >
                  <span className="text-2xl">{tex.icon}</span>
                  {tex.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Color — after texture */}
        {category && origin && texture && (
          <div id="section-color">
            <h2 className="text-sm font-medium text-espresso mb-3">
              {t("color")}
            </h2>
            <div className="grid grid-cols-5 gap-3">
              {COLOR_CODES.map((code) => {
                const hc = getHairColor(code);
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => { setColor(code); resetFrom(5); scrollTo("section-length"); }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                      color === code
                        ? "border-rose bg-rose/5"
                        : "border-line bg-white hover:border-espresso/30"
                    }`}
                  >
                    <span
                      className="w-10 h-10 rounded-full border border-line flex-shrink-0"
                      style={{ backgroundColor: hc.hex }}
                    />
                    <span className="text-xs font-medium text-ink">
                      {colorName(code)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Length — after color */}
        {category && origin && texture && color && (
          <div id="section-length">
            <h2 className="text-sm font-medium text-espresso mb-3">
              {t("length")}
            </h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {LENGTH_PRESETS.map((cm) => (
                <button
                  key={cm}
                  type="button"
                  onClick={() => { setLengthCm(cm); setCustomLength(""); scrollTo("section-selling"); }}
                  className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-colors ${
                    lengthCm === cm
                      ? "border-rose bg-rose/5 text-ink"
                      : "border-line bg-white text-muted hover:border-espresso/30"
                  }`}
                >
                  {cm} cm
                </button>
              ))}
            </div>
            <div className="flex items-end gap-2 max-w-xs">
              <Input
                label={t("wizCustomLength")}
                type="number"
                value={customLength}
                onChange={(e) => setCustomLength(e.target.value)}
                min={10}
                max={150}
                placeholder="cm"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={!customLength || parseInt(customLength) < 10}
                onClick={() => { setLengthCm(parseInt(customLength)); setCustomLength(""); scrollTo("section-selling"); }}
              >
                OK
              </Button>
            </div>
          </div>
        )}

        {/* Selling mode — after length */}
        {category && origin && texture && color && lengthCm && (
          <div id="section-selling">
            <h2 className="text-sm font-medium text-espresso mb-3">
              {t("sellingMode")}
            </h2>
            <div className="grid grid-cols-2 gap-3 max-w-lg">
              <button
                type="button"
                onClick={() => { setSellingMode("BY_GRAM"); scrollTo("section-details"); }}
                className={`p-4 rounded-xl border-2 text-sm font-semibold transition-colors ${
                  sellingMode === "BY_GRAM"
                    ? "border-rose bg-rose/5 text-ink"
                    : "border-line bg-white text-muted hover:border-espresso/30"
                }`}
              >
                {t("byGram")}
              </button>
              <button
                type="button"
                onClick={() => { setSellingMode("BY_PIECE"); scrollTo("section-details"); }}
                className={`p-4 rounded-xl border-2 text-sm font-semibold transition-colors ${
                  sellingMode === "BY_PIECE"
                    ? "border-rose bg-rose/5 text-ink"
                    : "border-line bg-white text-muted hover:border-espresso/30"
                }`}
              >
                {t("byPiece")}
              </button>
            </div>
          </div>
        )}

        {/* Details — after selling mode */}
        {category && origin && texture && color && lengthCm && (
          <form id="section-details" onSubmit={handleSubmit} className="space-y-5 max-w-lg">
            <h2 className="text-sm font-medium text-espresso mb-1">
              {t("wizDetails")}
            </h2>

            {/* Supplier */}
            <div>
              <label className="block text-sm font-medium text-espresso mb-1">
                {t("supplier")}
              </label>
              <select
                className="block w-full rounded-lg border border-line px-3 py-2 text-sm"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                required
              >
                <option value="">{t("selectSupplier")}</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Purchase price (per gram — needed for COGS in BY_GRAM mode) */}
            {sellingMode === "BY_GRAM" && (
              <Input
                label={`${t("purchasePrice")} (Kč/${t("grams")})`}
                type="number"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                required
                min={1}
                step="0.01"
              />
            )}

            {/* BY_PIECE fields */}
            {sellingMode === "BY_PIECE" && (
              <div className="space-y-4 p-4 rounded-xl border-2 border-rose/20 bg-rose/5">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t("totalPieces")}
                    type="number"
                    value={totalPieces}
                    onChange={(e) => setTotalPieces(e.target.value)}
                    required
                    min={1}
                  />
                  <Input
                    label={t("pieceWeight")}
                    type="number"
                    value={pieceWeightGrams}
                    onChange={(e) => setPieceWeightGrams(e.target.value)}
                    required
                    min={1}
                  />
                </div>
                <Input
                  label={t("purchasePricePerPieceCzk")}
                  type="number"
                  value={purchasePricePerPieceCzk}
                  onChange={(e) => setPurchasePricePerPieceCzk(e.target.value)}
                  required
                  min={1}
                  step="0.01"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t("pricePerPieceCzk")}
                    type="number"
                    value={pricePerPieceCzk}
                    onChange={(e) => setPricePerPieceCzk(e.target.value)}
                    required
                    min={1}
                    step="0.01"
                  />
                  <Input
                    label={t("retailPricePerPieceCzk")}
                    type="number"
                    value={retailPricePerPieceCzk}
                    onChange={(e) => setRetailPricePerPieceCzk(e.target.value)}
                    step="0.01"
                  />
                </div>
                {totalPieces && pieceWeightGrams && (
                  <p className="text-xs text-muted">
                    {t("autoGrams")}: {parseInt(totalPieces) * parseInt(pieceWeightGrams)} g
                  </p>
                )}
              </div>
            )}

            {/* Grams (manual) — only for BY_GRAM + Date */}
            <div className="grid grid-cols-2 gap-4">
              {sellingMode === "BY_GRAM" && (
                <Input
                  label={t("totalGrams")}
                  type="number"
                  value={totalGrams}
                  onChange={(e) => setTotalGrams(e.target.value)}
                  required
                  min={1}
                />
              )}
              <Input
                label={t("stockedAt")}
                type="date"
                value={stockedAt}
                onChange={(e) => setStockedAt(e.target.value)}
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-espresso mb-1">
                {t("note")}
              </label>
              <textarea
                className="block w-full rounded-lg border border-line px-3 py-2 text-sm"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {/* Photo upload section */}
            <div id="section-photos">
              <h2 className="text-sm font-medium text-espresso mb-2">
                {t("uploadPhotos")}
              </h2>
              <p className="text-xs text-muted mb-3">{t("uploadPhotosTip")}</p>

              {/* Selected file previews */}
              {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedFiles.map((file, i) => (
                    <div key={i} className="relative group">
                      {filePreviews[i] ? (
                        <img
                          src={filePreviews[i]!}
                          alt={file.name}
                          className="w-16 h-16 rounded-lg object-cover border border-line"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg border border-line bg-ink/5 flex items-center justify-center">
                          <svg className="w-6 h-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-line text-sm font-medium transition-colors cursor-pointer hover:border-espresso/30 hover:bg-nude-50">
                <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {t("uploadPhotos")}
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                  className="hidden"
                  onChange={(e) => { handleFilesSelected(e.target.files); e.target.value = ""; }}
                />
              </label>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? tCommon("loading") : t("stockIn")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push("/inventory")}
              >
                {tCommon("cancel")}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Card>
  );
}
