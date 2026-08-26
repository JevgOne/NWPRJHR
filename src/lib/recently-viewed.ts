"use server";

import { cookies } from "next/headers";

const COOKIE_NAME = "hairland_rv";
const MAX_ITEMS = 8;
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Read recently-viewed product slugs from cookie (server-side).
 */
export async function getRecentlyViewedSlugs(): Promise<string[]> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return [];
  try {
    return raw.split(",").filter(Boolean).slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

/**
 * Server action: add a product slug to the recently-viewed cookie.
 */
export async function trackProductView(slug: string): Promise<void> {
  const jar = await cookies();
  const current = await getRecentlyViewedSlugs();
  const updated = [slug, ...current.filter((s) => s !== slug)].slice(0, MAX_ITEMS);
  jar.set(COOKIE_NAME, updated.join(","), {
    path: "/",
    maxAge: MAX_AGE,
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
