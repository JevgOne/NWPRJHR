import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { getAlternates, getOgUrl, OG_LOCALES } from "@/lib/seo";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([
    getTranslations("metadata"),
    getLocale(),
  ]);
  return {
    title: t("peceTitle"),
    description: t("peceDescription"),
    alternates: getAlternates("/pece-o-vlasy", locale),
    openGraph: {
      type: "website",
      title: `${t("peceTitle")} | Hairland`,
      description: t("peceDescription"),
      url: getOgUrl("/pece-o-vlasy", locale),
      siteName: "Hairland",
      locale: OG_LOCALES[locale] ?? "cs_CZ",
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("peceTitle")} | Hairland`,
      description: t("peceDescription"),
    },
  };
}

function CareTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | string[])[];
}) {
  return (
    <div className="overflow-x-auto my-4">
      <table className="w-full text-sm border border-line rounded-lg">
        <thead>
          <tr className="bg-nude-50">
            {headers.map((h, i) => (
              <th
                key={i}
                className="text-left px-3 py-2 font-semibold text-ink border-b border-line"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const cells = Array.isArray(row) ? row : [row];
            return (
              <tr key={i} className={i % 2 === 1 ? "bg-nude-50/50" : ""}>
                {cells.map((cell, j) => (
                  <td
                    key={j}
                    className="px-3 py-2 text-muted border-b border-line last:border-b-0"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function PeceOVlasyPage() {
  const [t, tNav] = await Promise.all([
    getTranslations("public.hairCare"),
    getTranslations("public.nav"),
  ]);

  const textSections = [1, 2, 3, 5, 7, 10] as const;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Breadcrumbs
        items={[{ label: tNav("home"), href: "/" }, { label: t("title") }]}
      />
      <h1 className="text-3xl font-bold text-ink mb-2">{t("title")}</h1>
      <p className="text-sm text-muted mb-8">{t("subtitle")}</p>

      <div className="space-y-8">
        {/* Sections 1, 2, 3, 5 — plain text */}
        {([1, 2, 3] as const).map((num) => (
          <section key={num}>
            <h2 className="text-lg font-semibold text-ink mb-2">
              {t(`section${num}Title`)}
            </h2>
            <p className="text-sm text-muted leading-relaxed whitespace-pre-line">
              {t(`section${num}Text`)}
            </p>
          </section>
        ))}

        {/* Section 4 — intro + table + text */}
        <section>
          <h2 className="text-lg font-semibold text-ink mb-2">
            {t("section4Title")}
          </h2>
          <p className="text-sm text-muted leading-relaxed whitespace-pre-line mb-2">
            {t("section4Intro")}
          </p>
          <CareTable
            headers={[
              t("section4TableHeader1"),
              t("section4TableHeader2"),
              t("section4TableHeader3"),
            ]}
            rows={[
              t.raw("section4TableRow1") as string[],
              t.raw("section4TableRow2") as string[],
              t.raw("section4TableRow3") as string[],
              t.raw("section4TableRow4") as string[],
              t.raw("section4TableRow5") as string[],
              t.raw("section4TableRow6") as string[],
            ]}
          />
          <p className="text-sm text-muted leading-relaxed whitespace-pre-line">
            {t("section4Text")}
          </p>
        </section>

        {/* Section 5 — plain text */}
        <section>
          <h2 className="text-lg font-semibold text-ink mb-2">
            {t("section5Title")}
          </h2>
          <p className="text-sm text-muted leading-relaxed whitespace-pre-line">
            {t("section5Text")}
          </p>
        </section>

        {/* Section 6 — intro + table + text */}
        <section>
          <h2 className="text-lg font-semibold text-ink mb-2">
            {t("section6Title")}
          </h2>
          <p className="text-sm text-muted leading-relaxed whitespace-pre-line mb-2">
            {t("section6Intro")}
          </p>
          <h3 className="text-base font-semibold text-ink mb-2">
            {t("section6TableTitle")}
          </h3>
          <CareTable
            headers={[
              t("section6TableHeader1"),
              t("section6TableHeader2"),
            ]}
            rows={[
              t.raw("section6TableRow1") as string[],
              t.raw("section6TableRow2") as string[],
              t.raw("section6TableRow3") as string[],
              t.raw("section6TableRow4") as string[],
              t.raw("section6TableRow5") as string[],
            ]}
          />
          <p className="text-sm text-muted leading-relaxed whitespace-pre-line">
            {t("section6Text")}
          </p>
        </section>

        {/* Section 7 — plain text */}
        <section>
          <h2 className="text-lg font-semibold text-ink mb-2">
            {t("section7Title")}
          </h2>
          <p className="text-sm text-muted leading-relaxed whitespace-pre-line">
            {t("section7Text")}
          </p>
        </section>

        {/* Section 8 — intro + table + text */}
        <section>
          <h2 className="text-lg font-semibold text-ink mb-2">
            {t("section8Title")}
          </h2>
          <p className="text-sm text-muted leading-relaxed whitespace-pre-line mb-2">
            {t("section8Intro")}
          </p>
          <CareTable
            headers={[
              t("section8TableHeader1"),
              t("section8TableHeader2"),
            ]}
            rows={[
              t.raw("section8TableRow1") as string[],
              t.raw("section8TableRow2") as string[],
              t.raw("section8TableRow3") as string[],
              t.raw("section8TableRow4") as string[],
              t.raw("section8TableRow5") as string[],
              t.raw("section8TableRow6") as string[],
              t.raw("section8TableRow7") as string[],
            ]}
          />
          <p className="text-sm text-muted leading-relaxed whitespace-pre-line">
            {t("section8Text")}
          </p>
        </section>

        {/* Section 9 — intro + table + text */}
        <section>
          <h2 className="text-lg font-semibold text-ink mb-2">
            {t("section9Title")}
          </h2>
          <p className="text-sm text-muted leading-relaxed whitespace-pre-line mb-2">
            {t("section9Intro")}
          </p>
          <CareTable
            headers={[
              t("section9TableHeader1"),
              t("section9TableHeader2"),
              t("section9TableHeader3"),
            ]}
            rows={[
              t.raw("section9TableRow1") as string[],
              t.raw("section9TableRow2") as string[],
              t.raw("section9TableRow3") as string[],
              t.raw("section9TableRow4") as string[],
              t.raw("section9TableRow5") as string[],
            ]}
          />
          <p className="text-sm text-muted leading-relaxed whitespace-pre-line">
            {t("section9Text")}
          </p>
        </section>

        {/* Section 10 — plain text */}
        <section>
          <h2 className="text-lg font-semibold text-ink mb-2">
            {t("section10Title")}
          </h2>
          <p className="text-sm text-muted leading-relaxed whitespace-pre-line">
            {t("section10Text")}
          </p>
        </section>
      </div>
    </div>
  );
}
