"use client";

import { useEffect } from "react";
import { addRecentlyViewed } from "@/lib/recently-viewed";

export function TrackProductView({ slug }: { slug: string }) {
  useEffect(() => {
    addRecentlyViewed(slug);
  }, [slug]);
  return null;
}
