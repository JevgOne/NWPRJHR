# QR Scan → Reservation Integration Plan

## Problem

QR codes on product labels point directly to `/sales/new?variantId=XXX`. When user scans QR, they land in NewSaleWizard and can only create a sale. There is no way to create a reservation from a QR scan.

User expects: scan QR -> choose between "Sell" or "Reserve".

## Current QR Flow Analysis

### QR URL generation (4 places — all produce the same URL):
1. `src/components/inventory/QrLabelSheet.tsx:40` — printed labels
2. `src/components/inventory/StockInForm.tsx:350` — after stock-in
3. `src/components/products/VariantTable.tsx:69` — product admin
4. `src/app/(app)/inventory/InventoryClient.tsx:71` — inventory page

All generate: `{origin}/sales/new?variantId={variantId}`

### Current scan handling:
- URL lands on `src/app/(app)/sales/new/page.tsx`
- `searchParams.variantId` is passed to `NewSaleWizard` as `initialVariantId`
- Wizard auto-adds the item and starts the sale flow

### BarcodeScanner component (`src/components/BarcodeScanner.tsx`):
- Used INSIDE NewSaleWizard for scanning additional items
- Returns raw scanned string to `onScan` callback
- NewSaleWizard parses `variantId=` from URL or looks up barcode via `/api/deliveries/barcode/`

---

## Solution: Action Chooser Page

**Best approach: Create a new intermediate page `/scan` that shows after QR scan, offering both options.**

### Why NOT modify the QR URL itself?
- Existing printed QR labels in the warehouse already point to `/sales/new?variantId=XXX`
- Changing the URL would break ALL existing labels
- We need backward compatibility

### Why NOT add a button inside NewSaleWizard?
- Mixing sale and reservation logic in one wizard makes it complex
- The reservation form has different fields (payment deadline, no payment type selector, etc.)
- User intent should be declared BEFORE starting the flow

### Chosen approach: **Redirect `/sales/new?variantId=XXX` to an action chooser**

When `/sales/new` receives a `variantId` query param (meaning it came from QR scan), show a choice screen first:
- "Prodat" (Sell) → proceeds with current NewSaleWizard
- "Rezervovat" (Reserve) → redirects to `/reservations/new?variantId=XXX`

If no `variantId` in URL (user navigated to /sales/new manually), skip the chooser and show NewSaleWizard directly.

---

## Implementation Plan

### Step 1: Modify `src/app/(app)/sales/new/page.tsx`

When `variantId` is present in searchParams, render a new `ScanActionChooser` component instead of `NewSaleWizard`. When no `variantId`, render `NewSaleWizard` directly (current behavior).

```tsx
// Pseudo-code for page.tsx
export default async function NewSalePage({ searchParams }) {
  const params = await searchParams;
  const session = await auth();
  if (!session) redirect("/login");

  // If variantId present (QR scan), show action chooser
  if (params.variantId) {
    // Fetch variant info for display
    const variant = await prisma.variant.findUnique({...});
    return <ScanActionChooser variantId={params.variantId} variantInfo={...} />;
  }

  // Normal flow — no QR scan, go straight to wizard
  const products = await prisma.product.findMany({...});
  return <NewSaleWizard products={productOptions} role={session.user.role} />;
}
```

### Step 2: Create `src/app/(app)/sales/new/ScanActionChooser.tsx`

A simple "use client" component showing:
- Product info (name, length, color — from fetched variant)
- Two large buttons:
  - **"Prodat"** (green) → sets state to show NewSaleWizard with initialVariantId
  - **"Rezervovat"** (blue) → `router.push('/reservations/new?variantId=XXX')`

```tsx
"use client";

interface ScanActionChooserProps {
  variantId: string;
  variantLabel: string; // e.g. "Virgin Hair 50cm Blonde"
  role: Role;
  products: ProductOption[]; // needed to pass to NewSaleWizard if user chooses sell
}

export function ScanActionChooser({ variantId, variantLabel, role, products }) {
  const [action, setAction] = useState<"choose" | "sell">("choose");
  const router = useRouter();
  const t = useTranslations("sale");

  if (action === "sell") {
    return <NewSaleWizard products={products} role={role} initialVariantId={variantId} />;
  }

  return (
    <div className="max-w-sm mx-auto space-y-6 pt-8">
      <Card>
        <div className="text-center space-y-2">
          <p className="text-sm text-muted">{t("scannedProduct")}</p>
          <p className="font-bold text-lg">{variantLabel}</p>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={() => setAction("sell")}
          className="p-6 rounded-xl border-2 border-green-500 bg-green-50 hover:bg-green-100 text-center transition-colors"
        >
          <div className="text-2xl font-bold text-green-700">{t("sell")}</div>
          <div className="text-sm text-green-600 mt-1">{t("sellDescription")}</div>
        </button>

        <button
          onClick={() => router.push(`/reservations/new?variantId=${variantId}`)}
          className="p-6 rounded-xl border-2 border-blue-500 bg-blue-50 hover:bg-blue-100 text-center transition-colors"
        >
          <div className="text-2xl font-bold text-blue-700">{t("reserve")}</div>
          <div className="text-sm text-blue-600 mt-1">{t("reserveDescription")}</div>
        </button>
      </div>
    </div>
  );
}
```

### Step 3: Update `src/app/(app)/reservations/new/page.tsx`

Accept `variantId` from searchParams (same pattern as sales/new):

```tsx
export default async function NewReservationPage({ searchParams }) {
  const params = await searchParams;
  // ... auth check ...
  // ... fetch products ...
  return <NewReservationForm products={...} role={...} initialVariantId={params.variantId} />;
}
```

The `NewReservationForm` component (from TASK-082) should handle `initialVariantId` the same way `NewSaleWizard` does — auto-add the variant item.

### Step 4: Add translations

Add to `messages/cs.json` in the `sale` section:
```json
"scannedProduct": "Naskenovaný produkt",
"sell": "Prodat",
"sellDescription": "Vytvořit prodej a odečíst ze skladu",
"reserve": "Rezervovat",
"reserveDescription": "Vytvořit rezervaci s platbou na termín"
```

Same for `uk.json` and `ru.json`.

---

## Files to Create/Modify

### New files:
- `src/app/(app)/sales/new/ScanActionChooser.tsx` — action chooser component

### Modified files:
- `src/app/(app)/sales/new/page.tsx` — conditional render: QR scan → chooser, manual → wizard
- `src/app/(app)/reservations/new/page.tsx` — accept `variantId` searchParam (part of TASK-082)
- `messages/cs.json` — add chooser translations
- `messages/uk.json` — add chooser translations
- `messages/ru.json` — add chooser translations

### NO changes needed to:
- QR URL generation (backward compatible — same URL, different landing behavior)
- BarcodeScanner component (unchanged — still used inside wizards)
- QR labels (existing printed labels keep working)

---

## Key Design Decisions

1. **No QR URL change** — existing printed labels in warehouse remain valid
2. **Chooser only on QR scan** — when navigating manually to /sales/new (no variantId), the wizard loads directly as before
3. **Products fetched always** — the chooser page pre-fetches products so if user clicks "Sell", the wizard renders instantly without another server fetch
4. **ScanActionChooser renders NewSaleWizard inline** — no redirect back, just swaps component. This avoids double page load.
5. **Reserve button redirects to /reservations/new** — clean separation, reservation has its own form with different fields (payment deadline etc.)

## Dependency

This task depends on TASK-082 (reservation system) being implemented first — specifically the `/reservations/new` page must exist for the "Reserve" button to work. However, the `ScanActionChooser` component can be implemented in parallel and will work as soon as the reservation page is available.
