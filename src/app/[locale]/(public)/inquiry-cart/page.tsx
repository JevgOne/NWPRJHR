import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { InquiryCartClient } from "./InquiryCartClient";
import { getAlternates } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: t("inquiryCartTitle"),
    description: t("inquiryCartDescription"),
    alternates: getAlternates("/inquiry-cart"),
    robots: { index: false },
  };
}

export default function InquiryCartPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <InquiryCartClient />
    </div>
  );
}
