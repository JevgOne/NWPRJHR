"use client";

const STORAGE_KEY = "hairland_recently_viewed";
const MAX_ITEMS = 8;

export function getRecentlyViewed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(productSlug: string): void {
  const current = getRecentlyViewed();
  const filtered = current.filter((s) => s !== productSlug);
  const updated = [productSlug, ...filtered].slice(0, MAX_ITEMS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}
