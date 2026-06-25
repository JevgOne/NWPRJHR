import { getTranslations } from "next-intl/server";
import { ProductsShowcase } from "./ProductsShowcase";

export default async function ProductsPage() {
  const t = await getTranslations("public");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        {t("products.title")}
      </h1>

      {/* Custom order banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-8">
        <div className="flex gap-4 items-start">
          <div className="text-3xl flex-shrink-0">✂️</div>
          <div>
            <h2 className="font-semibold text-indigo-900 mb-1">Prodáváme prémiové vlasy k prodloužení</h2>
            <p className="text-sm text-indigo-800 mb-2">
              Vlasy skladem si vezmete rovnou s sebou. Chcete clip-in nebo tape-in? Připravíme na zakázku — <strong>do 7 dnů</strong>.
            </p>
            <p className="text-sm text-indigo-700">
              🤝 Nejste si jistí? <strong>Přijedeme s ukázkami přímo za vámi</strong> — po Praze zdarma. Žádný závazek.
            </p>
          </div>
        </div>
      </div>

      {/* Photo categories */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <div className="relative overflow-hidden rounded-xl group">
          <img
            src="https://usxv0mh0wvr3gzdk.public.blob.vercel-storage.com/hair/volne-vlasy.jpg"
            alt="Volné vlasy"
            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
            <span className="text-white font-medium text-sm">Volné vlasy</span>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl group">
          <img
            src="https://usxv0mh0wvr3gzdk.public.blob.vercel-storage.com/hair/clip-in.jpg"
            alt="Clip-in"
            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
            <span className="text-white font-medium text-sm">Clip-in</span>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl group">
          <img
            src="https://usxv0mh0wvr3gzdk.public.blob.vercel-storage.com/hair/tape-in.jpg"
            alt="Tape-in"
            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
            <span className="text-white font-medium text-sm">Tape-in</span>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl group">
          <img
            src="https://usxv0mh0wvr3gzdk.public.blob.vercel-storage.com/hair/keratinove-vlasy.jpg"
            alt="Keratinové vlasy"
            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
            <span className="text-white font-medium text-sm">Keratinové</span>
          </div>
        </div>
      </div>

      <ProductsShowcase />
    </div>
  );
}
