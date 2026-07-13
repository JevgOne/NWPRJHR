"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useWishlist } from "@/lib/wishlist";
import { ProductGridCard, type ProductGridCardProduct } from "@/components/public/ProductGridCard";

export function WishlistClient() {
  const t = useTranslations("public.wishlist");
  const { items, clear, count } = useWishlist();
  const [products, setProducts] = useState<ProductGridCardProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (items.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/public/products?slugs=${items.join(",")}`)
      .then((r) => r.json())
      .then((res) => {
        const bySlug = new Map<string, ProductGridCardProduct>();
        for (const p of res.data ?? []) {
          bySlug.set(p.slug, p);
        }
        const ordered = items
          .map((s) => bySlug.get(s))
          .filter((p): p is ProductGridCardProduct => p != null);
        setProducts(ordered);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [items]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink">{t("title")}</h1>
        {count > 0 && (
          <button
            onClick={clear}
            className="text-xs text-muted hover:text-red-500 transition-colors"
          >
            {t("clearAll")}
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted text-sm">...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-12 h-12 mx-auto text-muted/30 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <p className="text-muted mb-4">{t("empty")}</p>
          <Link
            href="/offer"
            className="inline-block px-5 py-2 bg-rose text-white text-sm font-medium rounded-lg hover:bg-rose-deep transition-colors"
          >
            {t("browseProducts")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductGridCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
