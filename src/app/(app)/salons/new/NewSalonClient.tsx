"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function NewSalonClient() {
  const t = useTranslations("salon");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    ico: "",
    dic: "",
    contactPerson: "",
    phone: "",
    email: "",
    city: "",
    address: "",
    language: "cs",
  });

  const setField = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    const body: Record<string, string | undefined> = { ...form };
    if (!body.ico) delete body.ico;
    if (!body.dic) delete body.dic;
    if (!body.contactPerson) delete body.contactPerson;
    if (!body.phone) delete body.phone;
    if (!body.email) delete body.email;
    if (!body.city) delete body.city;
    if (!body.address) delete body.address;

    const res = await fetch("/api/salons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const salon = await res.json();
      router.push(`/salons/${salon.id}`);
    }
    setSaving(false);
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold">{t("newSalon")}</h1>

      <Card>
        <div className="space-y-3">
          <Input
            label={t("salon")}
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("ico")}
              value={form.ico}
              onChange={(e) => setField("ico", e.target.value)}
            />
            <Input
              label={t("dic")}
              value={form.dic}
              onChange={(e) => setField("dic", e.target.value)}
            />
          </div>
          <Input
            label={t("contactPerson")}
            value={form.contactPerson}
            onChange={(e) => setField("contactPerson", e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("email")}
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
            />
            <Input
              label={t("phone")}
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("address")}
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
            />
            <Input
              label={t("city")}
              value={form.city}
              onChange={(e) => setField("city", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-espresso mb-1">
              {t("language")}
            </label>
            <select
              value={form.language}
              onChange={(e) => setField("language", e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm"
            >
              <option value="cs">{t("czech")}</option>
              <option value="uk">{t("ukrainian")}</option>
              <option value="ru">{t("russian")}</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving || !form.name}>
              {tCommon("save")}
            </Button>
            <Button variant="secondary" onClick={() => router.push("/salons")}>
              {tCommon("cancel")}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
