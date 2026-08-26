import { getTranslations } from "next-intl/server";
import { getRecentlyViewedSlugs } from "@/lib/recently-viewed";
import { getCachedAllProducts } from "@/lib/cached-products";
import { ProductGridCard } from "./ProductGridCard";

export async function RecentlyViewed({ excludeSlug }: { excludeSlug: string }) {
  const [slugs, allProducts, t] = await Promise.all([
    getRecentlyViewedSlugs(),
    getCachedAllProducts(),
    getTranslations("productDetail"),
  ]);

  const filtered = slugs.filter((s) => s !== excludeSlug).slice(0, 4);
  if (filtered.length === 0) return null;

  const slugSet = new Set(filtered);
  const bySlug = new Map(
    allProducts
      .filter((p) => p.slug && slugSet.has(p.slug))
      .map((p) => [p.slug, p]),
  );

  // Preserve recency order
  const products = filtered
    .map((s) => bySlug.get(s))
    .filter((p): p is NonNullable<typeof p> => p != null);

  if (products.length === 0) return null;

  return (
    <div className="mt-14">
      <h2 className="text-xl font-bold text-ink mb-5">{t("recentlyViewed")}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((p) => (
          <ProductGridCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
