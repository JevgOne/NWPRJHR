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
    openGraph: {
      type: "website",
      title: `${t("inquiryCartTitle")} | Hairland`,
      description: t("inquiryCartDescription"),
      siteName: "Hairland",
      images: [{ url: "https://www.hairland.cz/og/og-inquiry-cart.jpg", width: 1200, height: 630, alt: "Hairland" }],
    },
    twitter: {
      card: "summary_large_image",
      images: ["https://www.hairland.cz/og/og-inquiry-cart.jpg"],
    },
  };
}

export default async function InquiryCartPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; reason?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <InquiryCartClient
        mode={sp.mode === "consult" ? "consult" : "cart"}
        reason={sp.reason}
      />
    </div>
  );
}
