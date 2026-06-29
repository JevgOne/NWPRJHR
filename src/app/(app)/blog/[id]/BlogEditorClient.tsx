"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface BlogEditorProps {
  postId?: string;
}

const CATEGORIES = [
  { value: "general", label: "Obecné" },
  { value: "care", label: "Péče o vlasy" },
  { value: "guide", label: "Průvodce" },
  { value: "trends", label: "Trendy" },
  { value: "tips", label: "Tipy" },
  { value: "news", label: "Novinky" },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function BlogEditorClient({ postId }: BlogEditorProps) {
  const router = useRouter();
  const isNew = !postId;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [category, setCategory] = useState("general");
  const [published, setPublished] = useState(false);
  const [publishedAt, setPublishedAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!postId) return;
    fetch(`/api/blog/${postId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((post) => {
        setTitle(post.title);
        setSlug(post.slug);
        setSlugManual(true);
        setExcerpt(post.excerpt ?? "");
        setContent(post.content ?? "");
        setCoverImage(post.coverImage ?? "");
        setCategory(post.category);
        setPublished(post.published);
        setPublishedAt(
          post.publishedAt
            ? new Date(post.publishedAt).toISOString().split("T")[0]
            : ""
        );
        setLoading(false);
      })
      .catch(() => {
        setError("Článek nenalezen");
        setLoading(false);
      });
  }, [postId]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugManual) setSlug(slugify(val));
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("files", file);
    const res = await fetch("/api/upload/photos", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      const url = data.photoUrls?.[0] ?? data.urls?.[0];
      if (url) setCoverImage(url);
    }
    setUploading(false);
  };

  const save = async (pub?: boolean) => {
    setSaving(true);
    setError("");

    const shouldPublish = pub !== undefined ? pub : published;
    const payload = {
      title,
      slug,
      excerpt: excerpt || undefined,
      content,
      coverImage: coverImage || undefined,
      category,
      published: shouldPublish,
      publishedAt: publishedAt || undefined,
    };

    const url = isNew ? "/api/blog" : `/api/blog/${postId}`;
    const method = isNew ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push("/blog");
      router.refresh();
    } else {
      const data = await res.json();
      setError(
        typeof data.error === "string"
          ? data.error
          : "Chyba při ukládání"
      );
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="text-muted text-center py-12">Načítám...</div>;
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink">
          {isNew ? "Nový článek" : "Upravit článek"}
        </h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push("/blog")}>
            Zpět
          </Button>
          <Button variant="secondary" onClick={() => save(false)} disabled={saving}>
            Uložit koncept
          </Button>
          <Button onClick={() => save(true)} disabled={saving}>
            {saving ? "Ukládám..." : published ? "Uložit" : "Publikovat"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <Card>
          <div className="space-y-4">
            <Input
              label="Název článku"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Jak správně pečovat o prodloužené vlasy"
            />

            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  label="Slug (URL)"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setSlugManual(true);
                  }}
                  placeholder="jak-pecovat-o-vlasy"
                />
                <p className="text-xs text-muted mt-1">
                  /blog/{slug || "..."}
                </p>
              </div>
              <div className="w-48">
                <label className="block text-sm font-medium text-espresso mb-1">
                  Kategorie
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="block w-full rounded-lg border border-line px-3 py-2 text-ink sm:text-sm focus:border-rose focus:outline-none focus:ring-1 focus:ring-rose"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-48">
                <Input
                  label="Datum publikace"
                  type="date"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-espresso mb-1">
                Náhledový obrázek
              </label>
              <div className="flex items-center gap-4">
                {coverImage && (
                  <img
                    src={coverImage}
                    alt="Cover"
                    className="w-32 h-20 object-cover rounded-lg border border-line"
                  />
                )}
                <label className="cursor-pointer px-4 py-2 bg-nude-50 border border-line rounded-lg text-sm font-medium text-espresso hover:bg-nude-100 transition-colors">
                  {uploading ? "Nahrávám..." : coverImage ? "Změnit" : "Nahrát obrázek"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                </label>
                {coverImage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCoverImage("")}
                  >
                    Odebrat
                  </Button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-espresso mb-1">
                Popis (excerpt)
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={2}
                className="block w-full rounded-lg border border-line px-3 py-2 text-ink placeholder-muted focus:border-rose focus:outline-none focus:ring-1 focus:ring-rose sm:text-sm"
                placeholder="Krátký popis pro náhled v seznamu článků a pro SEO..."
              />
            </div>
          </div>
        </Card>

        <Card>
          <div>
            <label className="block text-sm font-medium text-espresso mb-1">
              Obsah článku
            </label>
            <p className="text-xs text-muted mb-2">
              Podporuje Markdown: **tučné**, *kurzíva*, ## nadpisy, - seznamy, [odkaz](url)
            </p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={20}
              className="block w-full rounded-lg border border-line px-3 py-2 text-ink font-mono text-sm placeholder-muted focus:border-rose focus:outline-none focus:ring-1 focus:ring-rose"
              placeholder={"## Jak správně pečovat o prodloužené vlasy\n\nProdloužené vlasy vyžadují speciální péči..."}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
