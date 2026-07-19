"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
import { generateSku } from "@/lib/sku";

interface ProductOption {
  id: string;
  name: string;
  category: string;
  processingType: string;
  origin: string | null;
  texture: string | null;
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
  sellByGrams?: boolean;
  hasNonExclusiveGrams?: boolean;
  lineTotal: number;
  availableGrams: number;
  availablePieces: number;
  origin?: string | null;
  texture?: string | null;
  sku?: string;
  category?: string;
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
  initialVariantId,
}: {
  products: ProductOption[];
  role: Role;
  initialVariantId?: string;
}) {
  const t = useTranslations("sale");
  const tCommon = useTranslations("common");
  const tStock = useTranslations("stock");
  const tReservation = useTranslations("reservation");
  const router = useRouter();

  const [customerType, setCustomerType] = useState<"SALON" | "RETAIL" | null>(null);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [discount, setDiscount] = useState<DiscountData | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [paymentType, setPaymentType] = useState<"TRANSFER" | "CASH" | "CARD" | "PROMO" | "WRITEOFF">("TRANSFER");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [reserveMode, setReserveMode] = useState(false);
  const [paymentDueDate, setPaymentDueDate] = useState(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [reservationNote, setReservationNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [transferResult, setTransferResult] = useState<{
    saleId: string;
    qrPayment?: string;
    paymentInfo?: { bankAccount: string; variableSymbol: string; amount: number };
  } | null>(null);
  const previewRequestId = useRef(0);

  const isOwner = role === "OWNER";

  const subtotal = items.reduce((s, item) => s + item.lineTotal, 0);
  const discountAmount =
    discount && discount.percent > 0
      ? roundUp((subtotal * discount.percent) / 10000)
      : 0;
  const totalAmount = roundUp(subtotal - discountAmount);
  const vatAmount = roundUp((totalAmount * 2100) / 12100);
  const totalBeforeVat = totalAmount - vatAmount;

  const fetchPricePreview = useCallback(
    async (variantId: string, grams: number, pieces: number) => {
      if (grams <= 0 && pieces <= 0) return null;
      const res = await fetch("/api/sales/price-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId,
          customerType: customerType ?? "RETAIL",
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
    async (variantId: string, fallbackProduct?: { origin?: string | null; texture?: string | null; category?: string } | null) => {
      let label = variantId;
      let origin: string | null = fallbackProduct?.origin ?? null;
      let texture: string | null = fallbackProduct?.texture ?? null;
      let sku: string | undefined;
      let category: string | undefined = fallbackProduct?.category;

      for (const p of products) {
        const v = p.variants.find((v) => v.id === variantId);
        if (v) {
          label = `${p.name} ${v.lengthCm}cm ${v.color}`;
          origin = p.origin;
          texture = p.texture;
          category = p.category;
          sku = generateSku(p.category, p.texture, v.color, v.lengthCm);
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
            pricePerGram: piecePreview?.pricePerGram ?? preview?.pricePerGram ?? 0,
            pricePerPiece: piecePreview?.pricePerPiece ?? preview?.pricePerPiece ?? 0,
            sellingMode: "BY_PIECE",
            sellByGrams: false,
            hasNonExclusiveGrams: piecePreview?.hasNonExclusiveGrams ?? preview?.hasNonExclusiveGrams ?? false,
            lineTotal: piecePreview?.lineTotal ?? 0,
            availableGrams: piecePreview?.availableStock?.grams ?? preview?.availableStock?.grams ?? 0,
            availablePieces: piecePreview?.availableStock?.pieces ?? preview?.availableStock?.pieces ?? 0,
            origin,
            texture,
            sku,
            category,
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
            origin,
            texture,
            sku,
            category,
          },
        ]);
      }
    },
    [products, fetchPricePreview]
  );

  // Auto-add item from QR scan URL (?variantId=XXX)
  const initialVariantHandled = useRef(false);
  useEffect(() => {
    if (!initialVariantId || initialVariantHandled.current) return;
    if (!customerType) {
      setCustomerType("RETAIL");
      return;
    }
    initialVariantHandled.current = true;
    addItemFromVariantId(initialVariantId).catch(() => {
      // Fallback: add item even if price preview fails
      setItems((prev) => [
        ...prev,
        {
          variantId: initialVariantId,
          variantLabel: initialVariantId,
          grams: 50,
          pieces: 0,
          pricePerGram: 0,
          sellingMode: "BY_GRAM" as const,
          lineTotal: 0,
          availableGrams: 0,
          availablePieces: 0,
        },
      ]);
    });
  }, [initialVariantId, customerType, addItemFromVariantId]);

  // Refresh prices when customerType or salonId changes
  useEffect(() => {
    if (!customerType || items.length === 0) return;
    Promise.all(
      items.map(async (item, i) => {
        const preview = await fetchPricePreview(item.variantId, item.grams, item.pieces);
        if (preview) {
          setItems((prev) => {
            const updated = [...prev];
            if (updated[i]) {
              updated[i] = {
                ...updated[i],
                pricePerGram: preview.pricePerGram,
                pricePerPiece: preview.pricePerPiece,
                lineTotal: preview.lineTotal,
                availableGrams: preview.availableStock?.grams ?? updated[i].availableGrams,
                availablePieces: preview.availableStock?.pieces ?? updated[i].availablePieces,
              };
            }
            return updated;
          });
        }
      })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerType, salonId]);

  const handleBarcodeScan = useCallback(
    async (scanned: string) => {
      setScannerOpen(false);

      // Auto-set RETAIL if no customer type selected
      if (!customerType) {
        setCustomerType("RETAIL");
      }

      // Extract variantId from QR URL or barcode
      let variantId: string | null = null;
      let barcodeProduct: { origin?: string | null; texture?: string | null; category?: string } | null = null;

      const urlMatch = scanned.match(/variantId=([a-zA-Z0-9_-]+)/);
      if (urlMatch) {
        variantId = urlMatch[1];
      } else {
        // Treat as barcode (HR-XXXXX)
        const res = await fetch(`/api/deliveries/barcode/${encodeURIComponent(scanned)}`);
        if (!res.ok) {
          setError(t("barcodeNotFound"));
          return;
        }
        const delivery = await res.json();
        variantId = delivery.variant?.id ?? delivery.variantId;
        barcodeProduct = delivery.variant?.product ?? null;
      }

      if (!variantId) return;

      // Prevent duplicate — if variant already in items, skip
      if (items.some((i) => i.variantId === variantId)) return;

      await addItemFromVariantId(variantId, barcodeProduct);
    },
    [addItemFromVariantId, t, customerType, items]
  );

  const toggleSellByGrams = useCallback((index: number) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const nowByGrams = !item.sellByGrams;

      updated[index] = {
        ...item,
        sellByGrams: nowByGrams,
        grams: 0,
        pieces: nowByGrams ? 0 : 1,
        lineTotal: nowByGrams ? 0 : roundUp((item.pricePerPiece ?? 0) * 1),
      };
      return updated;
    });
  }, []);

  const updateItem = useCallback(
    async (index: number, updates: Partial<SaleItem>) => {
      setItems((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], ...updates };

        if (updated[index].sellingMode === "BY_PIECE") {
          if (updated[index].sellByGrams) {
            if (updates.grams !== undefined) {
              updated[index].lineTotal = roundUp(
                updated[index].pricePerGram * updated[index].grams
              );
            }
          } else {
            if (updates.pieces !== undefined) {
              updated[index].lineTotal = roundUp(
                (updated[index].pricePerPiece ?? 0) * updated[index].pieces
              );
            }
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
        const requestId = ++previewRequestId.current;
        const preview = await fetchPricePreview(item.variantId, grams, pieces);
        if (preview && requestId === previewRequestId.current) {
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
    (_data: { firstName: string; lastName: string; email?: string; phone?: string; city?: string; instagram?: string }) => {
      // Customer creation + selection is handled by CustomerSelect internally.
      // This callback is kept for any additional side effects if needed.
    },
    []
  );

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    if (reserveMode) {
      const item = items[0];
      const body = {
        customerType,
        salonId: salonId ?? undefined,
        customerId: customerId ?? undefined,
        variantId: item.variantId,
        grams: item.sellByGrams ? item.grams : (item.sellingMode === "BY_PIECE" ? 0 : item.grams),
        pieces: item.sellByGrams ? 0 : item.pieces,
        paymentDueDate,
        note: reservationNote || undefined,
      };

      try {
        const res = await fetch("/api/reservations", {
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

        const reservation = await res.json();
        router.push(`/reservations/${reservation.id}`);
      } catch {
        setError(tCommon("error"));
        setSubmitting(false);
      }
      return;
    }

    const body = {
      customerType,
      salonId: salonId ?? undefined,
      customerId: customerId ?? undefined,
      paymentType,
      receiptNumber: paymentType === "CASH" && receiptNumber ? receiptNumber : undefined,
      items: items.map((item) => ({
        variantId: item.variantId,
        grams: item.sellByGrams ? item.grams : (item.sellingMode === "BY_PIECE" ? 0 : item.grams),
        pieces: item.sellByGrams ? 0 : item.pieces,
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

      if (paymentType === "TRANSFER" && (sale.qrPayment || sale.paymentInfo)) {
        setTransferResult({
          saleId: sale.id,
          qrPayment: sale.qrPayment,
          paymentInfo: sale.paymentInfo,
        });
        setSubmitting(false);
        return;
      }

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
    items.every((i) =>
      i.sellingMode === "BY_PIECE"
        ? i.sellByGrams ? i.grams > 0 : i.pieces > 0
        : i.grams > 0
    ) &&
    !submitting;

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // QR payment success screen for TRANSFER sales
  if (transferResult) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <h1 className="text-xl font-bold">{t("newSale")}</h1>
        <Card>
          <div className="text-center space-y-4">
            <div className="text-green-600 font-semibold text-lg">{t("saleCreated")}</div>
            <p className="text-sm text-muted">{t("scanQrToPay")}</p>

            {transferResult.qrPayment && (
              <div className="flex justify-center">
                <img
                  src={transferResult.qrPayment}
                  alt="QR platba"
                  className="w-48 h-48"
                />
              </div>
            )}

            {transferResult.paymentInfo && (
              <div className="text-left bg-nude-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">{t("bankAccount")}:</span>
                  <span className="font-medium">{transferResult.paymentInfo.bankAccount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">{t("variableSymbol")}:</span>
                  <span className="font-medium">{transferResult.paymentInfo.variableSymbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">{t("amount")}:</span>
                  <span className="font-medium">{formatCZK(transferResult.paymentInfo.amount)} CZK</span>
                </div>
              </div>
            )}

            <Button
              size="lg"
              className="w-full"
              onClick={() => router.push(`/sales/${transferResult.saleId}`)}
            >
              {t("goToSaleDetail")}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

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
              onToggleSellByGrams={item.sellingMode === "BY_PIECE" && item.hasNonExclusiveGrams ? () => toggleSellByGrams(i) : undefined}
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

      {/* Reservation toggle */}
      {items.length > 0 && (
        <Card>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={reserveMode}
              onChange={(e) => setReserveMode(e.target.checked)}
              className="w-5 h-5 rounded border-line text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-espresso">
                {t("reserveInstead")}
              </span>
              <p className="text-xs text-muted">{t("reserveInsteadHint")}</p>
            </div>
          </label>

          {reserveMode && (
            <div className="mt-3 space-y-3 pt-3 border-t">
              <div>
                <label className="block text-sm font-medium text-espresso mb-1">
                  {tReservation("deadline")}
                </label>
                <input
                  type="date"
                  value={paymentDueDate}
                  onChange={(e) => setPaymentDueDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full border border-line rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-espresso mb-1">
                  {tReservation("note")}
                </label>
                <input
                  type="text"
                  value={reservationNote}
                  onChange={(e) => setReservationNote(e.target.value)}
                  placeholder={tReservation("notePlaceholder")}
                  className="w-full border border-line rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Discount */}
      {!reserveMode && (
        <Card>
          <DiscountForm
            discount={discount}
            onChange={setDiscount}
            subtotal={subtotal}
            isOwner={isOwner}
          />
        </Card>
      )}

      {/* Payment type */}
      {!reserveMode && (
      <Card>
        <div>
          <label className="block text-sm font-medium text-espresso mb-2">
            {t("paymentType")}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {([
              { key: "TRANSFER", label: t("paymentTransfer") },
              { key: "CASH", label: t("paymentCash") },
              { key: "CARD", label: t("paymentCard") },
              { key: "PROMO", label: t("paymentPromo") },
              { key: "WRITEOFF", label: t("paymentWriteoff") },
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
                placeholder={t("receiptPlaceholder")}
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                className="w-full border border-line rounded-lg px-3 py-2 text-sm"
              />
              <p className="text-xs text-muted">{t("receiptHint")}</p>
            </div>
          )}
          {paymentType === "TRANSFER" && (
            <p className="text-xs text-muted mt-2">{t("transferHint")}</p>
          )}
          {paymentType === "CARD" && (
            <p className="text-xs text-muted mt-2">{t("cardHint")}</p>
          )}
          {paymentType === "PROMO" && (
            <p className="text-xs text-muted mt-2">{t("promoHint")}</p>
          )}
          {paymentType === "WRITEOFF" && (
            <p className="text-xs text-muted mt-2">{t("writeoffHint")}</p>
          )}
        </div>
      </Card>
      )}

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
                      ? item.sellByGrams
                        ? `${item.grams} ${tStock("grams")} @ ${formatCZK(item.pricePerGram)} CZK/${tStock("grams")}`
                        : `${item.pieces} ${tStock("pieces")} @ ${formatCZK(item.pricePerPiece ?? 0)} CZK`
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
              className={`w-full mt-4 ${
                reserveMode
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              {submitting
                ? tCommon("loading")
                : reserveMode
                  ? tReservation("createReservation")
                  : t("completeSale")}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
