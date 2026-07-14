export interface ExchangeRate {
  code: string;
  rate: number;
  amount: number;
  date: string;
}

// In-memory cache — rates change once per business day
let cachedRates: Map<string, ExchangeRate> | null = null;
let cachedAt = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

const FALLBACK_RATES: Record<string, ExchangeRate> = {
  USD: { code: "USD", rate: 23.5, amount: 1, date: "fallback" },
  EUR: { code: "EUR", rate: 25.0, amount: 1, date: "fallback" },
};

/**
 * Parse CNB daily exchange rate text format.
 * Format: "země|měna|množství|kód|kurz" with comma as decimal separator.
 * Example: "USA|dolar|1|USD|23,456"
 */
function parseCnbText(text: string): Map<string, ExchangeRate> {
  const lines = text.split("\n");
  const rates = new Map<string, ExchangeRate>();

  // First line is date header, second is column headers, data starts at line 3
  const dateLine = lines[0] ?? "";
  const dateMatch = dateLine.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  const date = dateMatch
    ? `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`
    : new Date().toISOString().slice(0, 10);

  for (let i = 2; i < lines.length; i++) {
    const parts = lines[i].split("|");
    if (parts.length < 5) continue;

    const amount = parseInt(parts[2], 10);
    const code = parts[3].trim();
    const rate = parseFloat(parts[4].replace(",", "."));

    if (!code || isNaN(rate) || isNaN(amount)) continue;

    rates.set(code, {
      code,
      rate: rate / amount, // normalize to 1 unit
      amount: 1,
      date,
    });
  }

  return rates;
}

export async function fetchCnbRates(): Promise<Map<string, ExchangeRate>> {
  const url =
    "https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/denni_kurz.txt";

  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`CNB API returned ${res.status}`);

  const text = await res.text();
  return parseCnbText(text);
}

export async function getExchangeRate(
  currency: "USD" | "EUR"
): Promise<ExchangeRate> {
  // Return from cache if fresh
  if (cachedRates && Date.now() - cachedAt < CACHE_TTL) {
    return cachedRates.get(currency) ?? FALLBACK_RATES[currency];
  }

  try {
    cachedRates = await fetchCnbRates();
    cachedAt = Date.now();
    return cachedRates.get(currency) ?? FALLBACK_RATES[currency];
  } catch {
    // Use fallback if CNB is down
    return FALLBACK_RATES[currency];
  }
}
