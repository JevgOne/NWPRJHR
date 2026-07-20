"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

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
  onNewCustomer: (customer: { firstName: string; lastName: string; email?: string; phone?: string; city?: string; instagram?: string }) => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
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
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newInstagram, setNewInstagram] = useState("");
  const [saving, setSaving] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (customerType === "SALON") {
      fetch("/api/salons?archived=false")
        .then((r) => r.json())
        .then((res) => setSalons(res.data ?? res))
        .catch(() => {});
    } else if (customerType === "RETAIL") {
      const q = search ? `?search=${encodeURIComponent(search)}` : "";
      fetch(`/api/customers${q}`)
        .then((r) => r.json())
        .then((res) => setCustomers(res.data ?? res))
        .catch(() => {});
    }
  }, [customerType, search]);

  const filteredSalons = salons.filter(
    (s) => !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      {/* Type toggle */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className={`py-3 px-4 rounded-xl border-2 text-center text-sm font-semibold transition-all ${
            customerType === "SALON"
              ? "border-rose bg-rose/10 text-rose shadow-sm"
              : "border-line text-muted hover:border-rose/30"
          }`}
          onClick={() => onCustomerTypeChange("SALON")}
        >
          {t("salonCustomer")}
        </button>
        <button
          type="button"
          className={`py-3 px-4 rounded-xl border-2 text-center text-sm font-semibold transition-all ${
            customerType === "RETAIL"
              ? "border-rose bg-rose/10 text-rose shadow-sm"
              : "border-line text-muted hover:border-rose/30"
          }`}
          onClick={() => onCustomerTypeChange("RETAIL")}
        >
          {t("retailCustomer")}
        </button>
      </div>

      {/* Salon list */}
      {customerType === "SALON" && (
        <div className="space-y-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Input
              ref={searchRef}
              placeholder={tCommon("search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="max-h-56 overflow-y-auto rounded-xl border border-line divide-y divide-line/50">
            {filteredSalons.length === 0 ? (
              <p className="text-sm text-muted text-center py-4">{tCommon("noResults")}</p>
            ) : (
              filteredSalons.map((salon) => {
                const selected = selectedSalonId === salon.id;
                return (
                  <button
                    key={salon.id}
                    type="button"
                    className={`w-full flex items-center gap-3 py-2.5 px-3 text-left transition-colors ${
                      selected ? "bg-rose/10" : "hover:bg-nude-50"
                    }`}
                    onClick={() => onSalonSelect(salon.id)}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      selected ? "bg-rose text-white" : "bg-nude-100 text-espresso"
                    }`}>
                      {getInitials(salon.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-ink truncate">{salon.name}</div>
                      {salon.city && <div className="text-xs text-muted truncate">{salon.city}</div>}
                    </div>
                    {selected && (
                      <svg className="w-5 h-5 text-rose flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Retail customer list */}
      {customerType === "RETAIL" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <Input
                ref={searchRef}
                placeholder={tCommon("search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowNewForm(true)}
              className="flex-shrink-0 whitespace-nowrap"
            >
              + {t("newCustomer")}
            </Button>
          </div>

          {showNewForm && (
            <div className="rounded-xl border border-rose/20 bg-rose/5 p-3 space-y-2">
              <p className="text-xs font-semibold text-espresso">{t("newCustomer")}</p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label={tCustomer("firstName")}
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                />
                <Input
                  label={tCustomer("lastName")}
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                />
              </div>
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
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder={tCustomer("city")}
                />
                <Input
                  value={newInstagram}
                  onChange={(e) => setNewInstagram(e.target.value)}
                  placeholder="@instagram"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={async () => {
                    if (!newFirstName.trim() || !newLastName.trim()) return;
                    setSaving(true);
                    try {
                      const data = {
                        firstName: newFirstName.trim(),
                        lastName: newLastName.trim(),
                        email: newEmail || undefined,
                        phone: newPhone || undefined,
                        city: newCity || undefined,
                        instagram: newInstagram || undefined,
                      };
                      const res = await fetch("/api/customers", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(data),
                      });
                      if (res.ok) {
                        const created = await res.json();
                        setCustomers((prev) => [
                          { id: created.id, name: created.name, email: created.email, phone: created.phone },
                          ...prev,
                        ]);
                        onCustomerSelect(created.id);
                        onNewCustomer(data);
                      }
                      setShowNewForm(false);
                      setNewFirstName("");
                      setNewLastName("");
                      setNewEmail("");
                      setNewPhone("");
                      setNewCity("");
                      setNewInstagram("");
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={!newFirstName.trim() || !newLastName.trim() || saving}
                >
                  {saving ? tCommon("saving") : tCommon("save")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewForm(false)}
                >
                  {tCommon("cancel")}
                </Button>
              </div>
            </div>
          )}

          <div className="max-h-56 overflow-y-auto rounded-xl border border-line divide-y divide-line/50">
            {customers.length === 0 ? (
              <p className="text-sm text-muted text-center py-4">{tCommon("noResults")}</p>
            ) : (
              customers.map((c) => {
                const selected = selectedCustomerId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`w-full flex items-center gap-3 py-2.5 px-3 text-left transition-colors ${
                      selected ? "bg-rose/10" : "hover:bg-nude-50"
                    }`}
                    onClick={() => onCustomerSelect(c.id)}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      selected ? "bg-rose text-white" : "bg-nude-100 text-espresso"
                    }`}>
                      {getInitials(c.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-ink truncate">{c.name}</div>
                      {c.email && <div className="text-xs text-muted truncate">{c.email}</div>}
                    </div>
                    {selected && (
                      <svg className="w-5 h-5 text-rose flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
