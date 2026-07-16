import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { unstable_cache } from "next/cache";
import { serializeProductForRole } from "@/lib/api/product-serializer";
import { getAllStockNumbers } from "@/lib/stock";
import { ProductListClient } from "./ProductListClient";

const getCachedAdminProducts = unstable_cache(
  async () => {
    const [products, allStock] = await Promise.all([
      prisma.product.findMany({
        where: { archived: false },
        select: {
          id: true,
          name: true,
          nameUk: true,
          nameRu: true,
          description: true,
          descriptionUk: true,
          descriptionRu: true,
          category: true,
          processingType: true,
          origin: true,
          texture: true,
          colorTone: true,
          photos: true,
          video: true,
          archived: true,
          slug: true,
          metaTitle: true,
          metaDescription: true,
          ogImage: true,
          createdAt: true,
          updatedAt: true,
          variants: {
            where: { active: true },
            select: {
              id: true,
              productId: true,
              lengthCm: true,
              color: true,
              costPricePerGram: true,
              wholesalePricePerGram: true,
              retailPricePerGram: true,
              retailManualOverride: true,
              sellingMode: true,
              pricePerPiece: true,
              retailPricePerPiece: true,
              availableToOrder: true,
              orderLeadDays: true,
              active: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      getAllStockNumbers(),
    ]);
    return { products, stockEntries: Array.from(allStock.entries()) };
  },
  ["admin-products"],
  { revalidate: 15, tags: ["products"] }
);

export default async function ProductsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [t, cached] = await Promise.all([
    getTranslations(),
    getCachedAdminProducts(),
  ]);

  const { products, stockEntries } = cached;
  const allStock = new Map(stockEntries);

  const serialized = products.map((p) =>
    serializeProductForRole(p, session.user.role)
  );

  // Build stock map keyed by variant ID
  const stockMap: Record<string, number> = {};
  allStock.forEach((val, key) => {
    stockMap[key] = val.availableGrams;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink">
          {t("nav.products")}
        </h1>
        {session.user.role === "OWNER" && (
          <a
            href="/inventory"
            className="inline-flex items-center px-4 py-2 bg-rose text-white rounded-lg text-sm font-medium hover:bg-rose-deep"
          >
            {t("common.add")}
          </a>
        )}
      </div>
      <ProductListClient products={serialized} stockMap={stockMap} />
    </div>
  );
}
