import { getTranslations } from "next-intl/server";
import { ProductsShowcase } from "./ProductsShowcase";

export default async function ProductsPage() {
  const t = await getTranslations("public");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {t("products.title")}
      </h1>
      <ProductsShowcase />
    </div>
  );
}
