# PHASE 4 + 5: Detailed Implementation Diffs

## Overview

**PHASE 4** — Stock-in form: selling mode toggle, piece-specific fields, modified submit  
**PHASE 5** — Frontend display: product cards, detail page, inquiry form, cart, salon catalog, APIs

---

## 1. StockInForm.tsx (PHASE 4)

### 1a. Add selling mode state (after line 42)

```diff
  const [lengthCm, setLengthCm] = useState<number | null>(null);
  const [customLength, setCustomLength] = useState("");

+ // Selling mode
+ const [sellingMode, setSellingMode] = useState<"BY_GRAM" | "BY_PIECE">("BY_GRAM");
+ const isByPiece = sellingMode === "BY_PIECE";

  // Details form state
  const [supplierId, setSupplierId] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [totalGrams, setTotalGrams] = useState("");
+ const [totalPieces, setTotalPieces] = useState("");
+ const [pieceWeightGrams, setPieceWeightGrams] = useState("");
+ const [pricePerPieceCzk, setPricePerPieceCzk] = useState("");
+ const [retailPricePerPieceCzk, setRetailPricePerPieceCzk] = useState("");
  const [stockedAt, setStockedAt] = useState(
```

### 1b. Add selling mode to resetFrom and "stock another" reset

In the `resetFrom` function, no change needed since selling mode is in the "details" section below length.

In the "stock another" button handler (around line 295-307), add resets:

```diff
                setCustomLength("");
                setSupplierId("");
                setPurchasePrice("");
                setTotalGrams("");
+               setTotalPieces("");
+               setPieceWeightGrams("");
+               setPricePerPieceCzk("");
+               setRetailPricePerPieceCzk("");
+               setSellingMode("BY_GRAM");
                setNote("");
```

### 1c. Add selling mode toggle in the details form (after line 491, after `<h2>wizDetails</h2>`)

```diff
            <h2 className="text-sm font-medium text-espresso mb-1">
              {t("wizDetails")}
            </h2>

+           {/* Selling mode toggle */}
+           <div>
+             <label className="block text-sm font-medium text-espresso mb-2">
+               {t("sellingMode")}
+             </label>
+             <div className="flex gap-2">
+               <button
+                 type="button"
+                 onClick={() => setSellingMode("BY_GRAM")}
+                 className={`flex-1 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors ${
+                   sellingMode === "BY_GRAM"
+                     ? "border-rose bg-rose/5 text-ink"
+                     : "border-line bg-white text-muted hover:border-espresso/30"
+                 }`}
+               >
+                 {t("byGram")}
+               </button>
+               <button
+                 type="button"
+                 onClick={() => setSellingMode("BY_PIECE")}
+                 className={`flex-1 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors ${
+                   sellingMode === "BY_PIECE"
+                     ? "border-rose bg-rose/5 text-ink"
+                     : "border-line bg-white text-muted hover:border-espresso/30"
+                 }`}
+               >
+                 {t("byPiece")}
+               </button>
+             </div>
+           </div>

            {/* Supplier */}
```

### 1d. Replace the "Grams + Date" section (lines 524-541) with conditional fields

```diff
-           {/* Grams + Date */}
-           <div className="grid grid-cols-2 gap-4">
-             <Input
-               label={t("totalGrams")}
-               type="number"
-               value={totalGrams}
-               onChange={(e) => setTotalGrams(e.target.value)}
-               required
-               min={1}
-             />
-             <Input
-               label={t("stockedAt")}
-               type="date"
-               value={stockedAt}
-               onChange={(e) => setStockedAt(e.target.value)}
-             />
-           </div>
+           {/* Quantity fields — depend on selling mode */}
+           {isByPiece ? (
+             <>
+               <div className="grid grid-cols-2 gap-4">
+                 <Input
+                   label={t("totalPieces")}
+                   type="number"
+                   value={totalPieces}
+                   onChange={(e) => setTotalPieces(e.target.value)}
+                   required
+                   min={1}
+                 />
+                 <Input
+                   label={t("pieceWeight")}
+                   type="number"
+                   value={pieceWeightGrams}
+                   onChange={(e) => setPieceWeightGrams(e.target.value)}
+                   required
+                   min={1}
+                 />
+               </div>
+               {totalPieces && pieceWeightGrams && (
+                 <p className="text-xs text-muted -mt-3">
+                   {t("totalGrams")}: {parseInt(totalPieces) * parseInt(pieceWeightGrams)} g
+                 </p>
+               )}
+               <div className="grid grid-cols-2 gap-4">
+                 <Input
+                   label={`${t("pricePerPieceCzk")} (Kc/ks)`}
+                   type="number"
+                   value={pricePerPieceCzk}
+                   onChange={(e) => setPricePerPieceCzk(e.target.value)}
+                   required
+                   min={1}
+                   step="0.01"
+                 />
+                 <Input
+                   label={`${t("retailPricePerPieceCzk")} (Kc/ks)`}
+                   type="number"
+                   value={retailPricePerPieceCzk}
+                   onChange={(e) => setRetailPricePerPieceCzk(e.target.value)}
+                   required
+                   min={1}
+                   step="0.01"
+                 />
+               </div>
+             </>
+           ) : (
+             <div className="grid grid-cols-2 gap-4">
+               <Input
+                 label={t("totalGrams")}
+                 type="number"
+                 value={totalGrams}
+                 onChange={(e) => setTotalGrams(e.target.value)}
+                 required
+                 min={1}
+               />
+             </div>
+           )}
+           <Input
+             label={t("stockedAt")}
+             type="date"
+             value={stockedAt}
+             onChange={(e) => setStockedAt(e.target.value)}
+           />
```

### 1e. Modified submit body (replace lines 115-129)

```diff
    const body = {
      category,
      origin,
      texture,
      color,
      lengthCm,
      supplierId,
-     purchasePricePerGramRaw: Math.round(parseFloat(purchasePrice) * 100),
      currency: "CZK" as const,
      exchangeRate: 10000,
-     totalGrams: parseInt(totalGrams),
-     totalPieces: 0,
+     sellingMode,
+     ...(isByPiece
+       ? {
+           purchasePricePerGramRaw: 0,
+           totalGrams: parseInt(totalPieces) * parseInt(pieceWeightGrams),
+           totalPieces: parseInt(totalPieces),
+           pieceWeightGrams: parseInt(pieceWeightGrams),
+           pricePerPiece: Math.round(parseFloat(pricePerPieceCzk) * 100),
+           retailPricePerPiece: Math.round(parseFloat(retailPricePerPieceCzk) * 100),
+         }
+       : {
+           purchasePricePerGramRaw: Math.round(parseFloat(purchasePrice) * 100),
+           totalGrams: parseInt(totalGrams),
+           totalPieces: 0,
+         }),
      stockedAt: new Date(stockedAt).toISOString(),
      ...(note ? { note } : {}),
    };
```

### 1f. Purchase price field — hide for BY_PIECE, show for BY_GRAM

Wrap the existing `purchasePrice` Input (lines 514-522) in a condition:

```diff
-           {/* Purchase price */}
-           <Input
-             label={`${t("purchasePrice")} (Kc/g)`}
-             type="number"
-             value={purchasePrice}
-             onChange={(e) => setPurchasePrice(e.target.value)}
-             required
-             min={1}
-             step="0.01"
-           />
+           {/* Purchase price — only for BY_GRAM */}
+           {!isByPiece && (
+             <Input
+               label={`${t("purchasePrice")} (Kc/g)`}
+               type="number"
+               value={purchasePrice}
+               onChange={(e) => setPurchasePrice(e.target.value)}
+               required
+               min={1}
+               step="0.01"
+             />
+           )}
```

---

## 2. ProductGridCard.tsx (PHASE 5)

### 2a. Add piece fields to variant interface (line 11-17)

```diff
 interface ProductGridCardVariant {
   lengthCm: number;
   color: string;
   retailPricePerGram: number;
   wholesalePricePerGram?: number;
   availableGrams: number;
+  sellingMode?: "BY_GRAM" | "BY_PIECE";
+  retailPricePerPiece?: number;
+  wholesalePricePerPiece?: number;
+  availablePieces?: number;
 }
```

### 2b. Add piece-aware aggregation (after line 80)

```diff
  const totalStock = p.variants.reduce((sum, v) => sum + v.availableGrams, 0);
  const inStock = totalStock > 0;
+ // Check if any variant is BY_PIECE
+ const hasPieceVariants = p.variants.some(v => v.sellingMode === "BY_PIECE");
+ const totalPieces = p.variants.reduce((sum, v) => sum + (v.availablePieces ?? 0), 0);
+
+ // For BY_PIECE variants, find min piece price
+ const pieceVariants = p.variants.filter(v => v.sellingMode === "BY_PIECE" && (v.retailPricePerPiece ?? 0) > 0);
+ const minPiecePrice = pieceVariants.length > 0 ? Math.min(...pieceVariants.map(v => v.retailPricePerPiece!)) : 0;
```

### 2c. Replace the price+stock display block (lines 200-242)

The price block needs to handle both modes. Replace the existing price/stock `<div>` block:

```diff
      {/* Price + total stock */}
      <div className="flex items-baseline justify-between">
        {(() => {
-         if (minRetailPrice === 0) return null;
-         const priceDisplay = (minRetailPrice / 100).toFixed(0);
+         // BY_PIECE variant price
+         if (hasPieceVariants && minPiecePrice > 0) {
+           const priceDisplay = (minPiecePrice / 100).toFixed(0);
+           if (userRole === "SALON") {
+             const wholesalePieceVariants = pieceVariants.filter(v => v.wholesalePricePerPiece && v.wholesalePricePerPiece > 0);
+             if (wholesalePieceVariants.length > 0) {
+               const minB2B = Math.min(...wholesalePieceVariants.map(v => v.wholesalePricePerPiece!));
+               const b2bDisplay = (minB2B / 100).toFixed(0);
+               return (
+                 <div>
+                   <span className="text-[10px] text-muted line-through">{priceDisplay} Kc/ks</span>
+                   <div className="text-sm font-bold text-rose">{b2bDisplay} Kc<span className="text-[10px] font-normal">/ks</span></div>
+                 </div>
+               );
+             }
+           }
+           if (userRole === "HAIRDRESSER" && discountPct > 0) {
+             const b2bMin = Math.ceil(minPiecePrice * (10000 - discountPct) / 10000);
+             const b2bDisplay = (b2bMin / 100).toFixed(0);
+             return (
+               <div>
+                 <span className="text-[10px] text-muted line-through">{priceDisplay} Kc/ks</span>
+                 <div className="text-sm font-bold text-rose">{b2bDisplay} Kc<span className="text-[10px] font-normal">/ks</span></div>
+               </div>
+             );
+           }
+           return (
+             <div className="text-sm font-bold text-ink">
+               {priceDisplay} Kc<span className="text-[10px] font-normal text-muted">/ks</span>
+             </div>
+           );
+         }
+
+         // BY_GRAM variant price (existing logic)
+         if (minRetailPrice === 0) return null;
+         const priceDisplay = (minRetailPrice / 100).toFixed(0);

          if (userRole === "SALON") {
            // ... existing SALON logic unchanged ...
          }
          // ... rest of existing BY_GRAM logic unchanged ...
        })()}
-       <span className={`text-[10px] font-medium ${inStock ? "text-emerald-600" : "text-red-400"}`}>
-         {inStock ? `${totalStock} g` : t("inquiry.outOfStock")}
-       </span>
+       <span className={`text-[10px] font-medium ${inStock || totalPieces > 0 ? "text-emerald-600" : "text-red-400"}`}>
+         {hasPieceVariants
+           ? (totalPieces > 0 ? `${totalPieces} ks` : t("inquiry.outOfStock"))
+           : (inStock ? `${totalStock} g` : t("inquiry.outOfStock"))}
+       </span>
      </div>
```

---

## 3. offer/[slug]/page.tsx (PHASE 5)

### 3a. Add sellingMode to productSelect (after line 50)

```diff
      select: {
        id: true,
        lengthCm: true,
        color: true,
        retailPricePerGram: true,
        wholesalePricePerGram: true,
+       sellingMode: true,
+       pricePerPiece: true,
+       retailPricePerPiece: true,
      },
```

### 3b. Add availablePieces to variantsWithStock (lines 78-81)

```diff
  const variantsWithStock = product.variants.map((v) => ({
    ...v,
    availableGrams: stockMap.get(v.id)?.availableGrams ?? 0,
+   availablePieces: stockMap.get(v.id)?.availablePieces ?? 0,
  }));
```

### 3c. Extend pickerVariants to include piece data (lines 185-203)

```diff
  const pickerVariants = product.variants
    .filter((v) => v.retailPricePerGram > 0 || (v.pricePerPiece ?? 0) > 0)
    .map((v) => {
+     const isByPiece = v.sellingMode === "BY_PIECE";
      let displayPrice: number;
-     if (role === "HAIRDRESSER") {
-       displayPrice = roundHalereUp((v.retailPricePerGram * (10000 - discountPct)) / 10000);
-     } else if (role === "SALON") {
-       displayPrice = v.wholesalePricePerGram;
+     if (isByPiece) {
+       const piecePrice = v.pricePerPiece ?? 0;
+       if (role === "HAIRDRESSER") {
+         displayPrice = roundHalereUp((v.retailPricePerPiece! * (10000 - discountPct)) / 10000);
+       } else if (role === "SALON") {
+         displayPrice = piecePrice;
+       } else {
+         displayPrice = v.retailPricePerPiece ?? piecePrice;
+       }
      } else {
-       displayPrice = v.retailPricePerGram;
+       if (role === "HAIRDRESSER") {
+         displayPrice = roundHalereUp((v.retailPricePerGram * (10000 - discountPct)) / 10000);
+       } else if (role === "SALON") {
+         displayPrice = v.wholesalePricePerGram;
+       } else {
+         displayPrice = v.retailPricePerGram;
+       }
      }
      return {
        lengthCm: v.lengthCm,
        color: v.color,
        pricePerGram: displayPrice,
        retailPricePerGram: v.retailPricePerGram,
        availableGrams: v.availableGrams,
+       sellingMode: v.sellingMode ?? "BY_GRAM",
+       pricePerPiece: isByPiece ? displayPrice : undefined,
+       availablePieces: v.availablePieces,
      };
    });
```

### 3d. Price display — handle BY_PIECE (around lines 467-489)

In the price section, detect if the focused (or minimum-price) variant is BY_PIECE and show "/ks" instead of "/g":

```diff
+         const isByPiece = focusedVariant
+           ? focusedVariant.sellingMode === "BY_PIECE"
+           : pickerVariants.some(v => v.sellingMode === "BY_PIECE");
+         const priceUnit = isByPiece ? "/ks" : "/g";
          {/* Price */}
          {pricePerGram && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
-               <span className="text-xl font-bold text-ink">{formatCZK(pricePerGram)}/g</span>
+               <span className="text-xl font-bold text-ink">{formatCZK(pricePerGram)}{priceUnit}</span>
```

And in `priceTip100g` — only show for BY_GRAM:

```diff
-             {priceTip100g && (
+             {priceTip100g && !isByPiece && (
                <p className="text-sm text-muted">
                  {t("productDetail.priceTip", { price: formatCZK(priceTip100g) })}
                </p>
              )}
```

### 3e. Stock display — handle pieces (around lines 578-591)

In the availability spec box:

```diff
                 return (
                   <div className="flex items-center gap-2.5">
                     <span className="text-xl">✅</span>
                     <div>
                       <div className="text-[10px] uppercase tracking-wider text-muted font-medium">{t("productDetail.availabilityLabel")}</div>
-                      <div className={`text-sm font-semibold ${totalStock > 0 ? "text-emerald-700" : "text-red-500"}`}>
-                        {totalStock > 0 ? `${totalStock} g ${t("productDetail.inStock").toLowerCase()}` : t("inquiry.outOfStock")}
+                      <div className={`text-sm font-semibold ${totalStock > 0 || totalPieces > 0 ? "text-emerald-700" : "text-red-500"}`}>
+                        {(() => {
+                          const totalPieces = product.variants.reduce((sum, v) => sum + (v.availablePieces ?? 0), 0);
+                          const hasPieces = product.variants.some(v => v.sellingMode === "BY_PIECE");
+                          if (hasPieces && totalPieces > 0) return `${totalPieces} ks ${t("productDetail.inStock").toLowerCase()}`;
+                          if (totalStock > 0) return `${totalStock} g ${t("productDetail.inStock").toLowerCase()}`;
+                          return t("inquiry.outOfStock");
+                        })()}
                       </div>
                     </div>
                   </div>
```

---

## 4. AddToInquiryForm.tsx (PHASE 5)

### 4a. Extend PickerVariant interface (lines 9-15)

```diff
 interface PickerVariant {
   lengthCm: number;
   color: string;
   pricePerGram: number;
   retailPricePerGram: number;
   availableGrams: number;
+  sellingMode?: "BY_GRAM" | "BY_PIECE";
+  pricePerPiece?: number;
+  availablePieces?: number;
 }
```

### 4b. Update quantity logic for piece mode (around line 68-72)

```diff
  const selectedVariant = (selectedColor && selectedLength)
    ? variants.find(v => v.color === selectedColor && v.lengthCm === selectedLength)
    : null;
- const maxGrams = selectedVariant?.availableGrams ?? Infinity;
+ const isByPiece = selectedVariant?.sellingMode === "BY_PIECE";
+ const maxQty = isByPiece
+   ? (selectedVariant?.availablePieces ?? Infinity)
+   : (selectedVariant?.availableGrams ?? Infinity);
+ const qtyStep = isByPiece ? 1 : 50;
+ const minQty = isByPiece ? 1 : 50;
+ const unitLabel = isByPiece ? "ks" : "g";
```

### 4c. Update initial quantity (line 45)

```diff
- const [quantity, setQuantity] = useState(100);
+ const [quantity, setQuantity] = useState(100);
```

Keep initial as 100. But add an effect to reset quantity when variant changes:

```diff
+ // Reset quantity when variant changes
+ const prevVariantRef = useRef(selectedVariant);
+ useEffect(() => {
+   if (selectedVariant && selectedVariant !== prevVariantRef.current) {
+     const isBP = selectedVariant.sellingMode === "BY_PIECE";
+     setQuantity(isBP ? 1 : 100);
+     prevVariantRef.current = selectedVariant;
+   }
+ }, [selectedVariant]);
```

(Add `useRef, useEffect` to imports from React.)

### 4d. Update handleAdd — unit-aware (lines 73-86)

```diff
  const handleAdd = () => {
    if (!selectedLength || !selectedColor) return;
    addItem({
      productId,
      productName,
      lengthCm: selectedLength,
      color: selectedColor,
      quantity,
-     unit: "g",
+     unit: isByPiece ? "ks" : "g",
    });
```

### 4e. Length buttons — show price per piece for BY_PIECE variants (lines 134-161)

```diff
            {availableLengths.map((v) => {
              const isSelected = selectedLength === v.lengthCm;
-             const inStock = v.availableGrams > 0;
+             const vIsByPiece = v.sellingMode === "BY_PIECE";
+             const inStock = vIsByPiece ? (v.availablePieces ?? 0) > 0 : v.availableGrams > 0;
              return (
                <button ...>
                  <div className="font-medium text-ink">{v.lengthCm} cm</div>
                  <div className="text-xs text-muted">
-                   {formatPrice(v.pricePerGram)} Kc/g
+                   {vIsByPiece
+                     ? `${formatPrice(v.pricePerPiece ?? 0)} Kc/ks`
+                     : `${formatPrice(v.pricePerGram)} Kc/g`}
                  </div>
                  <div className={`text-[11px] ${inStock ? "text-emerald-600" : "text-red-400"}`}>
-                   {inStock ? `${v.availableGrams}g` : t("inquiry.outOfStock")}
+                   {inStock
+                     ? (vIsByPiece ? `${v.availablePieces} ks` : `${v.availableGrams}g`)
+                     : t("inquiry.outOfStock")}
                  </div>
                </button>
              );
            })}
```

### 4f. Quantity controls — dynamic step and unit (lines 169-198)

```diff
        <div className="flex-1">
          <div className="text-xs text-muted mb-1.5">{t("inquiry.quantityLabel")}</div>
          <div className="flex items-center gap-2">
            <button
-             onClick={() => setQuantity(Math.max(50, quantity - 50))}
+             onClick={() => setQuantity(Math.max(minQty, quantity - qtyStep))}
              className="w-8 h-8 rounded-lg border border-line bg-white text-muted flex items-center justify-center hover:bg-nude-50"
            >
              -
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => {
                const val = Math.max(1, parseInt(e.target.value) || 1);
-               setQuantity(maxGrams !== Infinity ? Math.min(val, maxGrams) : val);
+               setQuantity(maxQty !== Infinity ? Math.min(val, maxQty) : val);
              }}
-             max={maxGrams !== Infinity ? maxGrams : undefined}
+             max={maxQty !== Infinity ? maxQty : undefined}
+             step={qtyStep}
              className="w-20 text-center text-sm border border-line rounded-lg py-1.5 focus:outline-none focus:ring-2 focus:ring-rose"
            />
            <button
-             onClick={() => setQuantity(Math.min(quantity + 50, maxGrams !== Infinity ? maxGrams : quantity + 50))}
+             onClick={() => setQuantity(Math.min(quantity + qtyStep, maxQty !== Infinity ? maxQty : quantity + qtyStep))}
              className="w-8 h-8 rounded-lg border border-line bg-white text-muted flex items-center justify-center hover:bg-nude-50"
            >
              +
            </button>
-           <span className="text-xs text-muted">g</span>
-           {maxGrams !== Infinity && (
-             <span className="text-[11px] text-muted">max {maxGrams}g</span>
+           <span className="text-xs text-muted">{unitLabel}</span>
+           {maxQty !== Infinity && (
+             <span className="text-[11px] text-muted">max {maxQty}{unitLabel}</span>
            )}
          </div>
        </div>

        <button
          onClick={handleAdd}
-         disabled={!selectedLength || !selectedColor || quantity > maxGrams}
+         disabled={!selectedLength || !selectedColor || quantity > maxQty}
          className={`... ${
            added
              ? "bg-emerald-600 text-white"
-             : !selectedLength || !selectedColor || quantity > maxGrams
+             : !selectedLength || !selectedColor || quantity > maxQty
                ? "bg-nude-100 text-muted cursor-not-allowed"
                : "bg-rose text-white hover:bg-rose-deep"
          }`}
```

---

## 5. InquiryCartClient.tsx — CartItemRow (PHASE 5)

### 5a. Dynamic step and unit display in CartItemRow (lines 198-206)

```diff
 function CartItemRow({ item, onRemove, onUpdateQty }: { ... }) {
+  const step = item.unit === "ks" ? 1 : 50;
+  const minQty = item.unit === "ks" ? 1 : 50;
   return (
     <div className="flex items-center gap-3 bg-white rounded-xl border border-line p-3">
       ...
       <div className="flex items-center gap-1.5">
         <button
-          onClick={() => onUpdateQty(Math.max(50, item.quantity - 50))}
+          onClick={() => onUpdateQty(Math.max(minQty, item.quantity - step))}
           className="w-7 h-7 rounded-lg border border-line bg-white text-muted flex items-center justify-center hover:bg-nude-50 text-sm"
         >
           -
         </button>
-        <span className="text-sm font-medium w-12 text-center">{item.quantity}g</span>
+        <span className="text-sm font-medium w-12 text-center">{item.quantity}{item.unit}</span>
         <button
-          onClick={() => onUpdateQty(item.quantity + 50)}
+          onClick={() => onUpdateQty(item.quantity + step)}
           className="w-7 h-7 rounded-lg border border-line bg-white text-muted flex items-center justify-center hover:bg-nude-50 text-sm"
         >
           +
         </button>
       </div>
```

---

## 6. CatalogClient.tsx (PHASE 5)

### 6a. Extend CatalogVariant interface (lines 8-15)

```diff
 interface CatalogVariant {
   id: string;
   lengthCm: number;
   color: string;
   pricePerGram: number;
   availableGrams: number;
   availablePieces: number;
+  sellingMode?: "BY_GRAM" | "BY_PIECE";
+  pricePerPiece?: number;
 }
```

### 6b. Extend CartItem to support pieces (lines 30-37)

```diff
 interface CartItem {
   variantId: string;
   grams: number;
+  pieces: number;
   productName: string;
   lengthCm: number;
   color: string;
   pricePerGram: number;
+  pricePerPiece?: number;
+  sellingMode?: "BY_GRAM" | "BY_PIECE";
 }
```

### 6c. Update cart total calculation (lines 101-103)

```diff
  const cartItems = Array.from(cart.values());
- const cartTotal = cartItems.reduce((sum, item) => sum + item.grams * item.pricePerGram, 0);
- const cartTotalGrams = cartItems.reduce((sum, item) => sum + item.grams, 0);
+ const cartTotal = cartItems.reduce((sum, item) => {
+   if (item.sellingMode === "BY_PIECE") return sum + item.pieces * (item.pricePerPiece ?? 0);
+   return sum + item.grams * item.pricePerGram;
+ }, 0);
+ const cartTotalGrams = cartItems.reduce((sum, item) => sum + item.grams, 0);
+ const cartTotalPieces = cartItems.reduce((sum, item) => sum + item.pieces, 0);
```

### 6d. Update submitOrder body (lines 113-118)

```diff
          items: cartItems.map((item) => ({
            variantId: item.variantId,
-           grams: item.grams,
-           pieces: 0,
+           grams: item.sellingMode === "BY_PIECE" ? 0 : item.grams,
+           pieces: item.sellingMode === "BY_PIECE" ? item.pieces : 0,
          })),
```

### 6e. Variant table — price and stock columns (lines 269-298)

```diff
                      <tr key={v.id} className={`hover:bg-nude-50/50 ${inCart > 0 ? "bg-rose/5" : ""}`}>
                        <td className="px-4 py-2 text-ink font-medium whitespace-nowrap">
                          {v.lengthCm} cm
                        </td>
                        <td className="px-4 py-2">
                          ...color swatch...
                        </td>
                        <td className="px-4 py-2 text-right text-ink font-medium whitespace-nowrap">
-                         {formatCZK(v.pricePerGram)} Kc/g
+                         {v.sellingMode === "BY_PIECE"
+                           ? `${formatCZK(v.pricePerPiece ?? 0)} Kc/ks`
+                           : `${formatCZK(v.pricePerGram)} Kc/g`}
                        </td>
                        <td className="px-4 py-2 text-right whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
-                           {v.availableGrams} g
+                           {v.sellingMode === "BY_PIECE"
+                             ? `${v.availablePieces} ks`
+                             : `${v.availableGrams} g`}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="inline-flex items-center gap-1">
+                           {v.sellingMode === "BY_PIECE" ? (
+                             <input
+                               type="number"
+                               min={0}
+                               max={v.availablePieces}
+                               value={inCart || ""}
+                               placeholder="ks"
+                               onChange={(e) => {
+                                 const val = Math.min(parseInt(e.target.value) || 0, v.availablePieces);
+                                 updateCart(v.id, 0, {
+                                   productName: product.name,
+                                   lengthCm: v.lengthCm,
+                                   color: v.color,
+                                   pricePerGram: 0,
+                                   pricePerPiece: v.pricePerPiece,
+                                   pieces: val,
+                                   sellingMode: "BY_PIECE",
+                                 });
+                               }}
+                               className="w-16 px-2 py-1 text-right text-sm border border-line rounded-lg focus:outline-none focus:ring-1 focus:ring-rose"
+                             />
+                           ) : (
                            <input
                              type="number"
                              min={0}
                              max={v.availableGrams}
                              value={inCart || ""}
                              placeholder="g"
                              onChange={(e) => {
                                const val = Math.min(parseInt(e.target.value) || 0, v.availableGrams);
                                updateCart(v.id, val, {
                                  productName: product.name,
                                  lengthCm: v.lengthCm,
                                  color: v.color,
                                  pricePerGram: v.pricePerGram,
+                                 pieces: 0,
+                                 sellingMode: "BY_GRAM",
                                });
                              }}
                              className="w-16 px-2 py-1 text-right text-sm border border-line rounded-lg focus:outline-none focus:ring-1 focus:ring-rose"
                            />
-                           <span className="text-xs text-muted">g</span>
+                           )}
+                           <span className="text-xs text-muted">{v.sellingMode === "BY_PIECE" ? "ks" : "g"}</span>
                          </div>
                        </td>
                      </tr>
```

**NOTE:** The `updateCart` function signature needs adjustment to accept the extended CartItem. Since `updateCart` uses `Omit<CartItem, "variantId" | "grams">`, adding `pieces`, `pricePerPiece`, and `sellingMode` to CartItem will automatically make them available in the meta parameter.

### 6f. Floating cart bar — show pieces alongside grams (lines 322-327)

```diff
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink">
-                 {t("cartItems", { count: cartItems.length })} &middot; {cartTotalGrams} g
+                 {t("cartItems", { count: cartItems.length })}
+                 {cartTotalGrams > 0 && ` · ${cartTotalGrams} g`}
+                 {cartTotalPieces > 0 && ` · ${cartTotalPieces} ks`}
                </div>
```

---

## 7. public/products/route.ts (PHASE 5)

### 7a. Add sellingMode + piece prices to variant select (lines 66-71)

```diff
          select: {
            id: true,
            lengthCm: true,
            color: true,
            retailPricePerGram: true,
            wholesalePricePerGram: true,
+           sellingMode: true,
+           pricePerPiece: true,
+           retailPricePerPiece: true,
          },
```

### 7b. Add piece data to response (lines 83-90)

```diff
        const variantsWithStock = p.variants.map((v) => {
          const stock = stockMap.get(v.id);
          return {
            lengthCm: v.lengthCm,
            color: v.color,
            retailPricePerGram: v.retailPricePerGram,
            wholesalePricePerGram: v.wholesalePricePerGram,
            availableGrams: stock?.availableGrams ?? 0,
+           sellingMode: v.sellingMode ?? "BY_GRAM",
+           retailPricePerPiece: v.retailPricePerPiece,
+           availablePieces: stock?.availablePieces ?? 0,
          };
        });
```

---

## 8. salon-portal/catalog/route.ts (PHASE 5)

### 8a. Add piece pricing logic (lines 50-72)

```diff
      .map((v) => {
        const stock = stockMap.get(v.id);
+       const isByPiece = v.sellingMode === "BY_PIECE";

        let price: number;
-       if (isHairdresser) {
-         price = roundHalereUp(
-           (v.retailPricePerGram * (10000 - hairdresserDiscountPct)) / 10000
-         );
+       let pricePerPiece: number | undefined;
+
+       if (isByPiece) {
+         const basePiece = v.pricePerPiece ?? 0;
+         const retailPiece = v.retailPricePerPiece ?? basePiece;
+         if (isHairdresser) {
+           pricePerPiece = roundHalereUp((retailPiece * (10000 - hairdresserDiscountPct)) / 10000);
+         } else {
+           pricePerPiece = loyaltyDiscount > 0
+             ? roundHalereUp((basePiece * (10000 - loyaltyDiscount)) / 10000)
+             : basePiece;
+         }
+         price = 0; // not used for BY_PIECE
        } else {
-         price =
-           loyaltyDiscount > 0
-             ? roundHalereUp(
-                 (v.wholesalePricePerGram * (10000 - loyaltyDiscount)) /
-                   10000
-               )
-             : v.wholesalePricePerGram;
+         if (isHairdresser) {
+           price = roundHalereUp(
+             (v.retailPricePerGram * (10000 - hairdresserDiscountPct)) / 10000
+           );
+         } else {
+           price =
+             loyaltyDiscount > 0
+               ? roundHalereUp(
+                   (v.wholesalePricePerGram * (10000 - loyaltyDiscount)) / 10000
+                 )
+               : v.wholesalePricePerGram;
+         }
        }

        return {
          id: v.id,
          lengthCm: v.lengthCm,
          color: v.color,
          pricePerGram: price,
          availableGrams: stock?.availableGrams ?? 0,
          availablePieces: stock?.availablePieces ?? 0,
+         sellingMode: v.sellingMode ?? "BY_GRAM",
+         pricePerPiece,
        };
      })
-     .filter((v) => v.availableGrams > 0);
+     .filter((v) => v.sellingMode === "BY_PIECE" ? (stock?.availablePieces ?? 0) > 0 : v.availableGrams > 0);
```

**NOTE:** The `.filter` needs access to `stock` — restructure the map/filter to use `stockMap.get(v.id)` within the filter callback. Alternatively, filter on the returned object's `availablePieces` / `availableGrams`:

```typescript
.filter((v) => v.sellingMode === "BY_PIECE" ? v.availablePieces > 0 : v.availableGrams > 0);
```

---

## 9. i18n Keys

### cs.json — add to "stock" section (after `"wizDetails"`)

```json
    "sellingMode": "Režim prodeje",
    "byGram": "Na gramy",
    "byPiece": "Na kusy (culíky)",
    "pricePerPieceCzk": "Prodejní cena za kus",
    "retailPricePerPieceCzk": "Maloobchodní cena za kus"
```

### uk.json — add to "stock" section

```json
    "sellingMode": "Режим продажу",
    "byGram": "На грами",
    "byPiece": "На штуки (хвостики)",
    "pricePerPieceCzk": "Ціна за штуку",
    "retailPricePerPieceCzk": "Роздрібна ціна за штуку"
```

### ru.json — add to "stock" section

```json
    "sellingMode": "Режим продажи",
    "byGram": "На граммы",
    "byPiece": "На штуки (хвостики)",
    "pricePerPieceCzk": "Цена за штуку",
    "retailPricePerPieceCzk": "Розничная цена за штуку"
```

---

## Implementation Notes

1. **No changes needed** in `fifo.ts`, `stock.ts`, `invoicing.ts`, `inquiry-cart.tsx` — all already support pieces.

2. **ProductGridCard uses existing interface pattern** — `sellingMode` and piece fields are optional (`?`) so existing BY_GRAM-only code keeps working without changes until API returns the new fields.

3. **CatalogClient CartItem** needs the `pieces` field added — the `updateCart` helper uses `Omit<CartItem, "variantId" | "grams">` for the meta parameter, so adding `pieces`/`pricePerPiece`/`sellingMode` to the interface automatically makes them available.

4. **salon-portal/catalog filter** — currently filters `v.availableGrams > 0`. For BY_PIECE variants this would incorrectly hide them if they have 0 grams but >0 pieces. The fix: filter by `availablePieces > 0` for BY_PIECE.

5. **Backward compatibility** — All new fields use `?` optional syntax, `?? "BY_GRAM"` defaults, and `?? 0` fallbacks so existing data (which won't have sellingMode set) continues to work as BY_GRAM.
