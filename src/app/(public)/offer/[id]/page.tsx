import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { ProductReviews } from "./ProductReviews";
import { getHairColor } from "@/lib/hair-colors";
import { getOriginFlag } from "@/lib/origin-flags";
import { PhotoGallery } from "./PhotoGallery";
import { AddToInquiryForm } from "./AddToInquiryForm";

type Props = {
  params: Promise<{ id: string }>;
};

async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
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
      photos: true,
      variants: {
        where: { active: true },
        select: {
          lengthCm: true,
          color: true,
        },
      },
    },
  });
  if (!product) return null;

  return {
    ...product,
    photos: JSON.parse(product.photos || "[]") as string[],
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) {
    return { title: "Produkt nenalezen" };
  }
  return {
    title: product.name,
    description:
      product.description ??
      `${product.name} - ${product.category} vlasy k prodloužení`,
  };
}

const CATEGORY_INFO: Record<string, { desc: string; features: string[] }> = {
  VIRGIN: {
    desc: "Nejvyšší kvalita panenských vlasů. 100% neošetřené, kompletní kutikula zachována ve správném směru. Přirozeně lesklé, hedvábné a odolné.",
    features: [
      "100% neošetřené panenské vlasy",
      "Kompletní kutikula — bez zamotávání",
      "Vydrží 2+ roky při správné péči",
      "Lze barvit i odbarvovat",
    ],
  },
  PREMIUM: {
    desc: "Prémiová kvalita vlasů s jemným ošetřením. Zachovaná struktura a přirozený vzhled. Ideální volba pro profesionální salony.",
    features: [
      "Jemně ošetřené, zachovaná struktura",
      "Přirozený vzhled a lesk",
      "Vydrží 1–2 roky při správné péči",
      "Široká nabídka odstínů",
    ],
  },
  STANDARD: {
    desc: "Skvělý poměr cena/kvalita. Ošetřené vlasy vhodné pro běžné prodlužování. Spolehlivá volba pro klientky hledající kvalitu za rozumnou cenu.",
    features: [
      "Výborný poměr cena/kvalita",
      "Vhodné pro běžné prodlužování",
      "Vydrží 6–12 měsíců",
      "Dostupné ve více délkách",
    ],
  },
  SALE: {
    desc: "Vlasy za zvýhodněnou cenu. Omezená dostupnost — ideální příležitost pro salony, které chtějí nakoupit výhodně.",
    features: [
      "Výrazně zvýhodněná cena",
      "Omezené množství skladem",
      "Ideální na vyzkoušení nových technik",
      "Kvalita odpovídající ceně",
    ],
  },
};

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const t = await getTranslations("public.products");
  const tCategory = await getTranslations("category");
  const tCommon = await getTranslations("common");

  const lengths = [...new Set(product.variants.map((v) => v.lengthCm))].sort(
    (a, b) => a - b
  );
  const colors = [...new Set(product.variants.map((v) => v.color))];

  const categoryLabel = tCategory(product.category.toLowerCase());
  const originFlag = product.origin ? getOriginFlag(product.origin) : null;
  const catInfo = CATEGORY_INFO[product.category] ?? CATEGORY_INFO.STANDARD;
  const description = product.description || catInfo.desc;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted mb-4">
        <Link href="/" className="hover:text-rose transition-colors">Domů</Link>
        <span>/</span>
        <Link href="/offer" className="hover:text-rose transition-colors">Nabídka</Link>
        <span>/</span>
        <span className="text-espresso font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        {/* Left: Photo gallery */}
        <PhotoGallery photos={product.photos} alt={product.name} />

        {/* Right: Product info */}
        <div className="space-y-4">
          {/* Header: name + origin inline */}
          <div>
            <h1 className="text-2xl font-bold text-ink mb-1">
              {product.name}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted">
              <Link
                href={`/offer?category=${product.category}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blush-100 text-rose-deep font-medium text-xs hover:bg-blush-200 transition-colors"
              >
                {categoryLabel}
              </Link>
              {product.origin && (
                <Link
                  href={`/offer?origin=${encodeURIComponent(product.origin)}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium text-xs hover:bg-emerald-100 transition-colors"
                >
                  {originFlag} {product.origin}
                </Link>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-muted leading-relaxed">
            {description}
          </p>

          {/* Specs row — compact, clickable */}
          <div className="bg-nude-50 rounded-2xl p-4 grid grid-cols-2 gap-3">
            {product.origin && (
              <Link
                href={`/offer?origin=${encodeURIComponent(product.origin)}`}
                className="flex items-center gap-2.5 hover:bg-nude-100 rounded-lg p-1 -m-1 transition-colors"
              >
                <span className="text-xl">{originFlag}</span>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted font-medium">Původ</div>
                  <div className="text-sm font-semibold text-ink underline decoration-line underline-offset-2">{product.origin}</div>
                </div>
              </Link>
            )}
            {lengths.length > 0 && (
              <div className="flex items-center gap-2.5">
                <span className="text-xl">📏</span>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted font-medium">Délky</div>
                  <div className="text-sm font-semibold text-ink">
                    {lengths[0]}–{lengths[lengths.length - 1]} cm
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🎨</span>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted font-medium">Odstíny</div>
                <div className="text-sm font-semibold text-ink">{colors.length} {colors.length === 1 ? "barva" : colors.length < 5 ? "barvy" : "barev"}</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl">✅</span>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted font-medium">Dostupnost</div>
                <div className="text-sm font-semibold text-emerald-700">Skladem</div>
              </div>
            </div>
          </div>

          {/* Lengths + Colors detail */}
          <div className="space-y-3">
            <div>
              <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Dostupné délky</div>
              <div className="flex flex-wrap gap-1.5">
                {lengths.map((len) => (
                  <Link
                    key={len}
                    href={`/offer?lengthCm=${len}`}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-espresso border border-line hover:border-blush-300 hover:bg-blush-100 hover:text-rose-deep transition-colors"
                  >
                    {len} cm
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Dostupné odstíny</div>
              <div className="flex flex-wrap gap-1.5">
                {colors.map((code) => {
                  const { hex, name } = getHairColor(code);
                  return (
                    <Link
                      key={code}
                      href={`/offer?color=${encodeURIComponent(code)}`}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-line hover:border-blush-300 hover:bg-blush-100 transition-colors text-xs text-muted"
                      title={name}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-line flex-shrink-0"
                        style={{ backgroundColor: hex }}
                      />
                      {code}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Variant table — compact */}
          {lengths.length > 0 && (
            <div className="rounded-xl border border-line overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-nude-50">
                    <th className="text-left px-4 py-2 text-xs text-muted font-medium uppercase tracking-wider">Délka</th>
                    <th className="text-left px-4 py-2 text-xs text-muted font-medium uppercase tracking-wider">Barvy</th>
                  </tr>
                </thead>
                <tbody>
                  {lengths.map((len, i) => {
                    const variantColors = [...new Set(
                      product.variants.filter((v) => v.lengthCm === len).map((v) => v.color)
                    )];
                    return (
                      <tr key={len} className={i > 0 ? "border-t border-line" : ""}>
                        <td className="px-4 py-2 font-medium text-ink">
                          <Link href={`/offer?lengthCm=${len}`} className="hover:text-rose transition-colors">
                            {len} cm
                          </Link>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex flex-wrap gap-1.5">
                            {variantColors.map((code) => {
                              const { hex, name } = getHairColor(code);
                              return (
                                <Link
                                  key={code}
                                  href={`/offer?color=${encodeURIComponent(code)}`}
                                  className="inline-flex items-center gap-1 text-xs text-muted hover:text-rose transition-colors"
                                  title={name}
                                >
                                  <span className="w-3.5 h-3.5 rounded-full border border-line flex-shrink-0" style={{ backgroundColor: hex }} />
                                  {code}
                                </Link>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Category features */}
          <div className="bg-amber-50 rounded-2xl p-4">
            <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-2">
              {categoryLabel} — vlastnosti
            </div>
            <ul className="space-y-1.5">
              {catInfo.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                  <span className="text-amber-600 mt-0.5">&#10003;</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Add to inquiry */}
          <AddToInquiryForm
            productId={product.id}
            productName={product.name}
            variants={product.variants}
          />

          {/* Delivery perks — tight row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <span>✅ Skladem</span>
            <span>🚗 Dovoz Praha zdarma</span>
            <span>✂️ Clip-in/tape-in do 7 dnů</span>
            <span>🧾 Faktura</span>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <ProductReviews />
    </div>
  );
}
