import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { getAlternates, OG_LOCALES } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [stylist, locale, t] = await Promise.all([
    prisma.stylist.findUnique({
      where: { slug },
      select: { name: true, bio: true, photo: true },
    }),
    getLocale(),
    getTranslations("public"),
  ]);
  if (!stylist) return {};
  return {
    title: `${stylist.name} — ${t("landing.stylistMetaLabel")}`,
    description:
      stylist.bio?.slice(0, 155) ||
      `${stylist.name} — ${t("landing.stylistMetaFallback")}`,
    alternates: getAlternates(`/kadernice/${slug}`),
    openGraph: {
      ...(stylist.photo && { images: [{ url: stylist.photo, alt: stylist.name, width: 400, height: 400 }] }),
      locale: OG_LOCALES[locale] ?? "cs_CZ",
    },
  };
}

const langFlags: Record<string, { flag: string; label: string }> = {
  cs: { flag: "🇨🇿", label: "Čeština" },
  uk: { flag: "🇺🇦", label: "Українська" },
  ru: { flag: "🇷🇺", label: "Русский" },
  en: { flag: "🇬🇧", label: "English" },
};

export default async function StylistProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [t, stylist] = await Promise.all([
    getTranslations("public.stylists"),
    prisma.stylist.findUnique({
      where: { slug },
      include: { salon: { select: { name: true, city: true } } },
    }),
  ]);

  if (!stylist || !stylist.active) notFound();

  const specs: string[] = JSON.parse(stylist.specializations || "[]");
  const langs: string[] = JSON.parse(stylist.languages || "[]");
  const certs: string[] = JSON.parse(stylist.certifications || "[]");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: stylist.name,
    jobTitle: "Kadeřnice",
    ...(stylist.photo && { image: stylist.photo }),
    ...(stylist.bio && { description: stylist.bio }),
    ...(stylist.city && {
      address: { "@type": "PostalAddress", addressLocality: stylist.city },
    }),
    ...(stylist.email && { email: stylist.email }),
    ...(stylist.phone && { telephone: stylist.phone }),
    url: `https://www.hairland.cz/kadernice/${slug}`,
    worksFor: {
      "@type": "Organization",
      name: "Hairland",
      url: "https://www.hairland.cz",
    },
  };

  return (
    <div className="min-h-screen bg-nude-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero header — Telegram-style */}
      <div className="bg-gradient-to-br from-rose via-rose-deep to-pink-500 pb-16 pt-10">
        <div className="max-w-md mx-auto px-4 text-center">
          {/* Avatar */}
          <div className="w-24 h-24 mx-auto rounded-full border-4 border-white/30 bg-white/20 shadow-2xl backdrop-blur-sm overflow-hidden relative">
            {stylist.photo ? (
              <Image src={stylist.photo} alt={stylist.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><svg className="w-10 h-10 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg></div>
            )}
          </div>

          {/* Name */}
          <h1 className="text-2xl font-bold text-white mt-4">
            {stylist.name}
            {stylist.featured && <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 bg-white/20 text-white text-[10px] font-bold rounded-full align-middle">TOP</span>}
          </h1>

          {/* Location & experience */}
          <p className="text-white/80 text-sm mt-1">
            {stylist.city || t("defaultLocation")}
            {stylist.experience && ` · ${stylist.experience} ${t("yearsExperience")}`}
          </p>

          {/* Languages */}
          <div className="flex justify-center gap-2 mt-3">
            {langs.map((l) => {
              const info = langFlags[l];
              return (
                <span
                  key={l}
                  className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full"
                >
                  <span className="text-base">{info?.flag || l}</span>
                  {info?.label || l}
                </span>
              );
            })}
          </div>

          {/* Salon */}
          {stylist.salon && (
            <p className="text-white/70 text-xs mt-3">
              {stylist.salon.name}{stylist.salon.city && `, ${stylist.salon.city}`}
            </p>
          )}
        </div>
      </div>

      {/* Content cards — overlapping the header */}
      <div className="max-w-md mx-auto px-4 -mt-10 pb-10 space-y-3">

        {/* Bio card */}
        {stylist.bio && (
          <div className="bg-white rounded-2xl shadow-sm border border-line p-5">
            <h2 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">
              {t("aboutMe")}
            </h2>
            <p className="text-espresso text-sm leading-relaxed whitespace-pre-line">
              {stylist.bio}
            </p>
          </div>
        )}

        {/* Specializations */}
        {specs.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-line p-5">
            <h2 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">
              {t("specializations")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {specs.map((sp) => (
                <span
                  key={sp}
                  className="inline-flex items-center px-3 py-1.5 bg-blush-100 text-rose-deep text-sm rounded-xl font-medium"
                >
                  {sp}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {certs.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-line p-5">
            <h2 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">
              {t("certifications")}
            </h2>
            <ul className="space-y-2">
              {certs.map((c) => (
                <li key={c} className="flex items-center gap-2 text-sm text-espresso">
                  <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg></span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Contact card */}
        <div className="bg-white rounded-2xl shadow-sm border border-line p-5">
          <h2 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">
            {t("contactSection")}
          </h2>
          <div className="space-y-3">
            {stylist.phone && (
              <a href={`tel:${stylist.phone}`} className="flex items-center gap-3 text-sm text-espresso hover:text-rose transition-colors">
                <span className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg></span>
                <div>
                  <div className="font-medium">{stylist.phone}</div>
                  <div className="text-xs text-muted">{t("phoneLabel")}</div>
                </div>
              </a>
            )}
            {stylist.email && (
              <a href={`mailto:${stylist.email}`} className="flex items-center gap-3 text-sm text-espresso hover:text-rose transition-colors">
                <span className="w-10 h-10 bg-nude-100 text-espresso rounded-xl flex items-center justify-center"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg></span>
                <div>
                  <div className="font-medium">{stylist.email}</div>
                  <div className="text-xs text-muted">{t("emailLabel")}</div>
                </div>
              </a>
            )}
            {stylist.instagram && (
              <a href={`https://instagram.com/${stylist.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-espresso hover:text-pink-600 transition-colors">
                <span className="w-10 h-10 bg-pink-100 text-pink-600 rounded-xl flex items-center justify-center"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg></span>
                <div>
                  <div className="font-medium">{stylist.instagram}</div>
                  <div className="text-xs text-muted">Instagram</div>
                </div>
              </a>
            )}
            {stylist.telegram && (
              <a href={`https://t.me/${stylist.telegram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-espresso hover:text-espresso transition-colors">
                <span className="w-10 h-10 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg></span>
                <div>
                  <div className="font-medium">{stylist.telegram}</div>
                  <div className="text-xs text-muted">Telegram</div>
                </div>
              </a>
            )}
            {stylist.whatsapp && (
              <a href={`https://wa.me/${stylist.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-espresso hover:text-green-600 transition-colors">
                <span className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg></span>
                <div>
                  <div className="font-medium">{stylist.whatsapp}</div>
                  <div className="text-xs text-muted">WhatsApp</div>
                </div>
              </a>
            )}
          </div>
        </div>

        {/* Back link */}
        <div className="text-center pt-4">
          <Link
            href="/kadernice"
            className="inline-flex items-center gap-2 text-sm text-rose hover:text-rose-deep font-medium"
          >
            {t("allStylists")}
          </Link>
        </div>
      </div>
    </div>
  );
}
