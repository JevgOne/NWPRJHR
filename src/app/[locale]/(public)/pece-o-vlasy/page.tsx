import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
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
    <div className="overflow-x-auto my-5 rounded-xl overflow-hidden border border-rose/10 shadow-sm">
      <table className="w-full text-[15px]">
        <thead>
          <tr className="bg-gradient-to-r from-rose/5 to-blush-50">
            {headers.map((h, i) => (
              <th
                key={i}
                className="text-left px-5 py-3.5 font-semibold text-ink border-b border-rose/10"
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
              <tr key={i} className={i % 2 === 1 ? "bg-rose/[0.02]" : "bg-white"}>
                {cells.map((cell, j) => (
                  <td
                    key={j}
                    className="px-5 py-3.5 text-[#6b5e5a] border-b border-line/40 last:border-b-0"
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

/* ── Quick summary items for TOC ── */
const TOC_ITEMS = [
  { section: 3, key: "tocWash", icon: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m20.893 13.393-1.135-1.135a2.252 2.252 0 0 1-.421-.585l-1.08-2.16a.414.414 0 0 0-.663-.107.827.827 0 0 1-.812.21l-1.273-.363a.89.89 0 0 0-.738 1.595l.587.39c.59.395.674 1.23.172 1.732l-.2.2c-.212.212-.33.498-.33.796v.41c0 .409-.11.809-.32 1.158l-1.315 2.191a2.11 2.11 0 0 1-1.81 1.025 1.055 1.055 0 0 1-1.055-1.055v-1.172c0-.92-.56-1.747-1.414-2.089l-.655-.261a2.25 2.25 0 0 1-1.383-2.46l.007-.042a2.25 2.25 0 0 1 .29-.787l.09-.15a2.25 2.25 0 0 1 2.37-1.048l1.178.236a1.125 1.125 0 0 0 1.302-.795l.208-.73a1.125 1.125 0 0 0-.578-1.315l-.665-.332-.091.091a2.25 2.25 0 0 1-1.591.659h-.18a.94.94 0 0 0-.662.274.931.931 0 0 1-1.458-1.137l1.411-2.353a2.25 2.25 0 0 0 .286-.76M11.25 2.25c1.26 0 2.468.207 3.6.592" />
    </svg>
  ) },
  { section: 4, key: "tocNutrition", icon: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
    </svg>
  ) },
  { section: 6, key: "tocHeat", icon: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
    </svg>
  ) },
  { section: 10, key: "tocAvoid", icon: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  ) },
];

/* ── Section styling variants ── */
const SECTION_STYLES: Record<number, { bg: string; border: string; iconBg: string; iconText: string }> = {
  1: { bg: "bg-gradient-to-br from-amber-50 to-orange-50/50", border: "border-amber-200/60", iconBg: "bg-amber-100", iconText: "text-amber-700" },
  2: { bg: "bg-gradient-to-br from-emerald-50/80 to-teal-50/50", border: "border-emerald-200/60", iconBg: "bg-emerald-100", iconText: "text-emerald-600" },
  3: { bg: "bg-white", border: "border-blue-200/40", iconBg: "bg-blue-100", iconText: "text-blue-600" },
  4: { bg: "bg-gradient-to-br from-violet-50/60 to-purple-50/40", border: "border-violet-200/40", iconBg: "bg-violet-100", iconText: "text-violet-600" },
  5: { bg: "bg-white", border: "border-pink-200/40", iconBg: "bg-pink-100", iconText: "text-pink-600" },
  6: { bg: "bg-gradient-to-br from-orange-50/60 to-amber-50/40", border: "border-orange-200/40", iconBg: "bg-orange-100", iconText: "text-orange-600" },
  7: { bg: "bg-white", border: "border-indigo-200/40", iconBg: "bg-indigo-100", iconText: "text-indigo-600" },
  8: { bg: "bg-gradient-to-br from-fuchsia-50/60 to-pink-50/40", border: "border-fuchsia-200/40", iconBg: "bg-fuchsia-100", iconText: "text-fuchsia-600" },
  9: { bg: "bg-white", border: "border-teal-200/40", iconBg: "bg-teal-100", iconText: "text-teal-600" },
  10: { bg: "bg-gradient-to-br from-red-50 to-rose-50/60", border: "border-red-200/60", iconBg: "bg-red-100", iconText: "text-red-600" },
};

/* ── Section icon SVGs ── */
const SECTION_ICONS: Record<number, React.ReactNode> = {
  1: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
    </svg>
  ),
  2: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  3: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m20.893 13.393-1.135-1.135a2.252 2.252 0 0 1-.421-.585l-1.08-2.16a.414.414 0 0 0-.663-.107.827.827 0 0 1-.812.21l-1.273-.363a.89.89 0 0 0-.738 1.595l.587.39c.59.395.674 1.23.172 1.732l-.2.2c-.212.212-.33.498-.33.796v.41c0 .409-.11.809-.32 1.158l-1.315 2.191a2.11 2.11 0 0 1-1.81 1.025 1.055 1.055 0 0 1-1.055-1.055v-1.172c0-.92-.56-1.747-1.414-2.089l-.655-.261a2.25 2.25 0 0 1-1.383-2.46l.007-.042a2.25 2.25 0 0 1 .29-.787l.09-.15a2.25 2.25 0 0 1 2.37-1.048l1.178.236a1.125 1.125 0 0 0 1.302-.795l.208-.73a1.125 1.125 0 0 0-.578-1.315l-.665-.332-.091.091a2.25 2.25 0 0 1-1.591.659h-.18a.94.94 0 0 0-.662.274.931.931 0 0 1-1.458-1.137l1.411-2.353a2.25 2.25 0 0 0 .286-.76M11.25 2.25c1.26 0 2.468.207 3.6.592" />
    </svg>
  ),
  4: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
    </svg>
  ),
  5: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 2.994v2.25m10.5-2.25v2.25m-14.252 13.5V7.491a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v11.251m-18 0a2.25 2.25 0 0 0 2.25 2.25h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5" />
    </svg>
  ),
  6: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
    </svg>
  ),
  7: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
    </svg>
  ),
  8: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
    </svg>
  ),
  9: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
    </svg>
  ),
  10: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  ),
};

function SectionCard({
  id,
  sectionNum,
  title,
  children,
}: {
  id: string;
  sectionNum: number;
  title: string;
  children: React.ReactNode;
}) {
  const style = SECTION_STYLES[sectionNum] ?? SECTION_STYLES[3];
  return (
    <section id={id} className={`${style.bg} rounded-2xl border ${style.border} p-7 sm:p-8 shadow-sm`}>
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-10 h-10 rounded-xl ${style.iconBg} flex items-center justify-center flex-shrink-0 ${style.iconText} mt-0.5`}>
          {SECTION_ICONS[sectionNum]}
        </div>
        <h2 className="text-xl font-bold text-ink pt-1 leading-snug">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function ProTip({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gradient-to-r from-rose/[0.06] to-blush-50/60 border-l-[3px] border-rose rounded-r-xl p-5 mt-5">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-rose flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
        </svg>
        <p className="text-[15px] text-[#6b5e5a] leading-relaxed">
          {children}
        </p>
      </div>
    </div>
  );
}

export default async function PeceOVlasyPage() {
  const [t, tNav] = await Promise.all([
    getTranslations("public.hairCare"),
    getTranslations("public.nav"),
  ]);

  const tocLabels: Record<string, string> = {
    tocWash: t("section3Title").replace(/^\d+\.\s*/, ""),
    tocNutrition: t("section4Title").replace(/^\d+\.\s*/, ""),
    tocHeat: t("section6Title").replace(/^\d+\.\s*/, ""),
    tocAvoid: t("section10Title").replace(/^\d+\.\s*/, ""),
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <Breadcrumbs
        items={[{ label: tNav("home"), href: "/" }, { label: t("title") }]}
      />

      {/* ── Hero ── */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight mb-3" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
          {t("title")}
        </h1>
        <p className="text-lg text-[#7a6b66] leading-relaxed">{t("subtitle")}</p>
      </div>

      {/* ── Quick summary / TOC ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-14">
        {TOC_ITEMS.map((item) => (
          <a
            key={item.key}
            href={`#section-${item.section}`}
            className="group bg-white rounded-xl border border-line hover:border-rose/30 hover:shadow-md p-4 transition-all text-center"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose/10 to-blush-100/60 flex items-center justify-center mx-auto mb-2.5 text-rose group-hover:from-rose/20 group-hover:to-blush-100 transition-colors">
              {item.icon}
            </div>
            <span className="text-[13px] font-semibold text-ink leading-tight block">
              {tocLabels[item.key]}
            </span>
          </a>
        ))}
      </div>

      <div className="space-y-6">
        {/* ── Section 1 — Warning card ── */}
        <SectionCard id="section-1" sectionNum={1} title={t("section1Title")}>
          <p className="text-[15px] text-[#6b5e5a] leading-[1.8] whitespace-pre-line">
            {t("section1Text")}
          </p>
        </SectionCard>

        {/* ── Section 2 — Checklist card ── */}
        <SectionCard id="section-2" sectionNum={2} title={t("section2Title")}>
          <p className="text-[15px] text-[#6b5e5a] leading-[1.8] whitespace-pre-line">
            {t("section2Text")}
          </p>
        </SectionCard>

        {/* ── Section 3 — Washing ── */}
        <SectionCard id="section-3" sectionNum={3} title={t("section3Title")}>
          <p className="text-[15px] text-[#6b5e5a] leading-[1.8] whitespace-pre-line">
            {t("section3Text")}
          </p>
        </SectionCard>

        {/* ── Section 4 — Nutrition (table) ── */}
        <SectionCard id="section-4" sectionNum={4} title={t("section4Title")}>
          <p className="text-[15px] text-[#6b5e5a] leading-[1.8] whitespace-pre-line mb-2">
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
          <ProTip>{t("section4Text")}</ProTip>
        </SectionCard>

        {/* ── Section 5 — Brushing ── */}
        <SectionCard id="section-5" sectionNum={5} title={t("section5Title")}>
          <p className="text-[15px] text-[#6b5e5a] leading-[1.8] whitespace-pre-line">
            {t("section5Text")}
          </p>
        </SectionCard>

        {/* ── Section 6 — Drying & heat (table) ── */}
        <SectionCard id="section-6" sectionNum={6} title={t("section6Title")}>
          <p className="text-[15px] text-[#6b5e5a] leading-[1.8] whitespace-pre-line mb-2">
            {t("section6Intro")}
          </p>
          <h3 className="text-base font-bold text-ink mb-2 mt-4">
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
          <ProTip>{t("section6Text")}</ProTip>
        </SectionCard>

        {/* ── Section 7 — Sleep, sport, pool ── */}
        <SectionCard id="section-7" sectionNum={7} title={t("section7Title")}>
          <p className="text-[15px] text-[#6b5e5a] leading-[1.8] whitespace-pre-line">
            {t("section7Text")}
          </p>
        </SectionCard>

        {/* ── Section 8 — Coloring (table) ── */}
        <SectionCard id="section-8" sectionNum={8} title={t("section8Title")}>
          <p className="text-[15px] text-[#6b5e5a] leading-[1.8] whitespace-pre-line mb-2">
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
          <ProTip>{t("section8Text")}</ProTip>
        </SectionCard>

        {/* ── Section 9 — Hairdresser maintenance (table) ── */}
        <SectionCard id="section-9" sectionNum={9} title={t("section9Title")}>
          <p className="text-[15px] text-[#6b5e5a] leading-[1.8] whitespace-pre-line mb-2">
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
          <ProTip>{t("section9Text")}</ProTip>
        </SectionCard>

        {/* ── Section 10 — Ten things that ruin hair ── */}
        <SectionCard id="section-10" sectionNum={10} title={t("section10Title")}>
          <p className="text-[15px] text-[#6b5e5a] leading-[1.8] whitespace-pre-line">
            {t("section10Text")}
          </p>
        </SectionCard>
      </div>

      {/* ── CTA ── */}
      <div className="mt-14 relative overflow-hidden rounded-2xl border border-rose/10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#fdf2f0] via-[#fef6f3] to-rose/5" />
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-rose/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-blush-100/50 rounded-full blur-3xl" />
        <div className="relative px-6 py-10 sm:py-12 text-center">
          <h2 className="text-xl sm:text-2xl font-extrabold text-ink mb-2" style={{ fontFamily: "Georgia, serif" }}>{t("ctaTitle")}</h2>
          <p className="text-[15px] text-[#7a6b66] mb-7 max-w-lg mx-auto">
            {t("ctaText")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/kontakt"
              className="inline-flex items-center justify-center px-7 py-3 bg-rose text-white font-semibold rounded-full hover:bg-rose-deep transition-colors shadow-lg shadow-rose/20 hover:shadow-xl hover:shadow-rose/30 hover:-translate-y-0.5 transition-all"
            >
              {t("ctaContact")}
            </Link>
            <Link
              href="/poradna"
              className="inline-flex items-center justify-center px-7 py-3 bg-white border border-rose/15 text-ink font-medium rounded-full hover:border-rose/30 hover:bg-rose/[0.02] transition-all"
            >
              {t("ctaPoradna")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
