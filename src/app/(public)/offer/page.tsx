import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ProductsShowcase } from "./ProductsShowcase";

export const metadata: Metadata = {
  title: "Nabídka prémiových vlasů | Virgin, Premium, Standard",
  description:
    "Široký výběr prémiových surových vlasů k prodloužení. Zpracování na zakázku — clip-in, tape-in, keratin. Virgin, premium i standard kvalita. Skladem v Praze.",
  alternates: { canonical: "/offer" },
};

export default async function ProductsPage() {
  const t = await getTranslations("public");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-ink mb-4">
        {t("products.title")}
      </h1>

      {/* Custom order banner */}
      <div className="bg-blush-100 border border-blush-200 rounded-xl p-5 mb-8">
        <div className="flex gap-4 items-start">
          <div className="text-3xl flex-shrink-0">✂️</div>
          <div>
            <h2 className="font-semibold text-rose-deep mb-1">{t("offer.bannerTitle")}</h2>
            <p className="text-sm text-espresso mb-2" dangerouslySetInnerHTML={{ __html: t.raw("offer.bannerText") as string }} />
            <p className="text-sm text-rose-deep" dangerouslySetInnerHTML={{ __html: t.raw("offer.bannerCta") as string }} />
          </div>
        </div>
      </div>

      <Suspense fallback={<p className="text-muted">{t("offer.loadingProducts")}</p>}>
        <ProductsShowcase />
      </Suspense>
    </div>
  );
}
