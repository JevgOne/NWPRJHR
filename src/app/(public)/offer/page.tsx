import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { ProductsShowcase } from "./ProductsShowcase";

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
            <h2 className="font-semibold text-rose-deep mb-1">Vlasy z celého světa — vždy s přesným původem</h2>
            <p className="text-sm text-espresso mb-2">
              Vlasy skladem si vezmete rovnou s sebou. Chcete clip-in, tape-in nebo micro ring? Připravíme na zakázku — <strong>do 7 dnů</strong>. Vše oficiálně fakturováno.
            </p>
            <p className="text-sm text-rose-deep">
              🤝 Nejste si jistí? <strong>Přijedeme s ukázkami přímo za vámi</strong> — po Praze zdarma. Žádný závazek.
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={<p className="text-muted">Načítání...</p>}>
        <ProductsShowcase />
      </Suspense>
    </div>
  );
}
