import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";

const langFlags: Record<string, { flag: string; label: string }> = {
  cs: { flag: "🇨🇿", label: "Čeština" },
  uk: { flag: "🇺🇦", label: "Українська" },
  ru: { flag: "🇷🇺", label: "Русский" },
  en: { flag: "🇬🇧", label: "English" },
};

export default async function StylistProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const stylist = await prisma.stylist.findUnique({
    where: { slug },
    include: { salon: { select: { name: true, city: true } } },
  });

  if (!stylist || !stylist.active) notFound();

  const specs: string[] = JSON.parse(stylist.specializations || "[]");
  const langs: string[] = JSON.parse(stylist.languages || "[]");
  const certs: string[] = JSON.parse(stylist.certifications || "[]");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero header — Telegram-style */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 pb-16 pt-10">
        <div className="max-w-md mx-auto px-4 text-center">
          {/* Avatar */}
          <div className="w-24 h-24 mx-auto rounded-full border-4 border-white/30 bg-white/20 shadow-2xl backdrop-blur-sm overflow-hidden">
            {stylist.photo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={stylist.photo} alt={stylist.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">💇‍♀️</div>
            )}
          </div>

          {/* Name */}
          <h1 className="text-2xl font-bold text-white mt-4">
            {stylist.name}
            {stylist.featured && " ⭐"}
          </h1>

          {/* Location & experience */}
          <p className="text-white/80 text-sm mt-1">
            📍 {stylist.city || "Česká republika"}
            {stylist.experience && ` · ${stylist.experience} let praxe 🎓`}
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
              🏠 {stylist.salon.name}{stylist.salon.city && `, ${stylist.salon.city}`}
            </p>
          )}
        </div>
      </div>

      {/* Content cards — overlapping the header */}
      <div className="max-w-md mx-auto px-4 -mt-10 pb-10 space-y-3">

        {/* Bio card */}
        {stylist.bio && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              📝 O mně
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
              {stylist.bio}
            </p>
          </div>
        )}

        {/* Specializations */}
        {specs.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              💼 Specializace
            </h2>
            <div className="flex flex-wrap gap-2">
              {specs.map((sp) => (
                <span
                  key={sp}
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm rounded-xl font-medium"
                >
                  ✂️ {sp}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {certs.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              🏅 Certifikáty
            </h2>
            <ul className="space-y-2">
              {certs.map((c) => (
                <li key={c} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xs">🏆</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Contact card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            📞 Kontakt
          </h2>
          <div className="space-y-3">
            {stylist.phone && (
              <a href={`tel:${stylist.phone}`} className="flex items-center gap-3 text-sm text-gray-700 hover:text-indigo-600 transition-colors">
                <span className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center text-lg">📱</span>
                <div>
                  <div className="font-medium">{stylist.phone}</div>
                  <div className="text-xs text-gray-400">Telefon</div>
                </div>
              </a>
            )}
            {stylist.email && (
              <a href={`mailto:${stylist.email}`} className="flex items-center gap-3 text-sm text-gray-700 hover:text-indigo-600 transition-colors">
                <span className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-lg">✉️</span>
                <div>
                  <div className="font-medium">{stylist.email}</div>
                  <div className="text-xs text-gray-400">E-mail</div>
                </div>
              </a>
            )}
            {stylist.instagram && (
              <a href={`https://instagram.com/${stylist.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-gray-700 hover:text-pink-600 transition-colors">
                <span className="w-10 h-10 bg-pink-100 text-pink-600 rounded-xl flex items-center justify-center text-lg">📸</span>
                <div>
                  <div className="font-medium">{stylist.instagram}</div>
                  <div className="text-xs text-gray-400">Instagram</div>
                </div>
              </a>
            )}
            {stylist.telegram && (
              <a href={`https://t.me/${stylist.telegram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-gray-700 hover:text-blue-500 transition-colors">
                <span className="w-10 h-10 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center text-lg">✈️</span>
                <div>
                  <div className="font-medium">{stylist.telegram}</div>
                  <div className="text-xs text-gray-400">Telegram</div>
                </div>
              </a>
            )}
            {stylist.whatsapp && (
              <a href={`https://wa.me/${stylist.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-gray-700 hover:text-green-600 transition-colors">
                <span className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center text-lg">💬</span>
                <div>
                  <div className="font-medium">{stylist.whatsapp}</div>
                  <div className="text-xs text-gray-400">WhatsApp</div>
                </div>
              </a>
            )}
          </div>
        </div>

        {/* Back link */}
        <div className="text-center pt-4">
          <Link
            href="/kadernice"
            className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            ← Všechny kadeřnice
          </Link>
        </div>
      </div>
    </div>
  );
}
