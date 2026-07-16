"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CustomerSelect } from "@/components/sales/CustomerSelect";

interface VariantOption {
  id: string;
  lengthCm: number;
  color: string;
  sellingMode: string;
  retailPricePerGram: number;
  retailPricePerPiece: number | null;
  pricePerPiece: number | null;
}

interface ProductOption {
  id: string;
  name: string;
  category: string;
  variants: VariantOption[];
}

function formatCZK(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function NewReservationForm({
  products,
  initialVariantId,
}: {
  products: ProductOption[];
  initialVariantId?: string;
}) {
  const t = useTranslations("reservation");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [customerType, setCustomerType] = useState<"SALON" | "RETAIL" | null>(null);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Auto-select product/variant when coming from QR scan
  const initialProduct = initialVariantId
    ? products.find((p) => p.variants.some((v) => v.id === initialVariantId))
    : undefined;

  const [selectedProductId, setSelectedProductId] = useState(
    initialProduct?.id ?? ""
  );
  const [selectedVariantId, setSelectedVariantId] = useState(
    initialVariantId ?? ""
  );
  const [grams, setGrams] = useState(100);
  const [pieces, setPieces] = useState(1);
  const [note, setNote] = useState("");

  // Default +3 days
  const defaultDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const [paymentDueDate, setPaymentDueDate] = useState(defaultDate);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const selectedVariant = selectedProduct?.variants.find(
    (v) => v.id === selectedVariantId
  );
  const isByPiece = selectedVariant?.sellingMode === "BY_PIECE";

  // Estimate price
  let estimatedPrice = 0;
  if (selectedVariant) {
    if (isByPiece) {
      const price = selectedVariant.retailPricePerPiece ?? selectedVariant.pricePerPiece ?? 0;
      estimatedPrice = price * pieces;
    } else {
      estimatedPrice = selectedVariant.retailPricePerGram * grams;
    }
    estimatedPrice = Math.ceil(estimatedPrice / 100) * 100; // roundUp
  }

  const handleNewCustomer = (customer: { firstName: string; lastName: string; email?: string; phone?: string }) => {
    setContactName(`${customer.firstName} ${customer.lastName}`.trim());
    setContactEmail(customer.email ?? "");
    setContactPhone(customer.phone ?? "");
  };

  const handleSubmit = async () => {
    if (!customerType || !selectedVariantId) return;
    setSubmitting(true);
    setError("");

    const body = {
      customerType,
      salonId: salonId || undefined,
      customerId: customerId || undefined,
      contactName: contactName || undefined,
      contactEmail: contactEmail || undefined,
      contactPhone: contactPhone || undefined,
      variantId: selectedVariantId,
      grams: isByPiece ? 0 : grams,
      pieces: isByPiece ? pieces : 0,
      paymentDueDate,
      note: note || undefined,
    };

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }

      const reservation = await res.json();
      router.push(`/reservations/${reservation.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("newReservation")}</h1>
        <Button variant="ghost" size="sm" onClick={() => router.push("/reservations")}>
          {tCommon("back")}
        </Button>
      </div>

      {/* Step 1: Customer */}
      <Card>
        <CustomerSelect
          customerType={customerType}
          onCustomerTypeChange={setCustomerType}
          selectedSalonId={salonId}
          onSalonSelect={setSalonId}
          selectedCustomerId={customerId}
          onCustomerSelect={setCustomerId}
          onNewCustomer={handleNewCustomer}
        />
      </Card>

      {/* Step 2: Product */}
      {customerType && (
        <Card>
          <h2 className="text-sm font-semibold text-espresso mb-3">{t("selectProduct")}</h2>
          <div className="space-y-3">
            <select
              className="block w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-rose focus:outline-none focus:ring-1 focus:ring-rose"
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                setSelectedVariantId("");
              }}
            >
              <option value="">{t("selectProduct")}...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {selectedProduct && (
              <select
                className="block w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-rose focus:outline-none focus:ring-1 focus:ring-rose"
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(e.target.value)}
              >
                <option value="">-- variant --</option>
                {selectedProduct.variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.color} {v.lengthCm}cm
                  </option>
                ))}
              </select>
            )}

            {selectedVariant && (
              <div className="space-y-2">
                {isByPiece ? (
                  <Input
                    label={`${t("quantity")} (ks)`}
                    type="number"
                    min={1}
                    value={pieces}
                    onChange={(e) => setPieces(parseInt(e.target.value) || 1)}
                  />
                ) : (
                  <Input
                    label={`${t("quantity")} (g)`}
                    type="number"
                    min={1}
                    value={grams}
                    onChange={(e) => setGrams(parseInt(e.target.value) || 1)}
                  />
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Step 3: Payment deadline */}
      {selectedVariantId && (
        <Card>
          <h2 className="text-sm font-semibold text-espresso mb-3">{t("paymentInfo")}</h2>
          <Input
            label={t("deadline")}
            type="date"
            value={paymentDueDate}
            onChange={(e) => setPaymentDueDate(e.target.value)}
          />
          <div className="mt-3">
            <Input
              label={t("note")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </Card>
      )}

      {/* Price preview + Submit */}
      {selectedVariantId && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-muted">
              {t("estimatedPrice")}
            </span>
            <span className="text-lg font-bold text-ink">
              {formatCZK(estimatedPrice)} CZK
            </span>
          </div>
          <p className="text-xs text-muted mb-4">
            {customerType === "SALON"
              ? t("b2bPriceHint")
              : customerType === "RETAIL"
              ? t("retailPrice")
              : ""}
          </p>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <Button
            onClick={handleSubmit}
            disabled={submitting || !customerType || !selectedVariantId}
            className="w-full"
          >
            {submitting ? tCommon("saving") : t("createReservation")}
          </Button>
        </Card>
      )}
    </div>
  );
}
