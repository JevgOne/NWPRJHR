import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { getAlternates, getOgUrl, OG_LOCALES } from "@/lib/seo";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { WithdrawalForm } from "./WithdrawalForm";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("metadata"), getLocale()]);
  return {
    title: t("odstoupeniTitle"),
    description: t("odstoupeniDescription"),
    alternates: getAlternates("/odstoupeni-od-smlouvy", locale),
    openGraph: {
      type: "website",
      title: `${t("odstoupeniTitle")} | Hairland`,
      description: t("odstoupeniDescription"),
      url: getOgUrl("/odstoupeni-od-smlouvy", locale),
      siteName: "Hairland",
      locale: OG_LOCALES[locale] ?? "cs_CZ",
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("odstoupeniTitle")} | Hairland`,
      description: t("odstoupeniDescription"),
    },
  };
}

export default async function OdstoupeniPage() {
  const [t, tNav] = await Promise.all([
    getTranslations("public.withdrawal"),
    getTranslations("public.nav"),
  ]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Breadcrumbs items={[
        { label: tNav("home"), href: "/" },
        { label: t("title") },
      ]} />
      <h1 className="text-3xl font-bold text-ink mb-2">{t("title")}</h1>
      <p className="text-sm text-muted mb-8">{t("subtitle")}</p>

      <p className="text-sm text-muted leading-relaxed mb-6">{t("intro")}</p>

      <div className="bg-nude-50 rounded-xl border border-line p-5 mb-8">
        <h2 className="text-sm font-semibold text-ink mb-2">{t("recipientTitle")}</h2>
        <p className="text-sm text-muted whitespace-pre-line">{t("recipientInfo")}</p>
      </div>

      <div className="bg-white rounded-2xl border border-line p-6 mb-8">
        <h2 className="text-lg font-semibold text-ink mb-4">{t("formTitle")}</h2>
        <WithdrawalForm />
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-amber-800 mb-2">{t("infoTitle")}</h2>
        <ul className="space-y-2 text-sm text-amber-700">
          <li>• {t("info1")}</li>
          <li>• {t("info2")}</li>
          <li>• {t("info3")}</li>
          <li>• {t("info4")}</li>
        </ul>
      </div>
    </div>
  );
}
