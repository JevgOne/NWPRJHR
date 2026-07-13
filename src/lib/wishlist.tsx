"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

const STORAGE_KEY = "hairland_wishlist";
const MAX_ITEMS = 50;

interface WishlistContextType {
  items: string[];
  isInWishlist: (slug: string) => boolean;
  toggle: (slug: string) => void;
  remove: (slug: string) => void;
  clear: () => void;
  count: number;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

function loadItems(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveItems(items: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setItems(loadItems());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveItems(items);
  }, [items, loaded]);

  const isInWishlist = useCallback(
    (slug: string) => items.includes(slug),
    [items]
  );

  const toggle = useCallback((slug: string) => {
    setItems((prev) => {
      if (prev.includes(slug)) {
        return prev.filter((s) => s !== slug);
      }
      if (prev.length >= MAX_ITEMS) return prev;
      return [slug, ...prev];
    });
  }, []);

  const remove = useCallback((slug: string) => {
    setItems((prev) => prev.filter((s) => s !== slug));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return (
    <WishlistContext.Provider
      value={{ items, isInWishlist, toggle, remove, clear, count: items.length }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
