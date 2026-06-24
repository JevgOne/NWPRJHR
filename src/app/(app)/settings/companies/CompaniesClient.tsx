"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface CompanyRow {
  id: string;
  name: string;
  ico: string;
  dic?: string;
  address: string;
  bankAccount: string;
  bankIban?: string;
  isDefault: boolean;
  active: boolean;
}

const emptyForm = {
  name: "",
  ico: "",
  dic: "",
  address: "",
  bankAccount: "",
  bankIban: "",
  bankBic: "",
  bankName: "",
  contactEmail: "",
  contactPhone: "",
};

export function CompaniesClient() {
  const t = useTranslations("company");
  const tCommon = useTranslations("common");
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then((data) => setCompanies(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleEdit = (c: CompanyRow) => {
    setEditId(c.id);
    setForm({
      name: c.name,
      ico: c.ico,
      dic: c.dic ?? "",
      address: c.address,
      bankAccount: c.bankAccount,
      bankIban: c.bankIban ?? "",
      bankBic: "",
      bankName: "",
      contactEmail: "",
      contactPhone: "",
    });
    setShowForm(true);
  };

  const handleNew = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const url = editId ? `/api/companies/${editId}` : "/api/companies";
    const method = editId ? "PUT" : "POST";

    const body: Record<string, string | undefined> = { ...form };
    if (!body.dic) delete body.dic;
    if (!body.bankIban) delete body.bankIban;
    if (!body.bankBic) delete body.bankBic;
    if (!body.bankName) delete body.bankName;
    if (!body.contactEmail) delete body.contactEmail;
    if (!body.contactPhone) delete body.contactPhone;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setShowForm(false);
      setEditId(null);
      load();
    }
    setSaving(false);
  };

  const handleSetDefault = async (id: string) => {
    await fetch(`/api/companies/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    load();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/companies/${id}`, { method: "DELETE" });
    load();
  };

  const setField = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  if (loading) return <p className="text-gray-500">{tCommon("loading")}</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("title")}</h1>
        <Button size="sm" onClick={handleNew}>
          {tCommon("add")}
        </Button>
      </div>

      {companies.map((c) => (
        <Card key={c.id} padding="sm">
          <div className="flex items-start justify-between">
            <div className="text-sm">
              <div className="font-medium">
                {c.name}
                {c.isDefault && (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                    {t("default")}
                  </span>
                )}
              </div>
              <div className="text-gray-500">
                {t("ico")}: {c.ico}
                {c.dic && ` | ${t("dic")}: ${c.dic}`}
              </div>
              <div className="text-gray-500">{c.address}</div>
              <div className="text-gray-500">
                {t("bankAccount")}: {c.bankAccount}
              </div>
              {c.bankIban && (
                <div className="text-gray-500">IBAN: {c.bankIban}</div>
              )}
            </div>
            <div className="flex gap-1">
              {!c.isDefault && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleSetDefault(c.id)}
                >
                  {t("setDefault")}
                </Button>
              )}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleEdit(c)}
              >
                {tCommon("edit")}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleDelete(c.id)}
              >
                {tCommon("delete")}
              </Button>
            </div>
          </div>
        </Card>
      ))}

      {companies.length === 0 && !showForm && (
        <Card>
          <p className="text-gray-500 text-center py-8">{t("noCompanies")}</p>
        </Card>
      )}

      {showForm && (
        <Card>
          <h3 className="font-medium text-sm mb-3">
            {editId ? tCommon("edit") : tCommon("add")}
          </h3>
          <div className="space-y-2">
            <Input
              label={t("name")}
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
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
              label={t("address")}
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label={t("bankAccount")}
                value={form.bankAccount}
                onChange={(e) => setField("bankAccount", e.target.value)}
              />
              <Input
                label="IBAN"
                value={form.bankIban}
                onChange={(e) => setField("bankIban", e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {tCommon("save")}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditId(null);
                }}
              >
                {tCommon("cancel")}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
