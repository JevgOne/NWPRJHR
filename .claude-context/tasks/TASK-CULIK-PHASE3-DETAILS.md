# PHASE 3: Business Logic -- Exact Diffs

Presne diffy pro implementatora. Aplikuj v tomto poradi.

**Predpoklad:** PHASE 1+2 hotova -- schema ma `sellingMode`, `pricePerPiece`, `retailPricePerPiece` na Variant, validace aktualizovany.

---

## 1. `src/lib/sale-pricing.ts` -- COMPLETE REWRITE

```diff
--- a/src/lib/sale-pricing.ts
+++ b/src/lib/sale-pricing.ts
@@ -1,45 +1,80 @@
 import type { CustomerType } from "@prisma/client";
 import { prisma } from "./db";
 import { roundHalereUp } from "./rounding";
 
+export interface SalePriceResult {
+  pricePerGram: number;
+  pricePerPiece: number | null;
+  sellingMode: "BY_GRAM" | "BY_PIECE";
+}
+
 /**
- * Get effective price per gram for a sale.
- * SALON: wholesale price (loyalty discount applied in Step 6 when tiers are implemented).
- * HAIRDRESSER: retail price minus hairdresser discount from B2BSettings.
- * RETAIL: retail price.
+ * Get effective price for a sale, supporting both BY_GRAM and BY_PIECE modes.
+ * Returns sellingMode so callers know which price to use for lineTotal.
  */
 export async function getSalePrice(
   variantId: string,
   customerType: CustomerType,
   _salonId?: string
-): Promise<{ pricePerGram: number }> {
+): Promise<SalePriceResult> {
   const variant = await prisma.variant.findUniqueOrThrow({
     where: { id: variantId },
   });
 
-  if (customerType === "RETAIL") {
-    return { pricePerGram: variant.retailPricePerGram };
-  }
+  const sellingMode = (variant.sellingMode ?? "BY_GRAM") as "BY_GRAM" | "BY_PIECE";
 
-  if (customerType === "HAIRDRESSER") {
-    const settings = await prisma.b2BSettings.findFirst();
-    const discountPct = settings?.hairdresserDiscountPct ?? 2000;
-    const price = roundHalereUp(
-      (variant.retailPricePerGram * (10000 - discountPct)) / 10000
-    );
-    return { pricePerGram: price };
+  // Always compute pricePerGram (needed for COGS even in BY_PIECE mode)
+  let pricePerGram: number;
+  if (customerType === "RETAIL") {
+    pricePerGram = variant.retailPricePerGram;
+  } else if (customerType === "HAIRDRESSER") {
+    const settings = await prisma.b2BSettings.findFirst();
+    const discountPct = settings?.hairdresserDiscountPct ?? 2000;
+    pricePerGram = roundHalereUp(
+      (variant.retailPricePerGram * (10000 - discountPct)) / 10000
+    );
+  } else {
+    // SALON: wholesale price
+    pricePerGram = variant.wholesalePricePerGram;
   }
 
-  // SALON: wholesale price (loyalty discounts will be added in Step 6)
-  return { pricePerGram: variant.wholesalePricePerGram };
+  if (sellingMode === "BY_PIECE") {
+    let piecePrice: number;
+    if (customerType === "RETAIL") {
+      piecePrice = variant.retailPricePerPiece ?? variant.pricePerPiece ?? 0;
+    } else if (customerType === "HAIRDRESSER") {
+      const settings = await prisma.b2BSettings.findFirst();
+      const discountPct = settings?.hairdresserDiscountPct ?? 2000;
+      const retailPerPiece = variant.retailPricePerPiece ?? variant.pricePerPiece ?? 0;
+      piecePrice = roundHalereUp(
+        (retailPerPiece * (10000 - discountPct)) / 10000
+      );
+    } else {
+      // SALON: wholesale per piece
+      piecePrice = variant.pricePerPiece ?? 0;
+    }
+    return { pricePerGram, pricePerPiece: piecePrice, sellingMode: "BY_PIECE" };
+  }
+
+  return { pricePerGram, pricePerPiece: null, sellingMode: "BY_GRAM" };
 }
 
 /**
- * Calculate line total for an item.
+ * Calculate line total for an item. Supports both selling modes.
  */
 export function calculateLineTotal(
   pricePerGram: number,
-  grams: number
+  grams: number,
+  sellingMode?: "BY_GRAM" | "BY_PIECE",
+  pricePerPiece?: number | null,
+  pieces?: number
 ): number {
+  if (sellingMode === "BY_PIECE" && pricePerPiece != null && pieces) {
+    return roundHalereUp(pricePerPiece * pieces);
+  }
   return roundHalereUp(pricePerGram * grams);
 }
```

---

## 2. `src/lib/sales.ts` -- completeSale changes

Zmeny jsou v kroku 1 (ceny) a kroku 5 (FIFO sale items). Zbytek souboru zustava beze zmeny.

```diff
--- a/src/lib/sales.ts
+++ b/src/lib/sales.ts
@@ -38,14 +38,30 @@
   const sale = await prisma.$transaction(
     async (tx) => {
-      // 1. DETERMINE PRICE PER GRAM for each item
+      // 1. DETERMINE PRICE for each item (gram or piece based)
       const pricedItems = await Promise.all(
         input.items.map(async (item) => {
           const variant = await tx.variant.findUniqueOrThrow({
             where: { id: item.variantId },
           });
 
-          let pricePerGram: number;
+          const sellingMode = (variant.sellingMode ?? "BY_GRAM") as "BY_GRAM" | "BY_PIECE";
+          const isByPiece = sellingMode === "BY_PIECE";
 
-          if (input.customerType === "SALON") {
-            // Wholesale price (loyalty discounts added in Step 6)
-            pricePerGram = variant.wholesalePricePerGram;
-          } else {
-            pricePerGram = variant.retailPricePerGram;
+          let pricePerGram: number;
+          let pricePerUnit: number; // the price used for lineTotal
+
+          if (input.customerType === "SALON") {
+            pricePerGram = variant.wholesalePricePerGram;
+          } else {
+            pricePerGram = variant.retailPricePerGram;
+          }
+
+          if (isByPiece) {
+            if (input.customerType === "SALON") {
+              pricePerUnit = variant.pricePerPiece ?? 0;
+            } else {
+              pricePerUnit = variant.retailPricePerPiece ?? variant.pricePerPiece ?? 0;
+            }
+          } else {
+            pricePerUnit = pricePerGram;
           }
 
+          const lineTotal = isByPiece
+            ? roundHalereUp(pricePerUnit * item.pieces)
+            : roundHalereUp(pricePerUnit * item.grams);
+
           return {
             ...item,
-            pricePerGram,
-            lineTotal: roundHalereUp(pricePerGram * item.grams),
+            pricePerGram,
+            pricePerUnit,
+            sellingMode,
+            lineTotal,
           };
         })
       );
```

A v kroku 5 (FIFO):

```diff
@@ -105,8 +121,12 @@
         for (const fifo of fifoResults) {
           const itemCost = fifo.purchasePricePerGramCZK * fifo.grams;
           totalCostOfGoods += itemCost;
 
+          const fifoLineTotal = item.sellingMode === "BY_PIECE"
+            ? roundHalereUp(item.pricePerUnit * fifo.pieces)
+            : roundHalereUp(item.pricePerUnit * fifo.grams);
+
           saleItemsData.push({
             variantId: item.variantId,
             grams: fifo.grams,
             pieces: fifo.pieces,
-            pricePerGramUsed: item.pricePerGram,
+            pricePerGramUsed: item.pricePerUnit,
             deliveryId: fifo.deliveryId,
             purchasePricePerGramCZK: fifo.purchasePricePerGramCZK,
-            lineTotal: roundHalereUp(item.pricePerGram * fifo.grams),
+            lineTotal: fifoLineTotal,
           });
         }
```

**Uplny vysledny soubor po obou diffech:**

Implementator meni radky:
- **40-62** (step 1 pricing): pridej `sellingMode`, `isByPiece`, `pricePerUnit`, nova logika lineTotal
- **105-117** (FIFO loop): `pricePerGramUsed: item.pricePerUnit`, nova `fifoLineTotal` logika

---

## 3. `src/lib/returns.ts` -- approveReturn credit note

Jedina zmena je v `approveReturn`, radky 106-121. Logika `initiateReturn` a `rejectReturn` zustavaji beze zmeny.

```diff
--- a/src/lib/returns.ts
+++ b/src/lib/returns.ts
@@ -102,20 +102,28 @@
       // 2. CREATE CREDIT NOTE
       let creditNoteId: string | undefined;
       let returnValue = 0;
 
       if (ret.sale.invoice) {
-        returnValue = ret.saleItem.pricePerGramUsed * ret.grams;
+        // Detect selling mode: if the sale item had pieces and this return has pieces,
+        // it was a BY_PIECE sale — use piece-based calculation
+        const isByPiece = ret.saleItem.pieces > 0 && ret.pieces > 0;
+
+        if (isByPiece) {
+          returnValue = ret.saleItem.pricePerGramUsed * ret.pieces;
+        } else {
+          returnValue = ret.saleItem.pricePerGramUsed * ret.grams;
+        }
+
         const creditNoteItems: CreditNoteItem[] = [
           {
             description: `Vratka: ${ret.reason}`,
-            quantity: ret.grams,
-            unit: "g",
+            quantity: isByPiece ? ret.pieces : ret.grams,
+            unit: isByPiece ? "ks" : "g",
             pricePerUnit: ret.saleItem.pricePerGramUsed,
             lineTotal: returnValue,
           },
         ];
 
+        const qtyLabel = isByPiece ? `${ret.pieces}ks` : `${ret.grams}g`;
         const creditNote = await createCreditNoteInTx(
           ret.sale.invoice.id,
           creditNoteItems,
-          `Vratka ${ret.grams}g k fakture ${ret.sale.invoice.number}`,
+          `Vratka ${qtyLabel} k fakture ${ret.sale.invoice.number}`,
           tx
         );
         creditNoteId = creditNote.id;
       }
```

**Presne mista k editaci:**
- Radek 107: nahrad `returnValue = ret.saleItem.pricePerGramUsed * ret.grams;` za isByPiece branch
- Radky 108-115: nahrad hardcoded `quantity: ret.grams, unit: "g"` za conditional
- Radek 120: nahrad `Vratka ${ret.grams}g` za `Vratka ${qtyLabel}`

---

## 4. `src/lib/complaints.ts` -- createComplaint credit note

Jedina zmena je v bloku radky 65-79 (credit note pro salon).

```diff
--- a/src/lib/complaints.ts
+++ b/src/lib/complaints.ts
@@ -63,14 +63,20 @@
 
           if (saleItem) {
-            const refundAmount = saleItem.pricePerGramUsed * input.grams;
+            // Detect selling mode from sale item
+            const isByPiece = saleItem.pieces > 0 && input.pieces > 0;
+
+            const refundAmount = isByPiece
+              ? saleItem.pricePerGramUsed * input.pieces
+              : saleItem.pricePerGramUsed * input.grams;
+
             const creditNote = await createCreditNoteInTx(
               sale.invoice.id,
               [
                 {
                   description: `Reklamace: ${input.description}`,
-                  quantity: input.grams,
-                  unit: "g",
+                  quantity: isByPiece ? input.pieces : input.grams,
+                  unit: isByPiece ? "ks" : "g",
                   pricePerUnit: saleItem.pricePerGramUsed,
                   lineTotal: refundAmount,
                 },
               ],
```

**Presne mista k editaci:**
- Radek 66: nahrad `const refundAmount = saleItem.pricePerGramUsed * input.grams;` za isByPiece branch
- Radky 72-73: nahrad hardcoded `quantity: input.grams, unit: "g"` za conditional

---

## 5. `src/app/api/deliveries/route.ts` -- POST handler (new wizard flow)

Zmeny v POST handleru, sekce "New wizard flow" (radky 82-162). GET handler zustava beze zmeny.

```diff
--- a/src/app/api/deliveries/route.ts
+++ b/src/app/api/deliveries/route.ts
@@ -87,6 +87,8 @@
 
     const data = parsed.data;
 
+    const isByPiece = data.sellingMode === "BY_PIECE";
+
     // 1. Find or create Product (unique per category+origin+texture+color+length)
     let product = await prisma.product.findFirst({
       where: {
@@ -123,12 +125,18 @@
       const priceSetting = await prisma.priceSettings.findUnique({ where: { category: data.category } });
       const markupPercent = priceSetting?.markupPercent ?? 200;
       const retailPrice = Math.round(data.purchasePricePerGramRaw * (10000 + markupPercent * 100) / 10000);
+      const retailPricePerPiece = isByPiece && data.pricePerPiece
+        ? Math.round(data.pricePerPiece * (10000 + markupPercent * 100) / 10000)
+        : undefined;
 
       variant = await prisma.variant.create({
         data: {
           productId: product.id,
           lengthCm: data.lengthCm,
           color: data.color,
+          sellingMode: data.sellingMode ?? "BY_GRAM",
+          pricePerPiece: isByPiece ? data.pricePerPiece : undefined,
+          retailPricePerPiece: isByPiece ? (data.retailPricePerPiece ?? retailPricePerPiece) : undefined,
           costPricePerGram: data.purchasePricePerGramRaw,
           wholesalePricePerGram: data.purchasePricePerGramRaw,
           retailPricePerGram: retailPrice,
@@ -137,14 +145,18 @@
       });
     }
 
+    // For BY_PIECE: compute totalGrams from pieces * pieceWeight
+    const effectiveTotalGrams = isByPiece && data.pieceWeightGrams
+      ? data.totalPieces * data.pieceWeightGrams
+      : data.totalGrams;
+
     // 3. Stock in
     const delivery = await stockIn(
       {
         variantId: variant.id,
         supplierId: data.supplierId,
         purchasePricePerGramRaw: data.purchasePricePerGramRaw,
         currency: data.currency,
         exchangeRate: data.exchangeRate,
-        totalGrams: data.totalGrams,
+        totalGrams: effectiveTotalGrams,
         totalPieces: data.totalPieces,
+        pieceWeightGrams: isByPiece ? data.pieceWeightGrams : undefined,
         barcode: generateBarcode(),
         stockedAt: data.stockedAt ? new Date(data.stockedAt) : undefined,
         note: data.note,
```

**Presne mista k editaci:**
1. Po `const data = parsed.data;` (radek 87): pridej `const isByPiece = data.sellingMode === "BY_PIECE";`
2. Pred `variant = await prisma.variant.create` (radek 129): pridej `retailPricePerPiece` auto-calc
3. V `prisma.variant.create.data` (radky 130-138): pridej `sellingMode`, `pricePerPiece`, `retailPricePerPiece`
4. Pred stock-in call (radek 142): pridej `effectiveTotalGrams` calculation
5. V `stockIn()` call: zmen `totalGrams: data.totalGrams` na `totalGrams: effectiveTotalGrams`, pridej `pieceWeightGrams`

---

## 6. `src/app/api/sales/price-preview/route.ts` -- COMPLETE REWRITE

```diff
--- a/src/app/api/sales/price-preview/route.ts
+++ b/src/app/api/sales/price-preview/route.ts
@@ -1,38 +1,53 @@
 import { NextRequest, NextResponse } from "next/server";
 import { auth } from "@/lib/auth";
 import { pricePreviewSchema } from "@/lib/validations/sale";
-import { getSalePrice, calculateLineTotal } from "@/lib/sale-pricing";
+import { getSalePrice } from "@/lib/sale-pricing";
+import { roundHalereUp } from "@/lib/rounding";
 import { getStockNumbers } from "@/lib/stock";
 
 export async function POST(request: NextRequest) {
   const session = await auth();
   if (!session)
     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER")
     return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 
   const body = await request.json();
   const parsed = pricePreviewSchema.safeParse(body);
   if (!parsed.success)
     return NextResponse.json(
       { error: parsed.error.flatten() },
       { status: 400 }
     );
 
-  const { variantId, customerType, salonId, grams } = parsed.data;
+  const { variantId, customerType, salonId, grams, pieces } = parsed.data;
 
-  const [{ pricePerGram }, stock] = await Promise.all([
+  const [pricing, stock] = await Promise.all([
     getSalePrice(variantId, customerType, salonId),
     getStockNumbers(variantId),
   ]);
-  const lineTotal = calculateLineTotal(pricePerGram, grams);
 
-  return NextResponse.json({
-    pricePerGram,
-    lineTotal,
-    availableStock: {
-      grams: stock.availableGrams,
-      pieces: stock.availablePieces,
-    },
-  });
+  const availableStock = {
+    grams: stock.availableGrams,
+    pieces: stock.availablePieces,
+  };
+
+  if (pricing.sellingMode === "BY_PIECE") {
+    const lineTotal = roundHalereUp((pricing.pricePerPiece ?? 0) * (pieces ?? 0));
+    return NextResponse.json({
+      sellingMode: "BY_PIECE",
+      pricePerPiece: pricing.pricePerPiece,
+      pricePerGram: pricing.pricePerGram,
+      lineTotal,
+      availableStock,
+    });
+  }
+
+  const lineTotal = roundHalereUp(pricing.pricePerGram * grams);
+  return NextResponse.json({
+    sellingMode: "BY_GRAM",
+    pricePerGram: pricing.pricePerGram,
+    lineTotal,
+    availableStock,
+  });
 }
```

---

## 7. `src/lib/order-workflow.ts` -- createOrder changes

Zmeny v `createOrder` funkci (radky 71-108). Ostatni funkce zustavaji beze zmeny.

```diff
--- a/src/lib/order-workflow.ts
+++ b/src/lib/order-workflow.ts
@@ -71,16 +71,32 @@
   for (const item of items) {
     const variant = variantMap.get(item.variantId);
     if (!variant) {
       throw new Error(`Variant ${item.variantId} not found`);
     }
 
+    const sellingMode = (variant.sellingMode ?? "BY_GRAM") as "BY_GRAM" | "BY_PIECE";
+    const isByPiece = sellingMode === "BY_PIECE";
+
     const stock = stockMap.get(item.variantId);
     const availableGrams = stock?.availableGrams ?? 0;
     const availablePieces = stock?.availablePieces ?? 0;
 
-    if (availableGrams < item.grams) {
-      throw new InsufficientStockError("grams", item.grams, availableGrams);
-    }
-    if (item.pieces > 0 && availablePieces < item.pieces) {
-      throw new InsufficientStockError("pieces", item.pieces, availablePieces);
+    if (isByPiece) {
+      // BY_PIECE: check pieces primarily
+      if (item.pieces > 0 && availablePieces < item.pieces) {
+        throw new InsufficientStockError("pieces", item.pieces, availablePieces);
+      }
+    } else {
+      // BY_GRAM: check grams
+      if (availableGrams < item.grams) {
+        throw new InsufficientStockError("grams", item.grams, availableGrams);
+      }
+      if (item.pieces > 0 && availablePieces < item.pieces) {
+        throw new InsufficientStockError("pieces", item.pieces, availablePieces);
+      }
     }
 
-    const pricePerGram = loyaltyDiscount > 0
+    let pricePerUnit: number;
+    let lineTotal: number;
+
+    if (isByPiece) {
+      const basePiecePrice = variant.pricePerPiece ?? 0;
+      pricePerUnit = loyaltyDiscount > 0
+        ? roundHalereUp(basePiecePrice * (10000 - loyaltyDiscount) / 10000)
+        : basePiecePrice;
+      lineTotal = roundHalereUp(pricePerUnit * item.pieces);
+    } else {
+      pricePerUnit = loyaltyDiscount > 0
       ? roundHalereUp(variant.wholesalePricePerGram * (10000 - loyaltyDiscount) / 10000)
       : variant.wholesalePricePerGram;
-    const lineTotal = roundHalereUp(pricePerGram * item.grams);
+      lineTotal = roundHalereUp(pricePerUnit * item.grams);
+    }
+
     estimatedTotal += lineTotal;
 
     orderItems.push({
       variantId: item.variantId,
       grams: item.grams,
       pieces: item.pieces,
-      pricePerGram,
+      pricePerGram: pricePerUnit,
       lineTotal,
     });
```

**Presne mista k editaci:**
- Radky 71-108: cely for-loop v `createOrder` se meni (stock check + pricing logika)
- `pricePerGram` promennou prejmenovavame na `pricePerUnit` (ale do `orderItems.push` ji stale davame pod klicem `pricePerGram` kvuli DB schemu)

---

## Shrnutí implementačního pořadí

1. **`src/lib/sale-pricing.ts`** -- zaklad, vsechny dalsi soubory na nej odkazuji
2. **`src/lib/sales.ts`** -- completeSale pouziva getSalePrice
3. **`src/app/api/sales/price-preview/route.ts`** -- pouziva getSalePrice
4. **`src/lib/order-workflow.ts`** -- pouziva variant.sellingMode primo
5. **`src/lib/returns.ts`** -- nezavisle (pouziva saleItem data)
6. **`src/lib/complaints.ts`** -- nezavisle (pouziva saleItem data)
7. **`src/app/api/deliveries/route.ts`** -- nezavisle (stock-in wizard)

Soubory 5, 6, 7 jsou vzajemne nezavisle a mohou byt implementovany paralelne.
