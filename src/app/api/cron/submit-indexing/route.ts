import { NextRequest, NextResponse } from "next/server";

const INDEXNOW_KEY = "c7ecbcf80068c574e56cd82e1317e892";
const SITE_URL = "https://www.hairland.cz";
const INDEXNOW_ENDPOINTS = [
  "https://api.indexnow.org/indexnow",
  "https://www.bing.com/indexnow",
  "https://search.seznam.cz/indexnow",
];

/**
 * Cron job: fetches sitemap, submits all URLs to IndexNow (Bing, Seznam, Yandex).
 * Also supports POST with { urls: string[] } for on-demand submission.
 */
export async function GET(request: NextRequest) {
  const cronSecret = (process.env.CRON_SECRET || "").trim();
  const authHeader = request.headers.get("authorization");
  const legacySecret = request.headers.get("x-cron-secret");
  const isAuthorized =
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (cronSecret && legacySecret === cronSecret);

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const urls = await fetchSitemapUrls();
    const results = await submitToIndexNow(urls);
    await submitToGoogleIndexing(urls.slice(0, 200));
    return NextResponse.json({ submitted: urls.length, results });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function fetchSitemapUrls(): Promise<string[]> {
  const res = await fetch(`${SITE_URL}/sitemap.xml`, { cache: "no-store" });
  const xml = await res.text();
  const urls: string[] = [];
  const regex = /<loc>(.*?)<\/loc>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

async function submitToIndexNow(urls: string[]): Promise<Record<string, number>> {
  const results: Record<string, number> = {};

  // IndexNow accepts max 10,000 URLs per request
  const batches: string[][] = [];
  for (let i = 0; i < urls.length; i += 10000) {
    batches.push(urls.slice(i, i + 10000));
  }

  for (const endpoint of INDEXNOW_ENDPOINTS) {
    try {
      for (const batch of batches) {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            host: "www.hairland.cz",
            key: INDEXNOW_KEY,
            keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
            urlList: batch,
          }),
        });
        results[endpoint] = res.status;
      }
    } catch {
      results[endpoint] = 0;
    }
  }

  return results;
}

async function submitToGoogleIndexing(urls: string[]): Promise<void> {
  const keyJson = process.env.GOOGLE_INDEXING_KEY;
  if (!keyJson) return;

  try {
    const key = JSON.parse(keyJson);
    const token = await getGoogleAccessToken(key);
    if (!token) return;

    // Google Indexing API: max 200 URLs/day
    for (const url of urls) {
      try {
        await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ url, type: "URL_UPDATED" }),
        });
      } catch {
        // continue with next URL
      }
    }
  } catch {
    // Google Indexing not configured or failed
  }
}

async function getGoogleAccessToken(key: { client_email: string; private_key: string }): Promise<string | null> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const payload = btoa(
      JSON.stringify({
        iss: key.client_email,
        scope: "https://www.googleapis.com/auth/indexing",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
      })
    );

    // Sign JWT with private key using Web Crypto
    const pemContents = key.private_key
      .replace(/-----BEGIN PRIVATE KEY-----/, "")
      .replace(/-----END PRIVATE KEY-----/, "")
      .replace(/\n/g, "");
    const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      binaryKey,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureInput = new TextEncoder().encode(`${header}.${payload}`);
    const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, signatureInput);
    const sig = btoa(String.fromCharCode(...new Uint8Array(signature)));
    const jwt = `${header}.${payload}.${sig}`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });
    const tokenData = await tokenRes.json();
    return tokenData.access_token ?? null;
  } catch {
    return null;
  }
}
