"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CustomerSelect } from "@/components/sales/CustomerSelect";
import { SaleItemRow } from "@/components/sales/SaleItemRow";
import { DiscountForm } from "@/components/sales/DiscountForm";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import type { Role } from "@prisma/client";
import { getHairColor } from "@/lib/hair-colors";

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
  pricePerPiece?: number;
  sellingMode?: "BY_GRAM" | "BY_PIECE";
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

function formatCZK(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function NewSaleWizard({
  products,
  role,
}: {
  products: ProductOption[];
  role: Role;
}) {
  const t = useTranslations("sale");
  const tCommon = useTranslations("common");
  const tStock = useTranslations("stock");
  const router = useRouter();

  const [customerType, setCustomerType] = useState<"SALON" | "RETAIL" | null>(null);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [discount, setDiscount] = useState<DiscountData | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [paymentType, setPaymentType] = useState<"TRANSFER" | "CASH" | "PROMO" | "WRITEOFF">("TRANSFER");
  const [receiptNumber, setReceiptNumber] = useState("");
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
      if (!customerType || (grams <= 0 && pieces <= 0)) return null;
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
      let label = variantId;
      for (const p of products) {
        const v = p.variants.find((v) => v.id === variantId);
        if (v) {
          label = `${p.name} ${v.lengthCm}cm ${v.color}`;
          break;
        }
      }

      const preview = await fetchPricePreview(variantId, 50, 0);
      const isByPiece = preview?.sellingMode === "BY_PIECE";

      if (isByPiece) {
        const piecePreview = await fetchPricePreview(variantId, 0, 1);
        setItems((prev) => [
          ...prev,
          {
            variantId,
            variantLabel: label,
            grams: 0,
            pieces: 1,
            pricePerGram: 0,
            pricePerPiece: piecePreview?.pricePerPiece ?? preview?.pricePerPiece ?? 0,
            sellingMode: "BY_PIECE",
            lineTotal: piecePreview?.lineTotal ?? 0,
            availableGrams: 0,
            availablePieces: piecePreview?.availableStock?.pieces ?? preview?.availableStock?.pieces ?? 0,
          },
        ]);
      } else {
        setItems((prev) => [
          ...prev,
          {
            variantId,
            variantLabel: label,
            grams: 50,
            pieces: 0,
            pricePerGram: preview?.pricePerGram ?? 0,
            sellingMode: "BY_GRAM",
            lineTotal: preview?.lineTotal ?? 0,
            availableGrams: preview?.availableStock?.grams ?? 0,
            availablePieces: preview?.availableStock?.pieces ?? 0,
          },
        ]);
      }
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

        if (updated[index].sellingMode === "BY_PIECE") {
          if (updates.pieces !== undefined) {
            updated[index].lineTotal = roundUp(
              (updated[index].pricePerPiece ?? 0) * updated[index].pieces
            );
          }
        } else if (updates.grams !== undefined) {
          updated[index].lineTotal = roundUp(
            updated[index].pricePerGram * updated[index].grams
          );
        }

        return updated;
      });

      const item = items[index];
      if (updates.grams !== undefined || updates.pieces !== undefined) {
        const grams = updates.grams ?? item.grams;
        const pieces = updates.pieces ?? item.pieces;
        const preview = await fetchPricePreview(item.variantId, grams, pieces);
        if (preview) {
          setItems((prev) => {
            const updated = [...prev];
            if (updated[index]) {
              updated[index] = {
                ...updated[index],
                pricePerGram: preview.pricePerGram,
                pricePerPiece: preview.pricePerPiece,
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
      paymentType,
      receiptNumber: paymentType === "CASH" && receiptNumber ? receiptNumber : undefined,
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

  const canSubmit =
    customerType &&
    (customerType === "SALON" ? !!salonId : true) &&
    items.length > 0 &&
    items.every((i) => (i.sellingMode === "BY_PIECE" ? i.pieces > 0 : i.grams > 0)) &&
    !submitting;

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold">{t("newSale")}</h1>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Customer */}
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

      {/* Items */}
      <Card>
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
              onClick={() => setShowProductPicker(!showProductPicker)}
            >
              {t("manualSelect")}
            </Button>
          </div>

          {showProductPicker && (
            <div className="border rounded-lg p-2">
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
                      className="w-full text-left p-2 rounded border border-line hover:bg-nude-50 text-sm flex items-center gap-2"
                      onClick={() => {
                        addItemFromVariantId(v.id);
                        setShowProductPicker(false);
                        setSelectedProductId("");
                      }}
                    >
                      <span
                        className="inline-block w-4 h-4 rounded-full border border-line flex-shrink-0"
                        style={{ backgroundColor: getHairColor(v.color).hex }}
                      />
                      {v.lengthCm}cm - {v.color}
                    </button>
                  ))}
                </div>
              )}
            </div>
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

          <BarcodeScanner
            active={scannerOpen}
            onScan={handleBarcodeScan}
            onClose={() => setScannerOpen(false)}
          />
        </div>
      </Card>

      {/* Discount */}
      <Card>
        <DiscountForm
          discount={discount}
          onChange={setDiscount}
          subtotal={subtotal}
          isOwner={isOwner}
        />
      </Card>

      {/* Payment type */}
      <Card>
        <div>
          <label className="block text-sm font-medium text-espresso mb-2">
            Typ platby
          </label>
          <div className="grid grid-cols-2 gap-2">
            {([
              { key: "TRANSFER", label: "Převod" },
              { key: "CASH", label: "Hotovost" },
              { key: "PROMO", label: "Promo" },
              { key: "WRITEOFF", label: "Odpis" },
            ] as const).map((pt) => (
              <button
                key={pt.key}
                type="button"
                className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                  paymentType === pt.key
                    ? "border-rose bg-rose/10 text-espresso"
                    : "border-line hover:bg-nude-50"
                }`}
                onClick={() => setPaymentType(pt.key)}
              >
                {pt.label}
              </button>
            ))}
          </div>
          {paymentType === "CASH" && (
            <div className="mt-2 space-y-2">
              <input
                type="text"
                placeholder="Číslo paragonu (nepovinné)"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                className="w-full border border-line rounded-lg px-3 py-2 text-sm"
              />
              <p className="text-xs text-muted">Paragon/pokladní doklad vystavíte ručně.</p>
            </div>
          )}
          {paymentType === "TRANSFER" && (
            <p className="text-xs text-muted mt-2">Faktura se vytvoří automaticky.</p>
          )}
          {paymentType === "PROMO" && (
            <p className="text-xs text-muted mt-2">Interní promo — vytvoří se interní doklad.</p>
          )}
          {paymentType === "WRITEOFF" && (
            <p className="text-xs text-muted mt-2">Interní odpis — vytvoří se interní doklad.</p>
          )}
        </div>
      </Card>

      {/* Summary + Submit */}
      {items.length > 0 && (
        <Card>
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm border-b pb-2">
                <div>
                  <div className="font-medium">{item.variantLabel}</div>
                  <div className="text-muted">
                    {item.sellingMode === "BY_PIECE"
                      ? `${item.pieces} ${tStock("pieces")} @ ${formatCZK(item.pricePerPiece ?? 0)} CZK`
                      : <>
                          {item.grams} {tStock("grams")}
                          {item.pieces > 0 && ` / ${item.pieces} ${tStock("pieces")}`}
                          {" @ "}
                          {formatCZK(item.pricePerGram)} CZK/{tStock("grams")}
                        </>
                    }
                  </div>
                </div>
                <div className="font-medium whitespace-nowrap">{formatCZK(item.lineTotal)} CZK</div>
              </div>
            ))}

            <div className="space-y-1 text-sm pt-2">
              <div className="flex justify-between">
                <span>{t("subtotal")}</span>
                <span>{formatCZK(subtotal)} CZK</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>{t("discount")}</span>
                  <span>-{formatCZK(discountAmount)} CZK</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>{t("beforeVat")}</span>
                <span>{formatCZK(totalBeforeVat)} CZK</span>
              </div>
              <div className="flex justify-between">
                <span>{t("vat")}</span>
                <span>{formatCZK(vatAmount)} CZK</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t">
                <span>{t("totalAmount")}</span>
                <span>{formatCZK(totalAmount)} CZK</span>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full mt-4 bg-green-600 hover:bg-green-700"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              {submitting ? tCommon("loading") : t("completeSale")}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
