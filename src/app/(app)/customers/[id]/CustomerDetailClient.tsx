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
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  instagram?: string | null;
  note?: string | null;
  totalSpent: number;
  salesCount: number;
  inquiriesCount: number;
  sales: {
    id: string;
    saleNumber?: string;
    totalAmount: number;
    completedAt: string;
  }[];
  inquiries: {
    id: string;
    status: string;
    createdAt: string;
    items: { id: string }[];
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
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editInstagram, setEditInstagram] = useState("");

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setCustomer(data);
        setEditFirstName(data.firstName || data.name?.split(" ")[0] || "");
        setEditLastName(data.lastName || data.name?.split(" ").slice(1).join(" ") || "");
        setEditEmail(data.email || "");
        setEditPhone(data.phone || "");
        setEditCity(data.city || "");
        setEditInstagram(data.instagram || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    const res = await fetch(`/api/customers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        email: editEmail || undefined,
        phone: editPhone || undefined,
        city: editCity || undefined,
        instagram: editInstagram || undefined,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCustomer((prev) => (prev ? { ...prev, ...updated } : prev));
      setEditing(false);
    }
  };

  if (loading) return <p className="text-muted">{tCommon("loading")}</p>;
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
          <div className="grid grid-cols-2 gap-2">
            <Input
              label={t("firstName")}
              value={editFirstName}
              onChange={(e) => setEditFirstName(e.target.value)}
            />
            <Input
              label={t("lastName")}
              value={editLastName}
              onChange={(e) => setEditLastName(e.target.value)}
            />
          </div>
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
          <Input
            label={t("city")}
            value={editCity}
            onChange={(e) => setEditCity(e.target.value)}
          />
          <Input
            label="Instagram"
            value={editInstagram}
            onChange={(e) => setEditInstagram(e.target.value)}
            placeholder="@username"
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
            <span className="text-muted">{t("email")}</span>
            <span>{customer.email || "-"}</span>
            <span className="text-muted">{t("phone")}</span>
            <span>{customer.phone || "-"}</span>
            <span className="text-muted">{t("city")}</span>
            <span>{customer.city || "-"}</span>
            <span className="text-muted">Instagram</span>
            <span>{customer.instagram || "-"}</span>
            <span className="text-muted">{t("totalSpent")}</span>
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
          <p className="text-muted text-sm">{tSale("noSales")}</p>
        ) : (
          <div className="space-y-2">
            {customer.sales.map((sale) => (
              <Link key={sale.id} href={`/sales/${sale.id}`}>
                <div className="flex justify-between items-center p-2 rounded hover:bg-nude-50 text-sm">
                  <div className="flex items-center gap-2">
                    {sale.saleNumber && (
                      <span className="text-xs text-muted">#{sale.saleNumber}</span>
                    )}
                    <span>
                      {sale.completedAt
                        ? new Date(sale.completedAt).toLocaleDateString("cs-CZ")
                        : "-"}
                    </span>
                  </div>
                  <span className="font-medium">
                    {formatCZK(sale.totalAmount)} CZK
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="font-medium mb-3">
          {t("inquiries")} ({customer.inquiriesCount})
        </h2>
        {customer.inquiries.length === 0 ? (
          <p className="text-muted text-sm">{t("noInquiries")}</p>
        ) : (
          <div className="space-y-2">
            {customer.inquiries.map((inq) => (
              <Link key={inq.id} href={`/inquiries`}>
                <div className="flex justify-between items-center p-2 rounded hover:bg-nude-50 text-sm">
                  <span>
                    {new Date(inq.createdAt).toLocaleDateString("cs-CZ")}
                  </span>
                  <span className="text-xs text-muted">
                    {inq.items.length > 0
                      ? `${inq.items.length} ${t("inquiryItems")}`
                      : t("consultation")}
                  </span>
                  <span
                    className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                      inq.status === "NEW"
                        ? "bg-blue-100 text-blue-800"
                        : inq.status === "CONTACTED"
                          ? "bg-yellow-100 text-yellow-800"
                          : inq.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                    }`}
                  >
                    {inq.status}
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
