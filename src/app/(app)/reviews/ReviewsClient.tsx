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
  ratingQuality: number | null;
  ratingCommunication: number | null;
  ratingSpeed: number | null;
  text: string;
  source: "MANUAL" | "GOOGLE" | "INSTAGRAM";
  sourceUrl: string | null;
  instagramEmbed: string | null;
  featured: boolean;
  active: boolean;
  createdAt: string;
  productId: string | null;
  product: { id: string; name: string } | null;
}

interface ProductOption {
  id: string;
  name: string;
}

const RATING_EMOJIS = ["\u{1F615}", "\u{1F610}", "\u{1F642}", "\u{1F60A}", "\u{1F60D}"] as const;

function EmojiRatingPicker({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-espresso mb-1">{label}</label>
      <div className="flex items-center gap-1">
        {RATING_EMOJIS.map((emoji, i) => {
          const val = i + 1;
          return (
            <button
              key={val}
              type="button"
              onClick={() => onChange(value === val ? null : val)}
              className={`text-xl w-8 h-8 rounded-lg transition-all ${value === val ? "bg-blush-100 scale-110" : "opacity-40 hover:opacity-70"}`}
            >
              {emoji}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const SOURCE_LABELS = {
  MANUAL: "Ru\u010Dn\u00ED",
  GOOGLE: "Google",
  INSTAGRAM: "Instagram",
};

const SOURCE_COLORS = {
  MANUAL: "bg-nude-100 text-espresso",
  GOOGLE: "bg-nude-100 text-espresso",
  INSTAGRAM: "bg-pink-100 text-pink-700",
};

type FilterType = "pending" | "active" | "all";

export function ReviewsClient() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<FilterType>("pending");
  const [pendingCount, setPendingCount] = useState(0);
  const [products, setProducts] = useState<ProductOption[]>([]);

  type FormState = {
    authorName: string;
    authorPhoto: string;
    authorCity: string;
    salonName: string;
    rating: number;
    ratingQuality: number | null;
    ratingCommunication: number | null;
    ratingSpeed: number | null;
    text: string;
    source: "MANUAL" | "GOOGLE" | "INSTAGRAM";
    sourceUrl: string;
    instagramEmbed: string;
    featured: boolean;
    active: boolean;
    productId: string;
  };

  const emptyForm: FormState = {
    authorName: "",
    authorPhoto: "",
    authorCity: "",
    salonName: "",
    rating: 5,
    ratingQuality: null,
    ratingCommunication: null,
    ratingSpeed: null,
    text: "",
    source: "MANUAL",
    sourceUrl: "",
    instagramEmbed: "",
    featured: false,
    active: true,
    productId: "",
  };
  const [form, setForm] = useState<FormState>(emptyForm);

  const fetchReviews = useCallback(async (f?: FilterType) => {
    const activeFilter = f ?? filter;
    const params = activeFilter !== "all" ? `?filter=${activeFilter}` : "";
    const res = await fetch(`/api/reviews${params}`);
    if (res.ok) setReviews(await res.json());
    setLoading(false);
  }, [filter]);

  const fetchPendingCount = useCallback(async () => {
    const res = await fetch("/api/reviews?filter=pending");
    if (res.ok) {
      const data = await res.json();
      setPendingCount(data.length);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
    fetchPendingCount();
  }, [fetchReviews, fetchPendingCount]);

  useEffect(() => {
    fetch("/api/products?archived=false")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
        }
      })
      .catch(() => {});
  }, []);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleEdit = (r: Review) => {
    setForm({
      authorName: r.authorName,
      authorPhoto: r.authorPhoto ?? "",
      authorCity: r.authorCity ?? "",
      salonName: r.salonName ?? "",
      rating: r.rating,
      ratingQuality: r.ratingQuality,
      ratingCommunication: r.ratingCommunication,
      ratingSpeed: r.ratingSpeed,
      text: r.text,
      source: r.source,
      sourceUrl: r.sourceUrl ?? "",
      instagramEmbed: r.instagramEmbed ?? "",
      featured: r.featured,
      active: r.active,
      productId: r.productId ?? "",
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
      fetchPendingCount();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Opravdu smazat tuto recenzi?")) return;
    await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    fetchReviews();
    fetchPendingCount();
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
    fetchPendingCount();
  };

  const handleApprove = async (r: Review) => {
    await fetch(`/api/reviews/${r.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: true }),
    });
    fetchReviews();
    fetchPendingCount();
  };

  const handleFilterChange = (f: FilterType) => {
    setFilter(f);
    setLoading(true);
    fetchReviews(f);
  };

  if (loading) return <div className="p-4 text-muted">Na\u010D\u00EDt\u00E1n\u00ED...</div>;

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
          {showForm ? "Zav\u0159\u00EDt" : "P\u0159idat recenzi"}
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-nude-100 rounded-lg p-1">
        {([
          { key: "pending" as const, label: "Ke schv\u00E1len\u00ED", count: pendingCount },
          { key: "active" as const, label: "Aktivn\u00ED" },
          { key: "all" as const, label: "V\u0161echny" },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleFilterChange(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === tab.key
                ? "bg-white text-ink shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            {tab.label}
            {"count" in tab && tab.count != null && tab.count > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-amber-500 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {showForm && (
        <Card>
          <div className="space-y-3">
            <div className="text-sm font-semibold text-espresso">
              {editingId ? "Upravit recenzi" : "Nov\u00E1 recenze"}
            </div>

            <div>
              <label className="block text-sm font-medium text-espresso mb-1">Typ zdroje</label>
              <select
                value={form.source}
                onChange={(e) => setField("source", e.target.value as FormState["source"])}
                className="w-full border border-line rounded-lg px-3 py-2 text-sm"
              >
                <option value="MANUAL">Ru\u010Dn\u00ED zad\u00E1n\u00ED</option>
                <option value="GOOGLE">Google recenze</option>
                <option value="INSTAGRAM">Instagram</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-espresso mb-1">Produkt</label>
              <select
                value={form.productId}
                onChange={(e) => setField("productId", e.target.value)}
                className="w-full border border-line rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Obecn\u00E1 recenze (bez produktu)</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Jm\u00E9no autora *"
                value={form.authorName}
                onChange={(e) => setField("authorName", e.target.value)}
              />
              <Input
                label="M\u011Bsto"
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
              <label className="block text-sm font-medium text-espresso mb-1">
                Hodnocen\u00ED: {form.rating}/5
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setField("rating", star)}
                    className={`text-2xl ${star <= form.rating ? "text-yellow-400" : "text-gray-300"}`}
                  >
                    \u2605
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <EmojiRatingPicker
                label="\u2728 Kvalita vlas\u016F"
                value={form.ratingQuality}
                onChange={(v) => setField("ratingQuality", v)}
              />
              <EmojiRatingPicker
                label="\u{1F4AC} Komunikace"
                value={form.ratingCommunication}
                onChange={(v) => setField("ratingCommunication", v)}
              />
              <EmojiRatingPicker
                label="\u{1F4E6} Rychlost dod\u00E1n\u00ED"
                value={form.ratingSpeed}
                onChange={(v) => setField("ratingSpeed", v)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-espresso mb-1">Text recenze *</label>
              <textarea
                value={form.text}
                onChange={(e) => setField("text", e.target.value)}
                rows={3}
                className="w-full border border-line rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {form.source === "INSTAGRAM" && (
              <div>
                <label className="block text-sm font-medium text-espresso mb-1">Instagram URL</label>
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
                Zv\u00FDrazn\u011Bn\u00E1 (homepage)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setField("active", e.target.checked)}
                  className="rounded"
                />
                Aktivn\u00ED
              </label>
            </div>

            <div className="flex gap-2 pt-1">
              <Button onClick={handleSave} disabled={saving || !form.authorName || !form.text}>
                {saving ? "Ukl\u00E1d\u00E1n\u00ED..." : editingId ? "Ulo\u017Eit" : "P\u0159idat"}
              </Button>
              <Button variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>
                Zru\u0161it
              </Button>
            </div>
          </div>
        </Card>
      )}

      {reviews.length === 0 ? (
        <Card>
          <div className="text-center text-muted py-8">
            {filter === "pending"
              ? "\u017D\u00E1dn\u00E9 recenze ke schv\u00E1len\u00ED."
              : "Zat\u00EDm \u017E\u00E1dn\u00E9 recenze."}
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {reviews.map((r) => (
            <Card key={r.id}>
              {/* Pending banner */}
              {!r.active && filter !== "active" && (
                <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 -mt-1">
                  <span className="text-xs font-medium text-amber-700">
                    \u23F3 \u010Cek\u00E1 na schv\u00E1len\u00ED
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleApprove(r)}
                      className="px-2.5 py-1 text-xs font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-md transition-colors"
                    >
                      Schv\u00E1lit
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                    >
                      Zam\u00EDtnout
                    </button>
                  </div>
                </div>
              )}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {r.authorPhoto && (
                      <img src={r.authorPhoto} alt="" className="w-8 h-8 rounded-full object-cover" />
                    )}
                    <span className="font-semibold text-ink">{r.authorName}</span>
                    {r.authorCity && (
                      <span className="text-xs text-muted">{r.authorCity}</span>
                    )}
                    {r.salonName && (
                      <span className="text-xs text-muted">\u2022 {r.salonName}</span>
                    )}
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${SOURCE_COLORS[r.source]}`}>
                      {SOURCE_LABELS[r.source]}
                    </span>
                    {r.featured && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">
                        \u2605 Zv\u00FDrazn\u011Bn\u00E1
                      </span>
                    )}
                    {!r.active && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                        Skryt\u00E1
                      </span>
                    )}
                    {r.product && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
                        {r.product.name}
                      </span>
                    )}
                  </div>
                  <div className="text-yellow-400 text-sm mt-0.5">
                    {"\u2605".repeat(r.rating)}{"\u2606".repeat(5 - r.rating)}
                  </div>
                  {(r.ratingQuality || r.ratingCommunication || r.ratingSpeed) && (
                    <div className="flex gap-3 mt-1 text-xs text-muted">
                      {r.ratingQuality && <span>\u2728 {RATING_EMOJIS[r.ratingQuality - 1]}</span>}
                      {r.ratingCommunication && <span>{"\u{1F4AC}"} {RATING_EMOJIS[r.ratingCommunication - 1]}</span>}
                      {r.ratingSpeed && <span>{"\u{1F4E6}"} {RATING_EMOJIS[r.ratingSpeed - 1]}</span>}
                    </div>
                  )}
                  <p className="text-sm text-espresso mt-1 line-clamp-2">{r.text}</p>
                  {r.sourceUrl && (
                    <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-espresso hover:underline mt-1 inline-block">
                      Zdroj \u2192
                    </a>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleFeatured(r)}
                    className={`p-1.5 rounded text-sm ${r.featured ? "text-yellow-600 bg-yellow-50" : "text-muted hover:text-yellow-600"}`}
                    title={r.featured ? "Odebrat z homepage" : "Zobrazit na homepage"}
                  >
                    \u2605
                  </button>
                  <button
                    onClick={() => toggleActive(r)}
                    className={`p-1.5 rounded text-sm ${r.active ? "text-emerald-600" : "text-muted"}`}
                    title={r.active ? "Skr\u00FDt" : "Zobrazit"}
                  >
                    {r.active ? "\u{1F441}" : "\u{1F441}\u200D\u{1F5E8}"}
                  </button>
                  <button
                    onClick={() => handleEdit(r)}
                    className="p-1.5 rounded text-sm text-muted hover:text-espresso"
                  >
                    \u270F\uFE0F
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-1.5 rounded text-sm text-muted hover:text-red-600"
                  >
                    {"\u{1F5D1}"}
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
