import { prisma } from "@/lib/db";
import Link from "next/link";

const langFlags: Record<string, string> = {
  cs: "🇨🇿",
  uk: "🇺🇦",
  ru: "🇷🇺",
  en: "🇬🇧",
};

export default async function StylistsPublicPage() {
  const stylists = await prisma.stylist.findMany({
    where: { active: true },
    orderBy: [{ featured: "desc" }, { name: "asc" }],
    include: { salon: { select: { name: true } } },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          ✨ Naše kadeřnice
        </h1>
        <p className="text-gray-600 max-w-xl mx-auto">
          Profesionální specialistky na prodlužování vlasů. Vyberte si tu svou!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stylists.map((s) => {
          const specs: string[] = JSON.parse(s.specializations || "[]");
          const langs: string[] = JSON.parse(s.languages || "[]");

          return (
            <Link
              key={s.id}
              href={`/kadernice/${s.slug}`}
              className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all overflow-hidden"
            >
              {/* Header gradient */}
              <div className="h-24 bg-gradient-to-br from-indigo-500 to-purple-600 relative">
                {s.featured && (
                  <span className="absolute top-3 right-3 bg-white/90 text-amber-600 text-xs font-bold px-2 py-1 rounded-full">
                    ⭐ Doporučená
                  </span>
                )}
              </div>

              {/* Avatar */}
              <div className="flex justify-center -mt-10">
                <div className="w-20 h-20 rounded-full border-4 border-white bg-indigo-100 flex items-center justify-center text-3xl shadow-md">
                  {s.photo ? (
                    <img src={s.photo} alt={s.name} className="w-20 h-20 rounded-full object-cover" />
                  ) : (
                    "💇‍♀️"
                  )}
                </div>
              </div>

              <div className="px-5 pb-5 pt-3 text-center">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {s.name}
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  📍 {s.city || "—"}
                  {s.experience && ` · ${s.experience} let praxe`}
                </p>

                {s.salon && (
                  <p className="text-xs text-indigo-600 mt-1">🏠 {s.salon.name}</p>
                )}

                {/* Languages */}
                <div className="flex justify-center gap-1.5 mt-3">
                  {langs.map((l) => (
                    <span key={l} className="text-lg" title={l}>
                      {langFlags[l] || l}
                    </span>
                  ))}
                </div>

                {/* Bio preview */}
                {s.bio && (
                  <p className="text-sm text-gray-600 mt-3 line-clamp-2">{s.bio}</p>
                )}

                {/* Specs */}
                {specs.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                    {specs.slice(0, 3).map((sp) => (
                      <span
                        key={sp}
                        className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full"
                      >
                        {sp}
                      </span>
                    ))}
                    {specs.length > 3 && (
                      <span className="text-xs text-gray-400">+{specs.length - 3}</span>
                    )}
                  </div>
                )}

                <div className="mt-4 text-xs text-indigo-600 font-medium group-hover:underline">
                  Zobrazit profil →
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
