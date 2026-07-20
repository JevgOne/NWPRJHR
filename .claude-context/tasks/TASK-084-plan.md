# QR Scanner in Reservation Form + Reservation Toggle in Sale Wizard

## Requirements

Two things from user:
1. **NewReservationForm must have QR scanner** — same scanning capability as NewSaleWizard
2. **NewSaleWizard must have "Reserve this" toggle** — when enabled, submit creates a reservation instead of a sale

This supersedes the TASK-083 ScanActionChooser approach. Instead of an intermediate chooser page, the toggle lives directly in the sale wizard.

---

## Part 1: QR Scanner in NewReservationForm

### What to do

The `NewReservationForm` (from TASK-082) needs the same scanner integration as `NewSaleWizard`:
- "Scan QR" button + "Manual select" button
- BarcodeScanner component (fullscreen camera overlay)
- handleBarcodeScan callback that extracts variantId from QR URL or barcode

### Implementation

In `src/app/(app)/reservations/new/NewReservationForm.tsx`, add:

```tsx
import { BarcodeScanner } from "@/components/BarcodeScanner";

// State
const [scannerOpen, setScannerOpen] = useState(false);

// Handler — same pattern as NewSaleWizard lines 246-278
const handleBarcodeScan = useCallback(async (scanned: string) => {
  setScannerOpen(false);

  let variantId: string | null = null;
  const urlMatch = scanned.match(/variantId=([a-zA-Z0-9_-]+)/);
  if (urlMatch) {
    variantId = urlMatch[1];
  } else {
    const res = await fetch(`/api/deliveries/barcode/${encodeURIComponent(scanned)}`);
    if (!res.ok) {
      setError(t("barcodeNotFound"));
      return;
    }
    const delivery = await res.json();
    variantId = delivery.variantId;
  }

  if (!variantId) return;
  setSelectedVariantId(variantId);
  // Auto-populate product info from variant
  await loadVariantInfo(variantId);
}, [t]);

// In JSX — same button layout as NewSaleWizard
<div className="flex gap-2">
  <Button size="lg" className="flex-1" onClick={() => setScannerOpen(true)}>
    {t("scanBarcode")}
  </Button>
  <Button variant="secondary" size="lg" className="flex-1" onClick={() => setShowProductPicker(!showProductPicker)}>
    {t("manualSelect")}
  </Button>
</div>

<BarcodeScanner active={scannerOpen} onScan={handleBarcodeScan} onClose={() => setScannerOpen(false)} />
```

### Note on BarcodeScanner translations
BarcodeScanner currently uses `useTranslations("sale")` for its internal strings (`scanBarcode`, `manualEntry`, `barcodeNotFound`, `cameraPermission`, `scannerNotSupported`). These translations already exist in the `sale` namespace. Since the component is self-contained with its own `useTranslations`, it works without changes — the reservation form just needs the same keys. The `sale` namespace translations are shared.

---

## Part 2: Reservation Toggle in NewSaleWizard

### Where to place the toggle

The toggle should appear in the **Summary + Submit** card at the bottom (after payment type, before submit button). This is the natural decision point — user has already selected customer, items, and quantities. Now they decide: "sell now" or "reserve for later".

### UI Design

Add a toggle/switch between the Payment Type card and the Submit button:

```
┌─────────────────────────────────────┐
│  Payment Type: [Transfer] [Cash]... │  ← hidden when reserveMode is ON
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  ☐ Rezervovat místo prodeje         │
│                                     │
│  (when checked, shows:)             │
│  Datum splatnosti: [____date____]   │
│  Poznámka: [________________]       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Summary...                         │
│                                     │
│  [  Dokončit prodej  ]    ← green   │
│  or                                 │
│  [ Vytvořit rezervaci ]   ← blue    │
└─────────────────────────────────────┘
```

### State changes in NewSaleWizard

```tsx
// New state
const [reserveMode, setReserveMode] = useState(false);
const [paymentDueDate, setPaymentDueDate] = useState<string>(
  // Default: 3 days from now
  new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
);
const [reservationNote, setReservationNote] = useState("");
```

### What changes when reserveMode is ON:

1. **Payment Type card is hidden** — reservations always use TRANSFER (invoice generated automatically)
2. **Discount card is hidden** — price is fixed at reservation time, no discounts on reservations
3. **Submit button changes**:
   - Text: "Vytvořit rezervaci" (blue instead of green)
   - Calls `POST /api/reservations` instead of `POST /api/sales`
4. **Date picker appears** — for payment deadline
5. **Note field appears** — optional reservation note

### Modified handleSubmit

```tsx
const handleSubmit = async () => {
  setSubmitting(true);
  setError("");

  if (reserveMode) {
    // === RESERVATION FLOW ===
    // Only first item — reservation is single-variant
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
  } else {
    // === EXISTING SALE FLOW (unchanged) ===
    // ... current code ...
  }
};
```

### JSX for reservation toggle (between Discount/Payment cards and Summary)

```tsx
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
            {tReservation("paymentDueDate")}
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
            {tReservation("note") ?? "Poznámka"}
          </label>
          <input
            type="text"
            value={reservationNote}
            onChange={(e) => setReservationNote(e.target.value)}
            placeholder={tReservation("notePlaceholder") ?? "Volitelná poznámka..."}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>
    )}
  </Card>
)}

{/* Discount — hide when reserveMode */}
{!reserveMode && (
  <Card>
    <DiscountForm ... />
  </Card>
)}

{/* Payment type — hide when reserveMode */}
{!reserveMode && (
  <Card>
    {/* ... existing payment type selector ... */}
  </Card>
)}
```

### Submit button change

```tsx
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
      : t("completeSale")
  }
</Button>
```

---

## Part 3: TASK-083 Update

TASK-083 proposed a ScanActionChooser page that intercepts QR scans at `/sales/new?variantId=XXX`. With this new approach (toggle inside wizard), the ScanActionChooser is **no longer needed**. The flow becomes:

- QR scan → `/sales/new?variantId=XXX` → NewSaleWizard loads with item pre-filled → user can toggle "Reserve" checkbox → submit as reservation or sale
- OR: Navigate to `/reservations/new` → scan QR there → fill reservation form

Both paths now support QR scanning. The ScanActionChooser from TASK-083 should be dropped.

---

## Translations to Add

### `messages/cs.json` — in `sale` section:
```json
"reserveInstead": "Rezervovat místo prodeje",
"reserveInsteadHint": "Vytvoří rezervaci s platbou na termín místo okamžitého prodeje",
"reserve": "Rezervovat",
"reserveDescription": "Vytvořit rezervaci s platbou na termín"
```

### `messages/cs.json` — in `reservation` section (from TASK-082):
```json
"notePlaceholder": "Volitelná poznámka k rezervaci..."
```

Same keys for `uk.json` and `ru.json` with appropriate translations.

---

## Files to Create/Modify

### Modified files:
- `src/app/(app)/sales/new/NewSaleWizard.tsx` — add reserveMode state, toggle UI, conditional submit to /api/reservations
- `src/app/(app)/reservations/new/NewReservationForm.tsx` — add BarcodeScanner integration (TASK-082 file)
- `messages/cs.json` — add reservation toggle translations
- `messages/uk.json` — add reservation toggle translations
- `messages/ru.json` — add reservation toggle translations

### Files NOT needed (superseded):
- ~~`src/app/(app)/sales/new/ScanActionChooser.tsx`~~ — from TASK-083, no longer needed

---

## Implementation Order

1. First implement TASK-082 (reservation system — API, model, pages)
2. Then this task:
   a. Add BarcodeScanner to NewReservationForm
   b. Add reservation toggle to NewSaleWizard
   c. Add translations
3. TASK-083 ScanActionChooser is dropped

## Edge Cases

- **Multiple items + reserve mode**: Reservation model is single-variant. If user has multiple items and toggles reserve mode, show warning: "Reservation supports only one product. Remove extra items or create separate reservations." Alternatively, only show the toggle when items.length === 1. The simplest approach: when reserveMode is ON, only use `items[0]` and show a note that only the first item will be reserved.
- **Reserve mode + discount**: Discounts are not supported on reservations. The discount card is hidden when reserveMode is active.
- **Reserve mode + payment type**: Payment type selector is hidden. Reservations always generate an invoice (TRANSFER).
