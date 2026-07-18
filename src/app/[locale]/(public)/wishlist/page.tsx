import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { WishlistClient } from "./WishlistClient";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("public.wishlist");
  return {
    title: t("title"),
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      title: `${t("title")} | Hairland`,
      siteName: "Hairland",
      images: [{ url: "https://www.hairland.cz/og/og-wishlist.jpg", width: 1200, height: 630, alt: "Hairland" }],
    },
    twitter: {
      card: "summary_large_image",
      images: ["https://www.hairland.cz/og/og-wishlist.jpg"],
    },
  };
}

export default function WishlistPage() {
  return <WishlistClient />;
}
