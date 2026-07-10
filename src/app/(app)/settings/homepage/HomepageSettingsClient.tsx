"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const DEFAULT_PHOTOS = [
  "https://usxv0mh0wvr3gzdk.public.blob.vercel-storage.com/hair/volne-vlasy.jpg",
  "https://usxv0mh0wvr3gzdk.public.blob.vercel-storage.com/hair/odstiny-prehled.jpg",
  "https://usxv0mh0wvr3gzdk.public.blob.vercel-storage.com/hair/extensions-techniky.jpg",
  "https://usxv0mh0wvr3gzdk.public.blob.vercel-storage.com/hair/keratinove-vlasy.jpg",
];

const SETTING_KEY = "instagram_photos";

export function HomepageSettingsClient() {
  const [photos, setPhotos] = useState<string[]>(DEFAULT_PHOTOS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    fetch(`/api/site-settings?key=${SETTING_KEY}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.value) {
          try {
            const parsed = JSON.parse(data.value);
            if (Array.isArray(parsed) && parsed.length === 4) {
              setPhotos(parsed);
            }
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async (index: number, file: File) => {
    setUploading(index);
    setError("");
    try {
      const formData = new FormData();
      formData.append("files", file);
      const res = await fetch("/api/upload/photos", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload selhal" }));
        setError(err.error || "Upload selhal");
        return;
      }
      const data = await res.json();
      const url = data.photoUrls?.[0];
      if (url) {
        const updated = [...photos];
        updated[index] = url;
        setPhotos(updated);
      }
    } catch {
      setError("Upload selhal");
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await fetch("/api/site-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: SETTING_KEY, value: JSON.stringify(photos) }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <p className="text-muted">Načítání...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Nastavení homepage</h1>
      <p className="text-sm text-muted">Správa obsahu zobrazovaného na hlavní stránce.</p>

      <Card>
        <h2 className="text-sm font-semibold text-espresso mb-3">Instagram fotky</h2>
        <p className="text-xs text-muted mb-4">4 fotky zobrazené v sekci &quot;Sledujte nás na Instagramu&quot; na homepage.</p>

        {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {photos.map((url, i) => (
            <div key={i} className="space-y-2">
              <div
                className="relative aspect-square rounded-xl overflow-hidden border-2 border-dashed border-line hover:border-rose cursor-pointer transition-colors group"
                onClick={() => uploading === null && inputRefs.current[i]?.click()}
              >
                {url ? (
                  <img
                    src={url}
                    alt={`Instagram ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-nude-50 flex items-center justify-center">
                    <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                )}
                {uploading === i && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <span className="text-xs text-muted">Nahrávám...</span>
                  </div>
                )}
                {uploading !== i && url && (
                  <div className="absolute inset-0 bg-espresso/0 group-hover:bg-espresso/40 transition-colors flex items-center justify-center">
                    <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                )}
                <input
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(i, file);
                    e.target.value = "";
                  }}
                  disabled={uploading !== null}
                />
              </div>
              <p className="text-xs text-center text-muted">Fotka {i + 1}</p>
            </div>
          ))}
        </div>

        <div className="pt-4 flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving || uploading !== null}>
            {saving ? "Ukládám..." : "Uložit"}
          </Button>
          {saved && (
            <span className="text-sm text-green-600">Uloženo!</span>
          )}
        </div>
      </Card>
    </div>
  );
}
