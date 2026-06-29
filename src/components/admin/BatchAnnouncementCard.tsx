"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface AnnouncementData {
  id: string;
  arrivalDate: string;
  availableDate: string;
  description: string | null;
}

export function BatchAnnouncementCard() {
  const [announcement, setAnnouncement] = useState<AnnouncementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [arrivalDate, setArrivalDate] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetch("/api/batch-announcement")
      .then((r) => r.json())
      .then((data) => {
        setAnnouncement(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!arrivalDate) return;
    setSaving(true);
    const res = await fetch("/api/batch-announcement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ arrivalDate, description: description || null }),
    });
    if (res.ok) {
      const saved = await res.json();
      const avail = new Date(saved.arrivalDate);
      avail.setHours(avail.getHours() + 24);
      setAnnouncement({
        id: saved.id,
        arrivalDate: saved.arrivalDate,
        availableDate: avail.toISOString(),
        description: saved.description,
      });
      setShowForm(false);
      setArrivalDate("");
      setDescription("");
    }
    setSaving(false);
  };

  const handleDeactivate = async () => {
    await fetch("/api/batch-announcement", { method: "DELETE" });
    setAnnouncement(null);
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("cs-CZ", {
      weekday: "short",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) return null;

  return (
    <div className="bg-white rounded-xl border border-line shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-ink">
          Příchod nové várky
        </h2>
        {announcement && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            Aktivní
          </span>
        )}
      </div>

      {announcement && !showForm ? (
        <div className="space-y-2">
          <div className="bg-nude-50 rounded-lg p-3">
            <p className="text-sm text-espresso">
              <span className="font-medium">Příjezd:</span>{" "}
              {fmtDate(announcement.arrivalDate)}
            </p>
            <p className="text-sm text-espresso">
              <span className="font-medium">Naskladněno do:</span>{" "}
              {fmtDate(announcement.availableDate)}
            </p>
            {announcement.description && (
              <p className="text-sm text-muted mt-1">
                {announcement.description}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setArrivalDate(
                  new Date(announcement.arrivalDate)
                    .toISOString()
                    .slice(0, 16)
                );
                setDescription(announcement.description ?? "");
                setShowForm(true);
              }}
            >
              Upravit
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDeactivate}>
              Zrušit
            </Button>
          </div>
        </div>
      ) : showForm ? (
        <div className="space-y-3">
          <Input
            label="Datum příjezdu várky"
            type="datetime-local"
            value={arrivalDate}
            onChange={(e) => setArrivalDate(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-espresso mb-1">
              Popis (volitelné)
            </label>
            <textarea
              className="block w-full rounded-lg border border-line px-3 py-2 text-sm"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Např. Panenské vlasy 40-60cm, rovné, nové odstíny"
            />
          </div>
          <p className="text-xs text-muted">
            Na webu se zobrazí datum příjezdu + 24h na naskladnění.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving || !arrivalDate}>
              {saving ? "Ukládám..." : "Uložit"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowForm(false)}
            >
              Zrušit
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm text-muted mb-3">
            Žádná aktivní várka. Nastav datum příjezdu a na e-shopu se zobrazí
            popup.
          </p>
          <Button size="sm" onClick={() => setShowForm(true)}>
            Nastavit várku
          </Button>
        </div>
      )}
    </div>
  );
}
