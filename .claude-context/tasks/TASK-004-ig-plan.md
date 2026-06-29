# TASK-004: IG/FB generator textu v admin panelu

## Overview

Add a "Generate post" button to the admin product detail page (`ProductDetailClient.tsx`) that generates ready-to-copy Instagram/Facebook post text based on product data (name, colors, lengths, texture, origin, price, processing type).

**Approach: Template-based** — no AI API needed. Uses string templates with emojis and hashtags.

## Current State

- **Admin product detail**: `src/app/(app)/products/[id]/ProductDetailClient.tsx` — owner-only page with product info, photos, variants table
- **Product data available in component** (via `ProductDetail` interface):
  - `name`, `nameUk`, `nameRu`, `description`
  - `category` (VIRGIN/PREMIUM/STANDARD/SALE)
  - `processingType` (CLIP_IN/TAPE_IN/KERATIN/WEFT/MICRO_RING/OTHER)
  - `origin` (e.g. "Ukrajina")
  - `texture` (e.g. "Rovne", "Vlnite")
  - `photos` (JSON string of URLs)
  - `variants[]` with `lengthCm`, `color`, `retailPricePerGram`
- **Color system**: `src/lib/hair-colors.ts` — codes 1-10, i18n nameKeys
- **Origin flags**: `src/lib/origin-flags.ts` — country name -> flag emoji mapping

## Implementation Plan

### Step 1: Create post generator utility
**New file:** `src/lib/social-post-generator.ts`

This is a pure function that takes product data and returns formatted post text. No React, no API calls.

```typescript
import { getOriginFlag } from "./origin-flags";

interface PostProductData {
  name: string;
  category: string;
  processingType: string;
  origin?: string | null;
  texture?: string | null;
  lengths: number[];       // unique sorted lengths from variants
  colors: string[];        // unique color codes from variants
  minPrice?: number;       // min retailPricePerGram in halere
  productUrl: string;      // e.g. "https://hairland.cz/offer/{id}"
}

const CATEGORY_EMOJI: Record<string, string> = {
  VIRGIN: "👑",
  PREMIUM: "💎",
  STANDARD: "✨",
  SALE: "🔥",
};

const PROCESSING_LABELS: Record<string, string> = {
  CLIP_IN: "Clip-in",
  TAPE_IN: "Tape-in",
  KERATIN: "Keratinove",
  WEFT: "Weft",
  MICRO_RING: "Micro ring",
  OTHER: "",
};

const CATEGORY_HASHTAGS: Record<string, string> = {
  VIRGIN: "#virginvlasy #virginhaircz",
  PREMIUM: "#premiumvlasy #premiumhair",
  STANDARD: "#vlasykprodlouzeni",
  SALE: "#slevavlasy #akce",
};

const PROCESSING_HASHTAGS: Record<string, string> = {
  CLIP_IN: "#clipin #clipinvlasy #clipinhair",
  TAPE_IN: "#tapein #tapeinvlasy #tapeinextensions",
  KERATIN: "#keratinextensions #keratinove",
  WEFT: "#wefthair #weftextensions",
  MICRO_RING: "#microring #microringextensions",
  OTHER: "",
};

export function generateInstagramPost(data: PostProductData): string {
  const emoji = CATEGORY_EMOJI[data.category] ?? "✨";
  const processing = PROCESSING_LABELS[data.processingType] ?? "";
  const originFlag = data.origin ? getOriginFlag(data.origin) : "";
  
  // Build description line
  const parts: string[] = [];
  if (processing) parts.push(processing);
  if (data.texture) parts.push(data.texture.toLowerCase());
  if (data.origin) parts.push(`${originFlag} ${data.origin}`);
  
  // Lengths range
  const lengthRange = data.lengths.length > 1
    ? `${data.lengths[0]}–${data.lengths[data.lengths.length - 1]} cm`
    : data.lengths.length === 1
      ? `${data.lengths[0]} cm`
      : "";
  
  // Price
  const priceText = data.minPrice
    ? `od ${(data.minPrice / 100).toFixed(0)} Kc/g`
    : "";
  
  // Color count
  const colorText = data.colors.length > 1
    ? `${data.colors.length} odstinu`
    : data.colors.length === 1
      ? "1 odstin"
      : "";

  const lines: string[] = [
    `${emoji} ${data.name}`,
    "",
    parts.length > 0 ? `${parts.join(" | ")}` : "",
    lengthRange ? `📏 Delky: ${lengthRange}` : "",
    colorText ? `🎨 ${colorText}` : "",
    priceText ? `💰 ${priceText}` : "",
    "",
    "📦 Skladem v Praze",
    "🚚 Osobni odber i zasilka",
    "",
    `👉 ${data.productUrl}`,
    "",
    // Hashtags
    [
      "#hairland #vlasy #prodlouzenivlasu #hairextensions",
      CATEGORY_HASHTAGS[data.category] ?? "",
      PROCESSING_HASHTAGS[data.processingType] ?? "",
      "#praha #kadernictvi #vlasoveprodlouzeni",
    ].filter(Boolean).join(" "),
  ];

  return lines.filter((line) => line !== undefined).join("\n");
}

export function generateFacebookPost(data: PostProductData): string {
  const emoji = CATEGORY_EMOJI[data.category] ?? "✨";
  const processing = PROCESSING_LABELS[data.processingType] ?? "";
  const originFlag = data.origin ? getOriginFlag(data.origin) : "";

  const parts: string[] = [];
  if (processing) parts.push(processing);
  if (data.texture) parts.push(data.texture.toLowerCase());
  if (data.origin) parts.push(`${originFlag} ${data.origin}`);

  const lengthRange = data.lengths.length > 1
    ? `${data.lengths[0]}–${data.lengths[data.lengths.length - 1]} cm`
    : data.lengths.length === 1
      ? `${data.lengths[0]} cm`
      : "";

  const priceText = data.minPrice
    ? `od ${(data.minPrice / 100).toFixed(0)} Kc/g`
    : "";

  // Facebook: more conversational, fewer hashtags
  const lines: string[] = [
    `${emoji} Nove na sklade: ${data.name}!`,
    "",
    parts.length > 0 ? parts.join(" | ") : "",
    "",
    lengthRange ? `📏 Delky: ${lengthRange}` : "",
    data.colors.length > 0 ? `🎨 ${data.colors.length} odstinu na vyber` : "",
    priceText ? `💰 Cena ${priceText}` : "",
    "",
    "✅ Skladem, expedice do 24h",
    "📍 Osobni odber Praha | zasilka po cele CR",
    "",
    `Objednejte zde 👉 ${data.productUrl}`,
    "",
    "#hairland #vlasy #prodlouzenivlasu #hairextensions",
  ];

  return lines.filter((line) => line !== undefined && line !== "").join("\n");
}
```

**Lines:** ~100

---

### Step 2: Add SocialPostModal component
**New file:** `src/components/products/SocialPostModal.tsx`

A modal/dialog that shows generated IG and FB posts with copy buttons and tab switching.

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { generateInstagramPost, generateFacebookPost } from "@/lib/social-post-generator";

interface SocialPostModalProps {
  product: {
    id: string;
    name: string;
    category: string;
    processingType: string;
    origin?: string | null;
    texture?: string | null;
    variants?: Array<{
      lengthCm: number;
      color: string;
      retailPricePerGram?: number;
    }>;
  };
  onClose: () => void;
}

export function SocialPostModal({ product, onClose }: SocialPostModalProps) {
  const t = useTranslations();
  const [tab, setTab] = useState<"ig" | "fb">("ig");
  const [copied, setCopied] = useState(false);

  const variants = product.variants ?? [];
  const lengths = [...new Set(variants.map((v) => v.lengthCm))].sort((a, b) => a - b);
  const colors = [...new Set(variants.map((v) => v.color))];
  const prices = variants.map((v) => v.retailPricePerGram).filter((p): p is number => p != null && p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : undefined;
  const productUrl = `${typeof window !== "undefined" ? window.location.origin : "https://hairland.cz"}/offer/${product.id}`;

  const data = { name: product.name, category: product.category, processingType: product.processingType, origin: product.origin, texture: product.texture, lengths, colors, minPrice, productUrl };

  const text = tab === "ig" ? generateInstagramPost(data) : generateFacebookPost(data);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <h3 className="font-semibold text-ink">{t("product.generatePost")}</h3>
          <button onClick={onClose} className="text-muted hover:text-ink text-xl leading-none">&times;</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-line">
          <button
            className={`flex-1 px-4 py-2 text-sm font-medium ${tab === "ig" ? "border-b-2 border-rose text-rose" : "text-muted"}`}
            onClick={() => setTab("ig")}
          >
            Instagram
          </button>
          <button
            className={`flex-1 px-4 py-2 text-sm font-medium ${tab === "fb" ? "border-b-2 border-rose text-rose" : "text-muted"}`}
            onClick={() => setTab("fb")}
          >
            Facebook
          </button>
        </div>

        {/* Text preview */}
        <div className="flex-1 overflow-auto p-4">
          <pre className="whitespace-pre-wrap text-sm text-ink font-sans bg-nude-50 rounded-lg p-4 border border-line">
            {text}
          </pre>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-4 py-3 border-t border-line">
          <button
            onClick={handleCopy}
            className="flex-1 px-4 py-2 bg-rose text-white rounded-lg text-sm font-semibold hover:bg-rose/90 transition-colors"
          >
            {copied ? t("common.copied") : t("common.copy")}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted hover:text-ink transition-colors"
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Lines:** ~80

---

### Step 3: Add button to ProductDetailClient
**File:** `src/app/(app)/products/[id]/ProductDetailClient.tsx`

**Change 1 — Add import (top of file):**
```typescript
import { SocialPostModal } from "@/components/products/SocialPostModal";
```

**Change 2 — Add state (after existing state declarations, ~line 51):**
```typescript
const [showSocialPost, setShowSocialPost] = useState(false);
```

**Change 3 — Add button in the header area.**

Add after the texture editing section (after the closing `</div>` of the flex items-center gap-2 block, around line 121-180), inside the Card, add a "Generate post" button visible only to owners:

```tsx
{isOwner && (
  <Button
    size="sm"
    variant="secondary"
    onClick={() => setShowSocialPost(true)}
  >
    {t("product.generatePost")}
  </Button>
)}
```

**Change 4 — Add modal render (before closing `</div>` of the component):**
```tsx
{showSocialPost && (
  <SocialPostModal
    product={product}
    onClose={() => setShowSocialPost(false)}
  />
)}
```

**Lines changed in this file:** ~12

---

### Step 4: Add translation keys
**Files:** `messages/cs.json`, `messages/uk.json`, `messages/ru.json`

Add to `product` namespace:
```json
{
  "generatePost": "Generovat post"
}
```

Add to `common` namespace (if missing):
```json
{
  "copy": "Kopirovat",
  "copied": "Zkopirovano!",
  "close": "Zavrit"
}
```

**Verify existing keys first:**

Keys to check: `common.copy`, `common.copied`, `common.close` — may already exist.

---

## Summary

| # | File | What | Lines | New? |
|---|------|------|-------|------|
| 1 | `src/lib/social-post-generator.ts` | Template-based IG/FB post generator | ~100 | NEW |
| 2 | `src/components/products/SocialPostModal.tsx` | Modal with tabs, preview, copy button | ~80 | NEW |
| 3 | `src/app/(app)/products/[id]/ProductDetailClient.tsx` | Add button + modal state | ~12 | EDIT |
| 4 | Translation files (cs, uk, ru) | `generatePost`, `copy`, `copied`, `close` | ~6 | EDIT |

**Total files:** 5-6 (2 new, 3-4 edited)
**Total lines:** ~200
**Risk:** Low — 2 new files + small edits, no changes to existing logic
**Dependencies:** None — uses only existing utilities (origin-flags)

## Post Template Examples

**Instagram output:**
```
👑 Virgin Slavic Clip-in

Clip-in | rovne | 🇺🇦 Ukrajina
📏 Delky: 40–60 cm
🎨 6 odstinu
💰 od 85 Kc/g

📦 Skladem v Praze
🚚 Osobni odber i zasilka

👉 https://hairland.cz/offer/clx123abc

#hairland #vlasy #prodlouzenivlasu #hairextensions #virginvlasy #virginhaircz #clipin #clipinvlasy #clipinhair #praha #kadernictvi #vlasoveprodlouzeni
```

**Facebook output:**
```
👑 Nove na sklade: Virgin Slavic Clip-in!

Clip-in | rovne | 🇺🇦 Ukrajina

📏 Delky: 40–60 cm
🎨 6 odstinu na vyber
💰 Cena od 85 Kc/g

✅ Skladem, expedice do 24h
📍 Osobni odber Praha | zasilka po cele CR

Objednejte zde 👉 https://hairland.cz/offer/clx123abc

#hairland #vlasy #prodlouzenivlasu #hairextensions
```

## Testing

1. Open admin product detail as OWNER
2. Click "Generovat post" button
3. Verify IG tab shows correct post with product data, emojis, hashtags
4. Switch to FB tab — verify different format
5. Click "Kopirovat" — verify text copied to clipboard, button changes to "Zkopirovano!"
6. Paste into text editor — verify formatting is correct
7. Click outside modal or X — verify modal closes
8. Test with product that has no origin/texture — verify graceful fallback
9. Verify button NOT visible for non-OWNER roles
