import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RegisterForm } from "./RegisterForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("public.register");
  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
    alternates: { canonical: "/registrace" },
  };
}

export default function RegisterPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <RegisterForm />
    </div>
  );
}
