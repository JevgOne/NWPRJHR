import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLoyaltyDiscount } from "@/lib/loyalty";
import { ProductsShowcase } from "./ProductsShowcase";

export const metadata: Metadata = {
  title: "Nabídka prémiových vlasů | Virgin, Premium, Standard",
  description:
    "Široký výběr prémiových surových vlasů k prodloužení. Zpracování na zakázku — clip-in, tape-in, keratin. Virgin, premium i standard kvalita. Skladem v Praze.",
  alternates: { canonical: "/offer" },
  openGraph: {
    type: "website",
    title: "Nabídka prémiových vlasů | Hairland",
    description:
      "Široký výběr prémiových surových vlasů k prodloužení. Clip-in, tape-in, keratin. Skladem v Praze.",
    url: "https://www.hairland.cz/offer",
    siteName: "Hairland",
    locale: "cs_CZ",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nabídka prémiových vlasů | Hairland",
    description:
      "Široký výběr prémiových surových vlasů k prodloužení. Clip-in, tape-in, keratin. Skladem v Praze.",
  },
};

export default async function ProductsPage() {
  const t = await getTranslations("public");
  const session = await auth();

  // Resolve user pricing tier
  let userRole: string | null = null;
  let discountPct = 0;

  if ((session?.user?.role === "HAIRDRESSER" || session?.user?.role === "SALON") && session?.user?.salonId) {
    userRole = session.user.role;
    const salon = await prisma.salon.findUnique({
      where: { id: session.user.salonId },
      select: { tier: true, type: true },
    });
    if (salon) {
      discountPct = await getLoyaltyDiscount(salon.tier, salon.type);
    }
  }

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
        <ProductsShowcase userRole={userRole} discountPct={discountPct} />
      </Suspense>
    </div>
  );
}
