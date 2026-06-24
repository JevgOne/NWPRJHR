"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CustomerSelect } from "@/components/sales/CustomerSelect";
import { SaleItemRow } from "@/components/sales/SaleItemRow";
import { DiscountForm } from "@/components/sales/DiscountForm";
import { SaleSummary } from "@/components/sales/SaleSummary";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import type { Role } from "@prisma/client";

interface ProductOption {
  id: string;
  name: string;
  category: string;
  processingType: string;
  variants: { id: string; lengthCm: number; color: string }[];
}

interface SaleItem {
  variantId: string;
  variantLabel: string;
  grams: number;
  pieces: number;
  pricePerGram: number;
  lineTotal: number;
  availableGrams: number;
  availablePieces: number;
}

interface DiscountData {
  percent: number;
  type: "STANDARD" | "MARKETING" | "PERSONAL";
  counterPerformanceNote: string;
  bearerPartnerIds: string[];
}

function roundUp(halere: number): number {
  return Math.ceil(halere / 100) * 100;
}

const STEPS = ["step1", "step2", "step3", "step4"] as const;

export function NewSaleWizard({
  products,
  role,
}: {
  products: ProductOption[];
  role: Role;
}) {
  const t = useTranslations("sale");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [customerType, setCustomerType] = useState<"SALON" | "RETAIL" | null>(null);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [discount, setDiscount] = useState<DiscountData | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isOwner = role === "OWNER";

  const subtotal = items.reduce((s, item) => s + item.lineTotal, 0);
  const discountAmount =
    discount && discount.percent > 0
      ? roundUp((subtotal * discount.percent) / 10000)
      : 0;
  const totalBeforeVat = roundUp(subtotal - discountAmount);
  const vatAmount = roundUp((totalBeforeVat * 2100) / 10000);
  const totalAmount = roundUp(totalBeforeVat + vatAmount);

  const fetchPricePreview = useCallback(
    async (variantId: string, grams: number, pieces: number) => {
      if (!customerType || grams <= 0) return null;
      const res = await fetch("/api/sales/price-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId,
          customerType,
          salonId: salonId ?? undefined,
          grams,
          pieces,
        }),
      });
      if (!res.ok) return null;
      return res.json();
    },
    [customerType, salonId]
  );

  const addItemFromVariantId = useCallback(
    async (variantId: string) => {
      // Find variant in products
      let label = variantId;
      for (const p of products) {
        const v = p.variants.find((v) => v.id === variantId);
        if (v) {
          label = `${p.name} ${v.lengthCm}cm ${v.color}`;
          break;
        }
      }

      const defaultGrams = 50;
      const preview = await fetchPricePreview(variantId, defaultGrams, 0);

      setItems((prev) => [
        ...prev,
        {
          variantId,
          variantLabel: label,
          grams: defaultGrams,
          pieces: 0,
          pricePerGram: preview?.pricePerGram ?? 0,
          lineTotal: preview?.lineTotal ?? 0,
          availableGrams: preview?.availableStock?.grams ?? 0,
          availablePieces: preview?.availableStock?.pieces ?? 0,
        },
      ]);
    },
    [products, fetchPricePreview]
  );

  const handleBarcodeScan = useCallback(
    async (barcode: string) => {
      setScannerOpen(false);
      const res = await fetch(`/api/deliveries/barcode/${encodeURIComponent(barcode)}`);
      if (!res.ok) {
        setError(t("barcodeNotFound"));
        return;
      }
      const delivery = await res.json();
      if (delivery.variantId) {
        await addItemFromVariantId(delivery.variantId);
      }
    },
    [addItemFromVariantId, t]
  );

  const updateItem = useCallback(
    async (index: number, updates: Partial<SaleItem>) => {
      setItems((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], ...updates };

        // Recalculate line total
        if (updates.grams !== undefined) {
          updated[index].lineTotal = roundUp(
            updated[index].pricePerGram * updated[index].grams
          );
        }

        return updated;
      });

      // Refetch preview if grams changed
      if (updates.grams !== undefined) {
        const item = items[index];
        const grams = updates.grams ?? item.grams;
        const preview = await fetchPricePreview(item.variantId, grams, item.pieces);
        if (preview) {
          setItems((prev) => {
            const updated = [...prev];
            if (updated[index]) {
              updated[index] = {
                ...updated[index],
                pricePerGram: preview.pricePerGram,
                lineTotal: preview.lineTotal,
                availableGrams: preview.availableStock.grams,
                availablePieces: preview.availableStock.pieces,
              };
            }
            return updated;
          });
        }
      }
    },
    [items, fetchPricePreview]
  );

  const handleNewCustomer = useCallback(
    async (data: { name: string; email?: string; phone?: string }) => {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const customer = await res.json();
        setCustomerId(customer.id);
      }
    },
    []
  );

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    const body = {
      customerType,
      salonId: salonId ?? undefined,
      customerId: customerId ?? undefined,
      items: items.map((item) => ({
        variantId: item.variantId,
        grams: item.grams,
        pieces: item.pieces,
      })),
      discount: discount
        ? {
            percent: discount.percent,
            type: discount.type,
            counterPerformanceNote: discount.counterPerformanceNote || undefined,
            bearerPartnerIds:
              discount.bearerPartnerIds.length > 0
                ? discount.bearerPartnerIds
                : undefined,
          }
        : undefined,
    };

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message || JSON.stringify(data.error) || tCommon("error"));
        setSubmitting(false);
        return;
      }

      const sale = await res.json();
      router.push(`/sales/${sale.id}`);
    } catch {
      setError(tCommon("error"));
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return (
          customerType &&
          (customerType === "SALON" ? !!salonId : true)
        );
      case 1:
        return items.length > 0 && items.every((i) => i.grams > 0);
      case 2:
        return true;
      case 3:
        return !submitting;
      default:
        return false;
    }
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold">{t("newSale")}</h1>

      {/* Step indicator */}
      <div className="flex gap-1">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`flex-1 h-1 rounded-full ${
              i <= step ? "bg-indigo-600" : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <p className="text-sm text-gray-500">{t(STEPS[step])}</p>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Step 1: Customer */}
      {step === 0 && (
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
      )}

      {/* Step 2: Items */}
      {step === 1 && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              size="lg"
              className="flex-1"
              onClick={() => setScannerOpen(true)}
            >
              {t("scanBarcode")}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="flex-1"
              onClick={() => setShowProductPicker(true)}
            >
              {t("manualSelect")}
            </Button>
          </div>

          {showProductPicker && (
            <Card padding="sm">
              <select
                className="w-full border rounded-lg p-2 mb-2 text-sm"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                <option value="">{tCommon("search")}...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {selectedProduct && (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {selectedProduct.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      className="w-full text-left p-2 rounded border border-gray-200 hover:bg-gray-50 text-sm"
                      onClick={() => {
                        addItemFromVariantId(v.id);
                        setShowProductPicker(false);
                        setSelectedProductId("");
                      }}
                    >
                      {v.lengthCm}cm - {v.color}
                    </button>
                  ))}
                </div>
              )}
            </Card>
          )}

          {items.map((item, i) => (
            <SaleItemRow
              key={`${item.variantId}-${i}`}
              item={item}
              onGramsChange={(g) => updateItem(i, { grams: g })}
              onPiecesChange={(p) => updateItem(i, { pieces: p })}
              onRemove={() => setItems((prev) => prev.filter((_, j) => j !== i))}
            />
          ))}

          {items.length > 0 && (
            <div className="text-right font-medium">
              {t("subtotal")}: {(subtotal / 100).toLocaleString("cs-CZ", { minimumFractionDigits: 2 })} CZK
            </div>
          )}

          <BarcodeScanner
            active={scannerOpen}
            onScan={handleBarcodeScan}
            onClose={() => setScannerOpen(false)}
          />
        </div>
      )}

      {/* Step 3: Discount */}
      {step === 2 && (
        <Card>
          <DiscountForm
            discount={discount}
            onChange={setDiscount}
            subtotal={subtotal}
            isOwner={isOwner}
          />
        </Card>
      )}

      {/* Step 4: Summary */}
      {step === 3 && (
        <Card>
          <SaleSummary
            items={items.map((i) => ({
              variantLabel: i.variantLabel,
              grams: i.grams,
              pieces: i.pieces,
              pricePerGram: i.pricePerGram,
              lineTotal: i.lineTotal,
            }))}
            subtotal={subtotal}
            discountAmount={discountAmount}
            totalBeforeVat={totalBeforeVat}
            vatAmount={vatAmount}
            totalAmount={totalAmount}
            isOwner={isOwner}
          />
        </Card>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <Button variant="secondary" onClick={() => setStep(step - 1)}>
            {tCommon("back")}
          </Button>
        )}
        <div className="flex-1" />
        {step < 3 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
          >
            {tCommon("next")}
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {submitting ? tCommon("loading") : t("completeSale")}
          </Button>
        )}
      </div>
    </div>
  );
}
