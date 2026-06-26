"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Review {
  id: string;
  authorName: string;
  authorPhoto: string | null;
  authorCity: string | null;
  salonName: string | null;
  rating: number;
  text: string;
  source: "MANUAL" | "GOOGLE" | "INSTAGRAM";
  sourceUrl: string | null;
  instagramEmbed: string | null;
  featured: boolean;
  active: boolean;
  createdAt: string;
}

const SOURCE_LABELS = {
  MANUAL: "Ruční",
  GOOGLE: "Google",
  INSTAGRAM: "Instagram",
};

const SOURCE_COLORS = {
  MANUAL: "bg-gray-100 text-gray-700",
  GOOGLE: "bg-blue-100 text-blue-700",
  INSTAGRAM: "bg-pink-100 text-pink-700",
};

export function ReviewsClient() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  type FormState = {
    authorName: string;
    authorPhoto: string;
    authorCity: string;
    salonName: string;
    rating: number;
    text: string;
    source: "MANUAL" | "GOOGLE" | "INSTAGRAM";
    sourceUrl: string;
    instagramEmbed: string;
    featured: boolean;
    active: boolean;
  };

  const emptyForm: FormState = {
    authorName: "",
    authorPhoto: "",
    authorCity: "",
    salonName: "",
    rating: 5,
    text: "",
    source: "MANUAL",
    sourceUrl: "",
    instagramEmbed: "",
    featured: false,
    active: true,
  };
  const [form, setForm] = useState<FormState>(emptyForm);

  const fetchReviews = useCallback(async () => {
    const res = await fetch("/api/reviews");
    if (res.ok) setReviews(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleEdit = (r: Review) => {
    setForm({
      authorName: r.authorName,
      authorPhoto: r.authorPhoto ?? "",
      authorCity: r.authorCity ?? "",
      salonName: r.salonName ?? "",
      rating: r.rating,
      text: r.text,
      source: r.source,
      sourceUrl: r.sourceUrl ?? "",
      instagramEmbed: r.instagramEmbed ?? "",
      featured: r.featured,
      active: r.active,
    });
    setEditingId(r.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const url = editingId ? `/api/reviews/${editingId}` : "/api/reviews";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      fetchReviews();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Opravdu smazat tuto recenzi?")) return;
    await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    fetchReviews();
  };

  const toggleFeatured = async (r: Review) => {
    await fetch(`/api/reviews/${r.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: !r.featured }),
    });
    fetchReviews();
  };

  const toggleActive = async (r: Review) => {
    await fetch(`/api/reviews/${r.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !r.active }),
    });
    fetchReviews();
  };

  if (loading) return <div className="p-4 text-gray-500">Načítání...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Recenze ({reviews.length})</h1>
        <Button
          onClick={() => {
            setForm(emptyForm);
            setEditingId(null);
            setShowForm(!showForm);
          }}
        >
          {showForm ? "Zavřít" : "Přidat recenzi"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-700">
              {editingId ? "Upravit recenzi" : "Nová recenze"}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Typ zdroje</label>
              <select
                value={form.source}
                onChange={(e) => setField("source", e.target.value as FormState["source"])}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="MANUAL">Ruční zadání</option>
                <option value="GOOGLE">Google recenze</option>
                <option value="INSTAGRAM">Instagram</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Jméno autora *"
                value={form.authorName}
                onChange={(e) => setField("authorName", e.target.value)}
              />
              <Input
                label="Město"
                value={form.authorCity}
                onChange={(e) => setField("authorCity", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Salon"
                value={form.salonName}
                onChange={(e) => setField("salonName", e.target.value)}
              />
              <Input
                label="Foto URL"
                value={form.authorPhoto}
                onChange={(e) => setField("authorPhoto", e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hodnocení: {form.rating}/5
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setField("rating", star)}
                    className={`text-2xl ${star <= form.rating ? "text-yellow-400" : "text-gray-300"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Text recenze *</label>
              <textarea
                value={form.text}
                onChange={(e) => setField("text", e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {form.source === "INSTAGRAM" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
                <Input
                  value={form.sourceUrl}
                  onChange={(e) => setField("sourceUrl", e.target.value)}
                  placeholder="https://www.instagram.com/p/..."
                />
              </div>
            )}

            {form.source === "GOOGLE" && (
              <Input
                label="Google Maps odkaz"
                value={form.sourceUrl}
                onChange={(e) => setField("sourceUrl", e.target.value)}
                placeholder="https://g.co/kgs/..."
              />
            )}

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setField("featured", e.target.checked)}
                  className="rounded"
                />
                Zvýrazněná (homepage)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setField("active", e.target.checked)}
                  className="rounded"
                />
                Aktivní
              </label>
            </div>

            <div className="flex gap-2 pt-1">
              <Button onClick={handleSave} disabled={saving || !form.authorName || !form.text}>
                {saving ? "Ukládání..." : editingId ? "Uložit" : "Přidat"}
              </Button>
              <Button variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>
                Zrušit
              </Button>
            </div>
          </div>
        </Card>
      )}

      {reviews.length === 0 ? (
        <Card>
          <div className="text-center text-gray-500 py-8">
            Zatím žádné recenze. Přidejte první!
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {reviews.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {r.authorPhoto && (
                      <img src={r.authorPhoto} alt="" className="w-8 h-8 rounded-full object-cover" />
                    )}
                    <span className="font-semibold text-gray-900">{r.authorName}</span>
                    {r.authorCity && (
                      <span className="text-xs text-gray-500">{r.authorCity}</span>
                    )}
                    {r.salonName && (
                      <span className="text-xs text-gray-500">• {r.salonName}</span>
                    )}
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${SOURCE_COLORS[r.source]}`}>
                      {SOURCE_LABELS[r.source]}
                    </span>
                    {r.featured && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">
                        ★ Zvýrazněná
                      </span>
                    )}
                    {!r.active && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                        Skrytá
                      </span>
                    )}
                  </div>
                  <div className="text-yellow-400 text-sm mt-0.5">
                    {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                  </div>
                  <p className="text-sm text-gray-700 mt-1 line-clamp-2">{r.text}</p>
                  {r.sourceUrl && (
                    <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline mt-1 inline-block">
                      Zdroj →
                    </a>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleFeatured(r)}
                    className={`p-1.5 rounded text-sm ${r.featured ? "text-yellow-600 bg-yellow-50" : "text-gray-400 hover:text-yellow-600"}`}
                    title={r.featured ? "Odebrat z homepage" : "Zobrazit na homepage"}
                  >
                    ★
                  </button>
                  <button
                    onClick={() => toggleActive(r)}
                    className={`p-1.5 rounded text-sm ${r.active ? "text-emerald-600" : "text-gray-400"}`}
                    title={r.active ? "Skrýt" : "Zobrazit"}
                  >
                    {r.active ? "👁" : "👁‍🗨"}
                  </button>
                  <button
                    onClick={() => handleEdit(r)}
                    className="p-1.5 rounded text-sm text-gray-400 hover:text-indigo-600"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-1.5 rounded text-sm text-gray-400 hover:text-red-600"
                  >
                    🗑
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
