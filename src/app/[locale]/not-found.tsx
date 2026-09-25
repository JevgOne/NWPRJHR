import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PublicNavbar } from "@/components/public/PublicNavbar";
import { PublicFooter } from "@/components/public/PublicFooter";
import { TopInfoBar } from "@/components/public/TopInfoBar";

export default async function NotFound() {
  const locale = await getLocale();
  const t = await getTranslations("errorPages");

  const titleMap: Record<string, string> = { cs: "Stránka nenalezena | Hairland", uk: "Сторінку не знайдено | Hairland", ru: "Страница не найдена | Hairland" };

  return (
    <div className="flex flex-col min-h-screen">
      <title>{titleMap[locale] ?? titleMap.cs}</title>
      <TopInfoBar />
      <PublicNavbar />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-md">
          <p className="text-6xl font-bold text-rose mb-4">404</p>
          <h1 className="text-2xl font-semibold text-espresso mb-3">
            {t("notFoundTitle")}
          </h1>
          <p className="text-muted mb-8">
            {t("notFoundText")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-espresso text-white rounded-lg hover:bg-espresso/90 transition-colors"
            >
              {t("notFoundCta")}
            </Link>
            <Link
              href="/vlasy-k-prodlouzeni"
              className="inline-flex items-center justify-center px-6 py-3 border border-espresso text-espresso rounded-lg hover:bg-nude-100 transition-colors"
            >
              {t("notFoundProducts")}
            </Link>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
