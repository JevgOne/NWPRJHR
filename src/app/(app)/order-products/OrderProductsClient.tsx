"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PhotoUpload } from "@/components/products/PhotoUpload";

interface OrderProduct {
  id: string;
  name: string;
  photos: string;
  supplierCode: string | null;
  photoCode: string | null;
  createdAt: Date;
  variants: {
    id: string;
    lengthCm: number;
    color: string;
    retailPricePerGram: number;
    retailPricePerPiece: number | null;
    sellingMode: string;
    availableToOrder: boolean;
    orderLeadDays: number | null;
  }[];
}

export function OrderProductsClient({ products }: { products: OrderProduct[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [supplierCode, setSupplierCode] = useState("");
  const [photoCode, setPhotoCode] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [leadDays, setLeadDays] = useState("14");
  const [description, setDescription] = useState("");

  const resetForm = () => {
    setName("");
    setSupplierCode("");
    setPhotoCode("");
    setPhotos([]);
    setPrice("");
    setLeadDays("14");
    setDescription("");
    setError("");
  };

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Zadejte název"); return; }
    if (!price.trim()) { setError("Zadejte cenu"); return; }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/order-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          supplierCode: supplierCode.trim() || null,
          photoCode: photoCode.trim() || null,
          photos,
          price: Math.round(parseFloat(price) * 100), // CZK → haléře
          leadDays: parseInt(leadDays) || 14,
          description: description.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Chyba při ukládání");
        return;
      }

      resetForm();
      setShowForm(false);
      router.refresh();
    } catch {
      setError("Chyba při ukládání");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Opravdu smazat?")) return;
    await fetch(`/api/order-products/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink">Na objednávku</h1>
        <Button onClick={() => { setShowForm(!showForm); if (!showForm) resetForm(); }}>
          {showForm ? "Zrušit" : "+ Přidat produkt"}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Nový produkt na objednávku</h2>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
            )}

            <div>
              <label className="block text-sm font-medium text-espresso mb-1">Název produktu</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="např. Slavic RAW Blond 60cm" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-espresso mb-1">Kód produktu</label>
                <Input value={supplierCode} onChange={(e) => setSupplierCode(e.target.value)} placeholder="např. SRB-60" />
              </div>
              <div>
                <label className="block text-sm font-medium text-espresso mb-1">Kód fotky</label>
                <Input value={photoCode} onChange={(e) => setPhotoCode(e.target.value)} placeholder="např. IMG-4521" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-espresso mb-1">Cena (CZK)</label>
                <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="např. 5500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-espresso mb-1">Dodací lhůta (dní)</label>
                <Input type="number" value={leadDays} onChange={(e) => setLeadDays(e.target.value)} placeholder="14" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-espresso mb-1">Popis</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-line rounded-lg p-2 text-sm"
                rows={3}
                placeholder="Volitelný popis..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-espresso mb-1">Fotky</label>
              <PhotoUpload photos={photos} onChange={setPhotos} />
            </div>

            <Button onClick={handleSubmit} disabled={loading} className="w-full">
              {loading ? "Ukládám..." : "Uložit produkt"}
            </Button>
          </div>
        </Card>
      )}

      {products.length === 0 && !showForm && (
        <Card>
          <p className="text-muted text-center py-8">Zatím žádné produkty na objednávku</p>
        </Card>
      )}

      <div className="space-y-3">
        {products.map((p) => {
          const photoArr: string[] = (() => { try { return JSON.parse(p.photos); } catch { return []; } })();
          const variant = p.variants[0];
          const priceDisplay = variant
            ? variant.sellingMode === "BY_PIECE"
              ? `${((variant.retailPricePerPiece ?? 0) / 100).toLocaleString("cs-CZ")} CZK/ks`
              : `${(variant.retailPricePerGram / 100).toLocaleString("cs-CZ")} CZK/g`
            : "—";
          const leadDaysDisplay = variant?.orderLeadDays ? `~${variant.orderLeadDays} dní` : "—";

          return (
            <Card key={p.id}>
              <div className="flex gap-4">
                {photoArr[0] && (
                  <img src={photoArr[0]} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-ink">{p.name}</h3>
                      <div className="flex gap-3 text-xs text-muted mt-1">
                        {p.supplierCode && <span>Kód: {p.supplierCode}</span>}
                        {p.photoCode && <span>Foto: {p.photoCode}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      Smazat
                    </button>
                  </div>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-emerald-700 font-medium">{priceDisplay}</span>
                    <span className="text-amber-600">⏱ {leadDaysDisplay}</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
