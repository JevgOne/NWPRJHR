import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { serializeProductForRole } from "@/lib/api/product-serializer";
import { ProductListClient } from "./ProductListClient";

export default async function ProductsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [t, products] = await Promise.all([
    getTranslations(),
    prisma.product.findMany({
      where: { archived: false },
      include: { variants: { where: { active: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const serialized = products.map((p) =>
    serializeProductForRole(p, session.user.role)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink">
          {t("nav.products")}
        </h1>
        {session.user.role === "OWNER" && (
          <a
            href="/products/new"
            className="inline-flex items-center px-4 py-2 bg-rose text-white rounded-lg text-sm font-medium hover:bg-rose-deep"
          >
            {t("common.add")}
          </a>
        )}
      </div>
      <ProductListClient products={serialized} />
    </div>
  );
}
