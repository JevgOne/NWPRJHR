"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  note?: string | null;
}

export function CustomersClient() {
  const t = useTranslations("customer");
  const tCommon = useTranslations("common");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  useEffect(() => {
    setLoading(true);
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    fetch(`/api/customers${q}`)
      .then((r) => r.json())
      .then(setCustomers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(),
        email: newEmail || undefined,
        phone: newPhone || undefined,
      }),
    });
    if (res.ok) {
      const c = await res.json();
      setCustomers((prev) => [c, ...prev]);
      setShowAdd(false);
      setNewName("");
      setNewEmail("");
      setNewPhone("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("title")}</h1>
        <Button onClick={() => setShowAdd(true)}>{t("addCustomer")}</Button>
      </div>

      <Input
        placeholder={tCommon("search")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {showAdd && (
        <Card padding="sm" className="space-y-2">
          <Input
            label={t("name")}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Input
            label={t("email")}
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            type="email"
          />
          <Input
            label={t("phone")}
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={!newName.trim()}>
              {tCommon("save")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdd(false)}
            >
              {tCommon("cancel")}
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <p className="text-gray-500">{tCommon("loading")}</p>
      ) : customers.length === 0 ? (
        <Card>
          <p className="text-gray-500 text-center py-8">
            {t("noCustomers")}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {customers.map((c) => (
            <Link key={c.id} href={`/customers/${c.id}`}>
              <Card
                padding="sm"
                className="hover:border-indigo-200 transition-colors cursor-pointer"
              >
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-gray-500">
                  {[c.email, c.phone].filter(Boolean).join(" | ") || "-"}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
