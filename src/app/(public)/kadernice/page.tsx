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
              {/* Photo + badge */}
              <div className="flex justify-center pt-5 pb-2 relative">
                {s.featured && (
                  <span className="absolute top-3 right-3 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    ⭐ Top
                  </span>
                )}
                <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden ring-2 ring-gray-200">
                  {s.photo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={s.photo} alt={s.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-3xl">💇‍♀️</div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 px-4 pb-4 text-center">
                <h3 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {s.name}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  📍 {s.city}{s.experience ? ` · ${s.experience} let praxe` : ""}
                </p>
                {s.salon && (
                  <p className="text-[10px] text-indigo-600 mt-0.5">{s.salon.name}</p>
                )}

                <div className="flex justify-center gap-1 mt-2">
                  {langs.map((l) => (
                    <span key={l} className="text-sm">{langFlags[l] || l}</span>
                  ))}
                </div>

                <p className="text-[11px] text-gray-600 mt-2 line-clamp-2 min-h-[2rem]">
                  {s.bio || ""}
                </p>

                <div className="mt-auto pt-2">
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
