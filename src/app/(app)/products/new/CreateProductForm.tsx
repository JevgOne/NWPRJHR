"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ORIGIN_OPTIONS } from "@/lib/origin-flags";
import { PhotoUpload } from "@/components/products/PhotoUpload";

const CATEGORIES = ["VIRGIN", "PREMIUM", "STANDARD", "SALE"] as const;
const PROCESSING_TYPES = [
  "CLIP_IN",
  "TAPE_IN",
  "KERATIN",
  "WEFT",
  "MICRO_RING",
  "OTHER",
] as const;

export function CreateProductForm() {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [origin, setOrigin] = useState("");
  const [originOpen, setOriginOpen] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const originRef = useRef<HTMLDivElement>(null);

  const filteredOrigins = ORIGIN_OPTIONS.filter((o) =>
    o.name.toLowerCase().includes(origin.toLowerCase())
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (originRef.current && !originRef.current.contains(e.target as Node)) {
        setOriginOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const data = {
      name: form.get("name") as string,
      nameUk: (form.get("nameUk") as string) || undefined,
      nameRu: (form.get("nameRu") as string) || undefined,
      description: (form.get("description") as string) || undefined,
      category: form.get("category") as string,
      processingType: form.get("processingType") as string,
      origin: origin || undefined,
      photos: photos.length > 0 ? JSON.stringify(photos) : undefined,
      slug:
        (form.get("slug") as string) ||
        (form.get("name") as string)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") || undefined,
    };

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error?.toString() || t("productForm.createError"));
        return;
      }

      const product = await res.json();
      router.push(`/products/${product.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        {t("common.add")} — {t("nav.products")}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="name" name="name" label={`${t("nav.products")} (CZ)`} required />
        <Input id="nameUk" name="nameUk" label={`${t("nav.products")} (UK)`} />
        <Input id="nameRu" name="nameRu" label={`${t("nav.products")} (RU)`} />
        <Input id="description" name="description" label={`${t("nav.products")} — ${t("productForm.description")}`} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("category.virgin")} / {t("category.premium")} / ...
          </label>
          <select
            name="category"
            required
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {t(`category.${cat.toLowerCase()}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("salon.processingType")}
          </label>
          <select
            name="processingType"
            required
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {PROCESSING_TYPES.map((pt) => (
              <option key={pt} value={pt}>
                {pt.replace(/_/g, "-")}
              </option>
            ))}
          </select>
        </div>

        <div ref={originRef} className="relative">
          <label htmlFor="origin" className="block text-sm font-medium text-gray-700 mb-1">
            {t("product.origin")}
          </label>
          <input
            id="origin"
            type="text"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            value={origin}
            onChange={(e) => {
              setOrigin(e.target.value);
              setOriginOpen(true);
            }}
            onFocus={() => setOriginOpen(true)}
            placeholder={t("product.originPlaceholder")}
            autoComplete="off"
          />
          {originOpen && filteredOrigins.length > 0 && (
            <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {filteredOrigins.map((o) => (
                <li key={o.name}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-indigo-50 text-left"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setOrigin(o.name);
                      setOriginOpen(false);
                    }}
                  >
                    <span>{o.flag}</span>
                    <span>{o.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <PhotoUpload photos={photos} onChange={setPhotos} disabled={loading} />

        <Input id="slug" name="slug" label="Slug (URL)" placeholder="auto-generated" />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "..." : t("common.save")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
