"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Image from "next/image";

interface Transformation {
  id: string;
  title: string;
  titleUk: string | null;
  titleRu: string | null;
  description: string | null;
  descriptionUk: string | null;
  descriptionRu: string | null;
  photoBefore: string;
  photoAfter: string;
  processingType: string;
  lengthCm: number | null;
  weightGrams: number | null;
  hairOrigin: string | null;
  stylistName: string | null;
  clientConsent: boolean;
  featured: boolean;
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

const PROCESSING_LABELS: Record<string, string> = {
  CLIP_IN: "Clip-in",
  TAPE_IN: "Tape-in",
  KERATIN: "Keratin",
  WEFT: "Tresy",
  MICRO_RING: "Micro ring",
  BANGS: "Ofiny",
  OTHER: "Ostatni",
};

type FormState = {
  title: string;
  titleUk: string;
  titleRu: string;
  description: string;
  descriptionUk: string;
  descriptionRu: string;
  photoBefore: string;
  photoAfter: string;
  processingType: string;
  lengthCm: string;
  weightGrams: string;
  hairOrigin: string;
  stylistName: string;
  clientConsent: boolean;
  featured: boolean;
  active: boolean;
  sortOrder: string;
};

const emptyForm: FormState = {
  title: "",
  titleUk: "",
  titleRu: "",
  description: "",
  descriptionUk: "",
  descriptionRu: "",
  photoBefore: "",
  photoAfter: "",
  processingType: "CLIP_IN",
  lengthCm: "",
  weightGrams: "",
  hairOrigin: "",
  stylistName: "",
  clientConsent: true,
  featured: false,
  active: true,
  sortOrder: "0",
};

export function TransformationsClient() {
  const [items, setItems] = useState<Transformation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);
  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);

  const fetchItems = useCallback(async () => {
    const res = await fetch("/api/transformations");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleEdit = (t: Transformation) => {
    setForm({
      title: t.title,
      titleUk: t.titleUk ?? "",
      titleRu: t.titleRu ?? "",
      description: t.description ?? "",
      descriptionUk: t.descriptionUk ?? "",
      descriptionRu: t.descriptionRu ?? "",
      photoBefore: t.photoBefore,
      photoAfter: t.photoAfter,
      processingType: t.processingType,
      lengthCm: t.lengthCm?.toString() ?? "",
      weightGrams: t.weightGrams?.toString() ?? "",
      hairOrigin: t.hairOrigin ?? "",
      stylistName: t.stylistName ?? "",
      clientConsent: t.clientConsent,
      featured: t.featured,
      active: t.active,
      sortOrder: t.sortOrder.toString(),
    });
    setEditingId(t.id);
    setShowForm(true);
  };

  const uploadPhoto = async (file: File, target: "before" | "after") => {
    const setter = target === "before" ? setUploadingBefore : setUploadingAfter;
    setter(true);
    try {
      const formData = new FormData();
      formData.append("files", file);
      const res = await fetch("/api/upload/photos", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        const url = data.urls?.[0] ?? data.url;
        if (url) setField(target === "before" ? "photoBefore" : "photoAfter", url);
      }
    } finally {
      setter(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.photoBefore || !form.photoAfter) return;
    setSaving(true);

    const payload = {
      title: form.title,
      titleUk: form.titleUk || undefined,
      titleRu: form.titleRu || undefined,
      description: form.description || undefined,
      descriptionUk: form.descriptionUk || undefined,
      descriptionRu: form.descriptionRu || undefined,
      photoBefore: form.photoBefore,
      photoAfter: form.photoAfter,
      processingType: form.processingType,
      lengthCm: form.lengthCm ? parseInt(form.lengthCm) : undefined,
      weightGrams: form.weightGrams ? parseInt(form.weightGrams) : undefined,
      hairOrigin: form.hairOrigin || undefined,
      stylistName: form.stylistName || undefined,
      clientConsent: form.clientConsent,
      featured: form.featured,
      active: form.active,
      sortOrder: parseInt(form.sortOrder) || 0,
    };

    const url = editingId ? `/api/transformations/${editingId}` : "/api/transformations";
    const method = editingId ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    fetchItems();
  };

  const toggleField = async (id: string, field: "active" | "featured", value: boolean) => {
    await fetch(`/api/transformations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Opravdu smazat tuto promenu?")) return;
    await fetch(`/api/transformations/${id}`, { method: "DELETE" });
    fetchItems();
  };

  if (loading) return <div className="animate-pulse h-48 bg-nude-100 rounded-xl" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-espresso">Promeny ({items.length})</h1>
        <Button
          onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(!showForm); }}
        >
          {showForm ? "Zrusit" : "+ Nova promena"}
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-espresso">
            {editingId ? "Upravit promenu" : "Nova promena"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Nazev (CS)" value={form.title} onChange={(e) => setField("title", e.target.value)} />
            <Input label="Nazev (UK)" value={form.titleUk} onChange={(e) => setField("titleUk", e.target.value)} />
            <Input label="Nazev (RU)" value={form.titleRu} onChange={(e) => setField("titleRu", e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-espresso mb-1">Popis (CS)</label>
              <textarea className="w-full border border-line rounded-lg px-3 py-2 text-sm" rows={3} value={form.description} onChange={(e) => setField("description", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-espresso mb-1">Popis (UK)</label>
              <textarea className="w-full border border-line rounded-lg px-3 py-2 text-sm" rows={3} value={form.descriptionUk} onChange={(e) => setField("descriptionUk", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-espresso mb-1">Popis (RU)</label>
              <textarea className="w-full border border-line rounded-lg px-3 py-2 text-sm" rows={3} value={form.descriptionRu} onChange={(e) => setField("descriptionRu", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-espresso mb-1">Foto PRED</label>
              <div className="flex items-center gap-2">
                <Input value={form.photoBefore} onChange={(e) => setField("photoBefore", e.target.value)} placeholder="URL nebo nahrat..." className="flex-1" />
                <input ref={beforeRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0], "before")} />
                <Button variant="secondary" size="sm" onClick={() => beforeRef.current?.click()} disabled={uploadingBefore}>
                  {uploadingBefore ? "..." : "Nahrat"}
                </Button>
              </div>
              {form.photoBefore && (
                <div className="mt-2 relative w-24 h-24 rounded-lg overflow-hidden border border-line">
                  <Image src={form.photoBefore} alt="Pred" fill className="object-cover" sizes="96px" />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-espresso mb-1">Foto PO</label>
              <div className="flex items-center gap-2">
                <Input value={form.photoAfter} onChange={(e) => setField("photoAfter", e.target.value)} placeholder="URL nebo nahrat..." className="flex-1" />
                <input ref={afterRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0], "after")} />
                <Button variant="secondary" size="sm" onClick={() => afterRef.current?.click()} disabled={uploadingAfter}>
                  {uploadingAfter ? "..." : "Nahrat"}
                </Button>
              </div>
              {form.photoAfter && (
                <div className="mt-2 relative w-24 h-24 rounded-lg overflow-hidden border border-line">
                  <Image src={form.photoAfter} alt="Po" fill className="object-cover" sizes="96px" />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-espresso mb-1">Metoda</label>
              <select className="w-full border border-line rounded-lg px-3 py-2 text-sm" value={form.processingType} onChange={(e) => setField("processingType", e.target.value)}>
                {Object.entries(PROCESSING_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <Input label="Delka (cm)" type="number" value={form.lengthCm} onChange={(e) => setField("lengthCm", e.target.value)} />
            <Input label="Gramaz (g)" type="number" value={form.weightGrams} onChange={(e) => setField("weightGrams", e.target.value)} />
            <Input label="Puvod vlasu" value={form.hairOrigin} onChange={(e) => setField("hairOrigin", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input label="Kadernice" value={form.stylistName} onChange={(e) => setField("stylistName", e.target.value)} />
            <Input label="Poradi" type="number" value={form.sortOrder} onChange={(e) => setField("sortOrder", e.target.value)} />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.clientConsent} onChange={(e) => setField("clientConsent", e.target.checked)} />
              Souhlas klientky
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.featured} onChange={(e) => setField("featured", e.target.checked)} />
              Zvyraznene
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.active} onChange={(e) => setField("active", e.target.checked)} />
              Aktivni
            </label>
          </div>

          <Button onClick={handleSubmit} disabled={saving || !form.title || !form.photoBefore || !form.photoAfter}>
            {saving ? "Ukladam..." : editingId ? "Ulozit zmeny" : "Vytvorit"}
          </Button>
        </Card>
      )}

      {items.length === 0 ? (
        <Card className="p-8 text-center text-muted">
          Zadne promeny. Kliknete na &quot;+ Nova promena&quot; pro pridani.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <Card key={item.id} className={`p-4 ${!item.active ? "opacity-50" : ""}`}>
              <div className="flex gap-3">
                <div className="flex gap-1 flex-shrink-0">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-line">
                    <Image src={item.photoBefore} alt="Pred" fill className="object-cover" sizes="80px" />
                    <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5">Pred</span>
                  </div>
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-line">
                    <Image src={item.photoAfter} alt="Po" fill className="object-cover" sizes="80px" />
                    <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5">Po</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-espresso truncate">{item.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-nude-100 rounded-full text-espresso">
                          {PROCESSING_LABELS[item.processingType] ?? item.processingType}
                        </span>
                        {item.lengthCm && <span className="text-xs text-muted">{item.lengthCm} cm</span>}
                        {item.weightGrams && <span className="text-xs text-muted">{item.weightGrams}g</span>}
                        {item.featured && <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">Featured</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => toggleField(item.id, "active", !item.active)} className="text-xs text-muted hover:text-espresso">
                      {item.active ? "Deaktivovat" : "Aktivovat"}
                    </button>
                    <button onClick={() => toggleField(item.id, "featured", !item.featured)} className="text-xs text-muted hover:text-espresso">
                      {item.featured ? "Odebrat featured" : "Featured"}
                    </button>
                    <button onClick={() => handleEdit(item)} className="text-xs text-rose hover:text-rose-deep">
                      Upravit
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-xs text-red-500 hover:text-red-700">
                      Smazat
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
