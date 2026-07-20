import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CheckoutClient } from "./CheckoutClient";
import { getAlternates } from "@/lib/seo";
import { auth } from "@/lib/auth";
import { getCachedB2BSettings } from "@/lib/b2b-pricing";
import { prisma } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: t("checkoutTitle"),
    description: t("checkoutDescription"),
    alternates: getAlternates("/checkout"),
    robots: { index: false },
  };
}

export default async function CheckoutPage() {
  const session = await auth();

  let b2bInfo: {
    salonId: string;
    salonName: string;
    salonType: "SALON" | "HAIRDRESSER";
    discountPct: number;
    contactEmail?: string;
    contactPhone?: string;
    contactPerson?: string;
    ico?: string;
    dic?: string;
    address?: string;
    city?: string;
  } | null = null;

  if (session?.user?.salonId && (session.user.role === "SALON" || session.user.role === "HAIRDRESSER")) {
    const [salon, b2bSettings] = await Promise.all([
      prisma.salon.findUnique({
        where: { id: session.user.salonId },
        select: {
          id: true, name: true, type: true,
          email: true, phone: true, contactPerson: true,
          ico: true, dic: true, address: true, city: true,
          archived: true,
        },
      }),
      getCachedB2BSettings(),
    ]);
    if (salon && !salon.archived) {
      b2bInfo = {
        salonId: salon.id,
        salonName: salon.name,
        salonType: salon.type as "SALON" | "HAIRDRESSER",
        discountPct: salon.type === "SALON"
          ? b2bSettings.salonDiscountPct
          : b2bSettings.hairdresserDiscountPct,
        contactEmail: salon.email ?? undefined,
        contactPhone: salon.phone ?? undefined,
        contactPerson: salon.contactPerson ?? undefined,
        ico: salon.ico ?? undefined,
        dic: salon.dic ?? undefined,
        address: salon.address ?? undefined,
        city: salon.city ?? undefined,
      };
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CheckoutClient b2bInfo={b2bInfo} />
    </div>
  );
}
