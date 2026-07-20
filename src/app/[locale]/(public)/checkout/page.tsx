import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CheckoutClient } from "./CheckoutClient";
import { getAlternates } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: t("checkoutTitle"),
    description: t("checkoutDescription"),
    alternates: getAlternates("/checkout"),
    robots: { index: false },
  };
}

export default function CheckoutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CheckoutClient />
    </div>
  );
}
