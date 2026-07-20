# QA Report: TASK-095 — Rozšířené FAQ na produktové stránce

**Status:** APPROVED
**QA by:** Kontrolor
**Date:** 2026-07-19

---

## 1. Build

```
✓ Compiled successfully in 15.3s
✓ TypeScript passed (11.3s)
✓ Generating static pages (429/429)
```

Čistý build, žádné chyby.

---

## 2. Počty otázek

| Sekce | Požadováno | Nalezeno | Status |
|-------|-----------|---------|--------|
| VIRGIN | 6 | 6 | ✅ |
| LUXE | 5 | 5 | ✅ |
| STANDARD | 4 | 4 | ✅ |
| Rovné (textura) | - | 2 | ✅ |
| Vlnité (textura) | - | 2 | ✅ |
| Kudrnaté (textura) | - | 2 | ✅ |
| generalFaq | 8 | 8 | ✅ |

---

## 3. `faqByTexture` objekt (řádky 588–601)

Klíče: `Rovné`, `Vlnité`, `Kudrnaté` — odpovídají hodnotám texture v DB (česky, s diakritikou). ✅

```ts
const textureFaq = product.texture ? (faqByTexture[product.texture] ?? []) : [];
```

- `product.texture` může být null → `? (faqByTexture[...] ?? [])` — správný optional chain + nullish fallback ✅
- Neexistující textura → prázdné pole (necrashuje) ✅

---

## 4. `allFaq` kombinace (řádek 614)

```ts
const allFaq = [...categoryFaq, ...textureFaq, ...generalFaq];
```

Správné pořadí: kategorie → textura → obecné. ✅

Fallback chování:
- Produkt bez textury → `textureFaq = []` → allFaq = categoryFaq + generalFaq ✅
- Produkt s neznámou kategorií → `categoryFaq = []` → allFaq = textureFaq + generalFaq ✅
- Produkt SALE (není v faqByCategory) → `[] ?? []` = `[]` ✅

---

## 5. Content audit — clip-in/tape-in pravidlo

**PRAVIDLO:** Hairland prodává RAW vlasy. Clip-in/tape-in je zakázková výroba, ne hotové produkty.

| Otázka | Text | Hodnocení |
|--------|------|-----------|
| "Jak aplikovat clip-in a tape-in vlasy?" (generalFaq[0]) | Mluví o technice aplikace clip-in jako způsobu nošení — neurčuje že Hairland prodává hotové clip-in produkty | ✅ OK |
| "Jak si objednat vlasy na míru?" (generalFaq[4]) | "zpracováváme na míru — clip-in, tape-in, keratin nebo micro ring... trvá přibližně 7 pracovních dní" | ✅ **Správně** — zakázková výroba |
| Všechny kategoriové otázky | Mluví o "vlasech k prodloužení", "RAW vlasech", nikde "clip-in produkt" | ✅ OK |
| Texturové otázky | Mluví o péči — žádná zmínka o produktech | ✅ OK |

Žádná odpověď netvrdí, že Hairland prodává **hotové** clip-in nebo tape-in produkty. ✅

---

## 6. FAQPage JSON-LD (řádky 616–628)

```ts
const faqJsonLd = allFaq.length > 0 ? {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: allFaq.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
} : null;
```

- Generuje se z `allFaq` ✅
- Korektní schema.org struktura ✅
- `null` guard: pokud `allFaq.length === 0`, faqJsonLd = null a `<script>` se nevykreslí ✅

Maximální počet otázek (VIRGIN + Rovné + generalFaq): 6 + 2 + 8 = **16 otázek** v JSON-LD. Google FAQ rich snippet doporučuje max ~10 zobrazených, ale více je technicky validní.

---

## 7. Simplify

- Struktura čistá, bez zbytečné složitosti ✅
- Žádné duplicitní otázky mezi kategoriemi/texturami/obecnými ✅
- Fallback `?? []` správně použit ✅
- `product.texture` je string | null — guard správný ✅

---

## Závěr

TASK-095 implementován správně. Počty otázek sedí, content audit prošel (clip-in/tape-in prezentován jako zakázková výroba), kombinace allFaq správná, build čistý.

---

## Addendum — Re-QA po refactoru (2026-07-19)

### Co se změnilo

`faqByTexture` objekt **odstraněn**. Texturové otázky přesunuty do `generalFaq` jako první 3 položky.

### Ověření

**`faqByTexture` neexistuje:** ✅ (žádný výskyt v souboru)

**`allFaq` kombinace (řádek 606):**
```ts
const allFaq = [...categoryFaq, ...generalFaq];
```
Správně — `textureFaq` odstraněno. ✅

**Počty:**
| Sekce | Počet |
|-------|-------|
| VIRGIN | 6 |
| LUXE | 5 |
| STANDARD | 4 |
| generalFaq | 11 |

Celkem: VIRGIN 6 + 11 = **17**, LUXE 5 + 11 = **16**, STANDARD 4 + 11 = **15** ✅ (v rozsahu 15–18)

**Content audit clip-in/tape-in:**
- řádek 593: "Co jsou RAW vlasy..." — "zpracovávají na zakázku přesně podle vašich požadavků — clip-in, tape-in, keratin nebo micro ring" ✅ zakázková výroba
- řádek 594: "Jak probíhá objednávka vlasů na míru?" — "Vyberete si RAW vlasy... a zvolíte způsob zpracování — clip-in, tape-in..." ✅ zakázková výroba
- Žádná odpověď netvrdí, že Hairland prodává hotové clip-in/tape-in produkty ✅

**Build:** ✓ Compiled 16.9s, TypeScript clean, 429/429 pages ✅

**Závěr addenda:** APPROVED. Refactor čistý, obsah správný.
