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
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  note?: string | null;
  _count?: { inquiries: number; sales: number };
}

export function CustomersClient() {
  const t = useTranslations("customer");
  const tCommon = useTranslations("common");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newInstagram, setNewInstagram] = useState("");

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
    if (!newFirstName.trim() || !newLastName.trim()) return;
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: newFirstName.trim(),
        lastName: newLastName.trim(),
        email: newEmail || undefined,
        phone: newPhone || undefined,
        city: newCity || undefined,
        instagram: newInstagram || undefined,
      }),
    });
    if (res.ok) {
      const c = await res.json();
      setCustomers((prev) => [c, ...prev]);
      setShowAdd(false);
      setNewFirstName("");
      setNewLastName("");
      setNewEmail("");
      setNewPhone("");
      setNewCity("");
      setNewInstagram("");
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
          <div className="grid grid-cols-2 gap-2">
            <Input
              label={t("firstName")}
              value={newFirstName}
              onChange={(e) => setNewFirstName(e.target.value)}
            />
            <Input
              label={t("lastName")}
              value={newLastName}
              onChange={(e) => setNewLastName(e.target.value)}
            />
          </div>
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
          <Input
            label={t("city")}
            value={newCity}
            onChange={(e) => setNewCity(e.target.value)}
          />
          <Input
            label="Instagram"
            value={newInstagram}
            onChange={(e) => setNewInstagram(e.target.value)}
            placeholder="@username"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={!newFirstName.trim() || !newLastName.trim()}>
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
        <p className="text-muted">{tCommon("loading")}</p>
      ) : customers.length === 0 ? (
        <Card>
          <p className="text-muted text-center py-8">
            {t("noCustomers")}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {customers.map((c) => (
            <Link key={c.id} href={`/customers/${c.id}`}>
              <Card
                padding="sm"
                className="hover:border-rose/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{c.name}</span>
                  {c.city && <span className="text-xs text-muted">({c.city})</span>}
                  {c._count && (c._count.sales > 0 || c._count.inquiries > 0) && (
                    <span className="text-xs text-muted ml-auto">
                      {c._count.sales > 0 && `${c._count.sales} ${t("salesCount")}`}
                      {c._count.sales > 0 && c._count.inquiries > 0 && " | "}
                      {c._count.inquiries > 0 && `${c._count.inquiries} ${t("inquiryCount")}`}
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted">
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
