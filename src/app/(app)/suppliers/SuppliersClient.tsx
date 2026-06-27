"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  deliveryCount: number;
}

export function SuppliersClient({
  suppliers: initialSuppliers,
}: {
  suppliers: Supplier[];
}) {
  const t = useTranslations("supplier");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [suppliers] = useState(initialSuppliers);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setName("");
    setContactName("");
    setEmail("");
    setPhone("");
    setCountry("");
    setEditId(null);
    setShowForm(false);
  }

  function startEdit(s: Supplier) {
    setName(s.name);
    setContactName(s.contactName ?? "");
    setEmail(s.email ?? "");
    setPhone(s.phone ?? "");
    setCountry(s.country ?? "");
    setEditId(s.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const body = {
      name,
      ...(contactName ? { contactName } : {}),
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      ...(country ? { country } : {}),
    };

    const url = editId ? `/api/suppliers/${editId}` : "/api/suppliers";
    const method = editId ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSubmitting(false);
    resetForm();
    router.refresh();
  }

  async function handleArchive(id: string) {
    if (!confirm(t("confirmArchive"))) return;
    await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)}>
          {t("addSupplier")}
        </Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <h3 className="font-medium text-ink">
              {editId ? t("editSupplier") : t("addSupplier")}
            </h3>
            <Input
              label={t("name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label={t("contactName")}
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t("email")}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                label={t("phone")}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <Input
              label={t("country")}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
            <div className="flex gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? tCommon("loading") : tCommon("save")}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>
                {tCommon("cancel")}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card padding="sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th className="py-3 px-2 font-medium">{t("name")}</th>
                <th className="py-3 px-2 font-medium">{t("contactName")}</th>
                <th className="py-3 px-2 font-medium">{t("email")}</th>
                <th className="py-3 px-2 font-medium">{t("phone")}</th>
                <th className="py-3 px-2 font-medium">{t("country")}</th>
                <th className="py-3 px-2 font-medium text-right">{t("deliveryCount")}</th>
                <th className="py-3 px-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted">
                    {t("noSuppliers")}
                  </td>
                </tr>
              ) : (
                suppliers.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-gray-100 hover:bg-nude-50"
                  >
                    <td className="py-3 px-2 font-medium text-ink">
                      {s.name}
                    </td>
                    <td className="py-3 px-2 text-gray-600">
                      {s.contactName ?? "-"}
                    </td>
                    <td className="py-3 px-2 text-gray-600">{s.email ?? "-"}</td>
                    <td className="py-3 px-2 text-gray-600">{s.phone ?? "-"}</td>
                    <td className="py-3 px-2 text-gray-600">
                      {s.country ?? "-"}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-600">
                      {s.deliveryCount}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(s)}
                        >
                          {tCommon("edit")}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleArchive(s.id)}
                        >
                          {t("archive")}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
