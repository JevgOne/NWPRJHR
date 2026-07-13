import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { WishlistClient } from "./WishlistClient";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("public.wishlist");
  return {
    title: t("title"),
    robots: { index: false, follow: false },
  };
}

export default function WishlistPage() {
  return <WishlistClient />;
}
