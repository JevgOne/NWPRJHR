import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getCachedB2BSettings } from "@/lib/b2b-pricing";
import { getCachedAllProducts } from "@/lib/cached-products";
import { ProductsShowcase } from "../offer/ProductsShowcase";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { getAlternates, OG_LOCALES } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("metadata"), getLocale()]);
  return {
    title: t("accessoriesTitle"),
    description: t("accessoriesDesc"),
    alternates: getAlternates("/prislusenstvi"),
    openGraph: {
      type: "website",
      title: `${t("accessoriesTitle")} | Hairland`,
      description: t("accessoriesDesc"),
      siteName: "Hairland",
      locale: OG_LOCALES[locale] ?? "cs_CZ",
    },
  };
}

export default async function AccessoriesPage() {
  const [t, session, allProducts] = await Promise.all([
    getTranslations("public"),
    auth(),
    getCachedAllProducts(),
  ]);

  const accessoryProducts = allProducts.filter((p) => p.category === "ACCESSORY");

  let userRole: string | null = null;
  let discountPct = 0;
  if (session?.user?.role === "HAIRDRESSER" || session?.user?.role === "SALON") {
    userRole = session.user.role;
    const b2bSettings = await getCachedB2BSettings();
    discountPct = userRole === "SALON"
      ? b2bSettings.salonDiscountPct
      : b2bSettings.hairdresserDiscountPct;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Breadcrumbs items={[
        { label: t("nav.home"), href: "/" },
        { label: t("nav.accessories") },
      ]} />
      <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-2 tracking-tight">
        {t("accessories.title")}
      </h1>
      <p className="text-muted mb-8 max-w-2xl">
        {t("accessories.subtitle")}
      </p>
      <ProductsShowcase
        initialProducts={accessoryProducts}
        userRole={userRole}
        discountPct={discountPct}
      />
    </div>
  );
}
