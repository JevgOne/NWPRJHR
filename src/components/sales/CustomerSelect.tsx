"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

interface Salon {
  id: string;
  name: string;
  city?: string | null;
}

interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}

interface CustomerSelectProps {
  customerType: "SALON" | "RETAIL" | null;
  onCustomerTypeChange: (type: "SALON" | "RETAIL") => void;
  selectedSalonId: string | null;
  onSalonSelect: (id: string) => void;
  selectedCustomerId: string | null;
  onCustomerSelect: (id: string) => void;
  onNewCustomer: (customer: { name: string; email?: string; phone?: string }) => void;
}

export function CustomerSelect({
  customerType,
  onCustomerTypeChange,
  selectedSalonId,
  onSalonSelect,
  selectedCustomerId,
  onCustomerSelect,
  onNewCustomer,
}: CustomerSelectProps) {
  const t = useTranslations("sale");
  const tCommon = useTranslations("common");
  const tCustomer = useTranslations("customer");
  const [salons, setSalons] = useState<Salon[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  useEffect(() => {
    if (customerType === "SALON") {
      fetch("/api/salons?archived=false")
        .then((r) => r.json())
        .then(setSalons)
        .catch(() => {});
    } else if (customerType === "RETAIL") {
      const q = search ? `?search=${encodeURIComponent(search)}` : "";
      fetch(`/api/customers${q}`)
        .then((r) => r.json())
        .then(setCustomers)
        .catch(() => {});
    }
  }, [customerType, search]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className={`p-4 rounded-xl border-2 text-center font-medium transition-colors ${
            customerType === "SALON"
              ? "border-rose bg-rose/10 text-espresso"
              : "border-line hover:border-line"
          }`}
          onClick={() => onCustomerTypeChange("SALON")}
        >
          {t("salonCustomer")}
        </button>
        <button
          type="button"
          className={`p-4 rounded-xl border-2 text-center font-medium transition-colors ${
            customerType === "RETAIL"
              ? "border-rose bg-rose/10 text-espresso"
              : "border-line hover:border-line"
          }`}
          onClick={() => onCustomerTypeChange("RETAIL")}
        >
          {t("retailCustomer")}
        </button>
      </div>

      {customerType === "SALON" && (
        <div className="space-y-2">
          <Input
            placeholder={tCommon("search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-60 overflow-y-auto space-y-1">
            {salons
              .filter(
                (s) =>
                  !search ||
                  s.name.toLowerCase().includes(search.toLowerCase())
              )
              .map((salon) => (
                <button
                  key={salon.id}
                  type="button"
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedSalonId === salon.id
                      ? "border-rose bg-rose/10"
                      : "border-line hover:bg-nude-50"
                  }`}
                  onClick={() => onSalonSelect(salon.id)}
                >
                  <div className="font-medium">{salon.name}</div>
                  {salon.city && (
                    <div className="text-sm text-muted">{salon.city}</div>
                  )}
                </button>
              ))}
          </div>
        </div>
      )}

      {customerType === "RETAIL" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder={tCommon("search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowNewForm(true)}
            >
              {t("newCustomer")}
            </Button>
          </div>

          {showNewForm && (
            <Card padding="sm" className="space-y-2">
              <Input
                label={t("newCustomer")}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t("newCustomer")}
              />
              <Input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={tCustomer("email")}
                type="email"
              />
              <Input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder={tCustomer("phone")}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    if (newName.trim()) {
                      onNewCustomer({
                        name: newName.trim(),
                        email: newEmail || undefined,
                        phone: newPhone || undefined,
                      });
                      setShowNewForm(false);
                      setNewName("");
                      setNewEmail("");
                      setNewPhone("");
                    }
                  }}
                  disabled={!newName.trim()}
                >
                  {tCommon("save")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewForm(false)}
                >
                  {tCommon("cancel")}
                </Button>
              </div>
            </Card>
          )}

          <div className="max-h-60 overflow-y-auto space-y-1">
            {customers.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedCustomerId === c.id
                    ? "border-rose bg-rose/10"
                    : "border-line hover:bg-nude-50"
                }`}
                onClick={() => onCustomerSelect(c.id)}
              >
                <div className="font-medium">{c.name}</div>
                {c.email && (
                  <div className="text-sm text-muted">{c.email}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
