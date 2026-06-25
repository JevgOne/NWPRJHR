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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Naše kadeřnice</h1>
        <p className="text-gray-500 text-sm mt-1">
          Profesionální specialistky na prodlužování vlasů
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stylists.map((s) => {
          const specs: string[] = JSON.parse(s.specializations || "[]");
          const langs: string[] = JSON.parse(s.languages || "[]");

          return (
            <Link
              key={s.id}
              href={`/kadernice/${s.slug}`}
              className="group flex flex-col bg-white rounded-xl border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all overflow-hidden"
            >
              {/* Compact header */}
              <div className="h-16 bg-gradient-to-r from-indigo-500 to-purple-500 relative flex-shrink-0">
                {s.featured && (
                  <span className="absolute top-2 right-2 bg-white/90 text-amber-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    ⭐ Top
                  </span>
                )}
              </div>

              {/* Avatar */}
              <div className="flex justify-center -mt-8 flex-shrink-0">
                <div className="w-16 h-16 rounded-full border-[3px] border-white bg-gray-200 shadow overflow-hidden">
                  {s.photo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={s.photo} alt={s.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-xl">💇‍♀️</div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 px-4 pb-3 pt-1.5 text-center">
                <h3 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {s.name}
                </h3>
                <p className="text-[11px] text-gray-500">
                  📍 {s.city}{s.experience ? ` · ${s.experience} let` : ""}
                </p>
                {s.salon && (
                  <p className="text-[10px] text-indigo-600">{s.salon.name}</p>
                )}

                <div className="flex justify-center gap-1 mt-1.5">
                  {langs.map((l) => (
                    <span key={l} className="text-sm">{langFlags[l] || l}</span>
                  ))}
                </div>

                <p className="text-[11px] text-gray-600 mt-1.5 line-clamp-2 min-h-[2rem]">
                  {s.bio || ""}
                </p>

                <div className="mt-auto pt-1.5">
                  {specs.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1">
                      {specs.slice(0, 2).map((sp) => (
                        <span key={sp} className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full">
                          {sp}
                        </span>
                      ))}
                      {specs.length > 2 && (
                        <span className="text-[10px] text-gray-400">+{specs.length - 2}</span>
                      )}
                    </div>
                  )}
                  <div className="mt-2 text-[11px] text-indigo-600 font-medium group-hover:underline">
                    Zobrazit profil →
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
