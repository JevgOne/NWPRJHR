import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RegisterForm } from "./RegisterForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("public.register");
  const title = t("pageTitle");
  const desc = t("pageDescription");
  return {
    title,
    description: desc,
    alternates: { canonical: "/registrace" },
    openGraph: {
      type: "website",
      title: `${title} | Hairland`,
      description: desc,
      url: "https://www.hairland.cz/registrace",
      siteName: "Hairland",
      locale: "cs_CZ",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Hairland`,
      description: desc,
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
