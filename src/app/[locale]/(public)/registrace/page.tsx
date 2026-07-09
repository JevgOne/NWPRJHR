import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { RegisterForm } from "./RegisterForm";
import { getAlternates, OG_LOCALES } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("public.register"), getLocale()]);
  const title = t("pageTitle");
  const desc = t("pageDescription");
  return {
    title,
    description: desc,
    alternates: getAlternates("/registrace"),
    openGraph: {
      type: "website",
      title: `${title} | Hairland`,
      description: desc,
      url: "https://www.hairland.cz/registrace",
      siteName: "Hairland",
      locale: OG_LOCALES[locale] ?? "cs_CZ",
      images: [
        {
          url: "https://www.hairland.cz/hero-vzornik.jpg",
          width: 735,
          height: 707,
          alt: "Hairland — prémiové vlasy k prodloužení",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Hairland`,
      description: desc,
      images: ["https://www.hairland.cz/hero-vzornik.jpg"],
    },
  };
}

export default function RegisterPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <RegisterForm />
    </div>
  );
}
