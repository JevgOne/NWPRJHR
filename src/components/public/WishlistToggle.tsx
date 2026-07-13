"use client";

import { useWishlist } from "@/lib/wishlist";
import { useTranslations } from "next-intl";

export function WishlistToggle({ slug }: { slug: string }) {
  const { isInWishlist, toggle } = useWishlist();
  const t = useTranslations("public.wishlist");
  const active = isInWishlist(slug);

  return (
    <button
      onClick={() => toggle(slug)}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        active
          ? "bg-rose/10 text-rose"
          : "bg-nude-100 text-muted hover:bg-nude-200"
      }`}
      aria-label={active ? t("remove") : t("add")}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {active ? t("remove") : t("add")}
    </button>
  );
}
