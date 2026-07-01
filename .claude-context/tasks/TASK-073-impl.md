# TASK-073: Kolecko stesti — spin-to-win Implementation

## What was done

Implemented a spin-to-win marketing wheel popup on the public website. Customers enter email, spin the wheel, and can win discount codes (5-25%) that are automatically created as PromoCode entries and emailed.

## Database

### Turso SQL
```sql
CREATE TABLE spin_entries (id, email UNIQUE, segment, won, discountPercent, promoCodeId, ipAddress, createdAt)
```
- 2 indexes: email (unique), createdAt

### Prisma
- Added `SpinEntry` model to `prisma/schema.prisma`

## New files

### `src/app/api/public/spin/route.ts`
- POST endpoint accepting `{ email }`
- Rate limiting: 5 per IP per hour
- Email uniqueness check (409 if already played)
- Server-side weighted RNG for segment selection
- Segment probabilities: 5%(18%), miss(15%), 10%(12%), miss(15%), miss(13%), 15%(5%), miss(12%), 20%(3%), miss(6%), 25%(1%)
- Win rate: 39% total
- On win: creates PromoCode (PERCENT, single-use, 30-day expiry, code format SPIN-XXXXXX)
- On win: sends HTML email via Resend with the code
- Returns `{ segment, won, discountPercent? }` (code NOT returned to client — only via email)

### `src/components/public/SpinWheel.tsx`
- Animated SVG wheel with 10 colored segments
- CSS transition animation: 4s ease-out, 5 full rotations + target segment
- Brand colors (rose, gold, nude tones)
- States: idle (email input), spinning, result-win (with confetti), result-lose, already-played, error
- Confetti on win (reuses existing canvas-confetti dependency)

### `src/components/public/SpinWheelPopup.tsx`
- Modal overlay wrapper with trigger logic
- Shows after 10s on page (timer)
- Respects localStorage:
  - `spin-played` — never show again
  - `spin-dismissed` — don't show for 7 days after dismiss
- Close button, click-outside-to-close
- Responsive (works on mobile)

## Modified files

### `src/app/(public)/layout.tsx`
- Added `<SpinWheelPopup />` next to `<BatchPopup />`

### `prisma/schema.prisma`
- Added SpinEntry model

### `messages/cs.json`, `messages/uk.json`, `messages/ru.json`
- Added `spinWheel` namespace with all translation keys (title, subtitle, segment labels, states, buttons)

## Security
- Server-side RNG (segment never determined on client)
- Rate limiting (5/hour/IP)
- Email uniqueness (DB UNIQUE index)
- Promo codes: single-use, 30-day expiry
- Full code only sent via email, not returned in API response
