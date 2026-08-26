import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { getCachedAllProducts } from "@/lib/cached-products";
import { ProductGridCard } from "@/components/public/ProductGridCard";

export default async function NotFound() {
  const [t, allProducts] = await Promise.all([
    getTranslations("public.notFoundPage"),
    getCachedAllProducts(),
  ]);

  // Pick 4 products with stock, preferring VIRGIN/LUXE categories
  const withStock = allProducts.filter((p) =>
    p.variants.some((v) => v.availableGrams > 0 || v.availablePieces > 0),
  );
  const preferred = withStock.filter((p) => p.category === "VIRGIN" || p.category === "LUXE");
  const pool = preferred.length >= 4 ? preferred : withStock;
  const recommended = pool
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div className="text-center mb-12">
        <p className="text-7xl font-bold text-nude-300 mb-4">404</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-3">
          {t("heading")}
        </h1>
        <p className="text-muted max-w-md mx-auto mb-8">
          {t("description")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-full border border-line text-sm font-medium text-ink hover:bg-nude-100 transition-colors"
          >
            {t("backHome")}
          </Link>
          <Link
            href="/vlasy-k-prodlouzeni"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-rose-deep text-white text-sm font-medium hover:bg-rose-800 transition-colors"
          >
            {t("browseProducts")}
          </Link>
        </div>
      </div>

      {recommended.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-ink mb-5">{t("recommended")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recommended.map((p) => (
              <ProductGridCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
