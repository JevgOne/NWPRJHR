"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface CustomerDetail {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  note?: string | null;
  totalSpent: number;
  salesCount: number;
  sales: {
    id: string;
    saleNumber?: string;
    totalAmount: number;
    completedAt: string;
  }[];
}

function formatCZK(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function CustomerDetailClient({ id }: { id: string }) {
  const t = useTranslations("customer");
  const tSale = useTranslations("sale");
  const tCommon = useTranslations("common");
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setCustomer(data);
        setEditName(data.name);
        setEditEmail(data.email || "");
        setEditPhone(data.phone || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    const res = await fetch(`/api/customers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName.trim(),
        email: editEmail || undefined,
        phone: editPhone || undefined,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCustomer((prev) => (prev ? { ...prev, ...updated } : prev));
      setEditing(false);
    }
  };

  if (loading) return <p className="text-gray-500">{tCommon("loading")}</p>;
  if (!customer) return <p className="text-red-500">{tCommon("error")}</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{customer.name}</h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditing(!editing)}
          >
            {tCommon("edit")}
          </Button>
          <Link href="/customers">
            <Button variant="ghost" size="sm">
              {tCommon("back")}
            </Button>
          </Link>
        </div>
      </div>

      {editing ? (
        <Card className="space-y-2">
          <Input
            label={t("name")}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <Input
            label={t("email")}
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            type="email"
          />
          <Input
            label={t("phone")}
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>
              {tCommon("save")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(false)}
            >
              {tCommon("cancel")}
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-gray-500">{t("email")}</span>
            <span>{customer.email || "-"}</span>
            <span className="text-gray-500">{t("phone")}</span>
            <span>{customer.phone || "-"}</span>
            <span className="text-gray-500">{t("totalSpent")}</span>
            <span className="font-medium">
              {formatCZK(customer.totalSpent)} CZK
            </span>
          </div>
        </Card>
      )}

      <Card>
        <h2 className="font-medium mb-3">
          {t("purchaseHistory")} ({customer.salesCount})
        </h2>
        {customer.sales.length === 0 ? (
          <p className="text-gray-500 text-sm">{tSale("noSales")}</p>
        ) : (
          <div className="space-y-2">
            {customer.sales.map((sale) => (
              <Link key={sale.id} href={`/sales/${sale.id}`}>
                <div className="flex justify-between items-center p-2 rounded hover:bg-gray-50 text-sm">
                  <span>
                    {sale.completedAt
                      ? new Date(sale.completedAt).toLocaleDateString("cs-CZ")
                      : "-"}
                  </span>
                  <span className="font-medium">
                    {formatCZK(sale.totalAmount)} CZK
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
