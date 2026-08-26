"use client";

import { useEffect } from "react";
import { trackProductView } from "@/lib/recently-viewed";

export function TrackProductView({ slug }: { slug: string }) {
  useEffect(() => {
    trackProductView(slug);
  }, [slug]);
  return null;
}
