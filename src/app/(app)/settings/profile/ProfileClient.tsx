"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Majitel",
  EMPLOYEE: "Zaměstnanec",
  SALON: "Salon",
  HAIRDRESSER: "Kadeřnice",
};

export function ProfileClient() {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const tRoles = useTranslations("roles");

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data: UserProfile) => {
        setProfile(data);
        setName(data.name ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setMessage(null);
    setSaving(true);

    const payload: Record<string, string> = {};
    if (name !== (profile?.name ?? "")) {
      payload.name = name;
    }
    if (currentPassword || newPassword || confirmPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
      payload.confirmPassword = confirmPassword;
    }

    if (Object.keys(payload).length === 0) {
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? tCommon("error") });
      } else {
        setProfile(data);
        setName(data.name ?? "");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setMessage({ type: "success", text: t("saved") });
      }
    } catch {
      setMessage({ type: "error", text: tCommon("error") });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-muted">{tCommon("loading")}</p>;
  if (!profile) return <p className="text-muted">{tCommon("error")}</p>;

  const roleKey = profile.role.toLowerCase();

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-ink mb-6">{t("title")}</h1>

      {message && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <Card className="mb-6">
        <div className="space-y-4">
          <Input
            id="name"
            label={t("name")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            id="email"
            label={t("email")}
            value={profile.email}
            disabled
            className="bg-nude-50 text-muted cursor-not-allowed"
          />

          <div>
            <label className="block text-sm font-medium text-espresso mb-1">
              {t("role")}
            </label>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-nude-100 text-espresso">
              {tRoles(roleKey)}
            </span>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-ink mb-4">{t("changePassword")}</h2>
        <div className="space-y-4">
          <Input
            id="currentPassword"
            label={t("currentPassword")}
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />

          <Input
            id="newPassword"
            label={t("newPassword")}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />

          <Input
            id="confirmPassword"
            label={t("confirmNewPassword")}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />

          <p className="text-xs text-muted">{t("passwordHint")}</p>
        </div>
      </Card>

      <div className="mt-6">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? tCommon("saving") : tCommon("save")}
        </Button>
      </div>
    </div>
  );
}
