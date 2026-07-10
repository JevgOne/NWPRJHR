"use client";

import { useState, useEffect } from "react";
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

        <div className="space-y-3">
          {photos.map((url, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="shrink-0">
                {url ? (
                  <img
                    src={url}
                    alt={`Instagram ${i + 1}`}
                    className="w-16 h-16 object-cover rounded-lg border border-line"
                  />
                ) : (
                  <div className="w-16 h-16 bg-nude-50 rounded-lg border border-line flex items-center justify-center text-xs text-muted">
                    ?
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-espresso mb-1">
                  Fotka {i + 1}
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    const updated = [...photos];
                    updated[i] = e.target.value;
                    setPhotos(updated);
                  }}
                  placeholder="https://..."
                  className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose focus:border-rose"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
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
