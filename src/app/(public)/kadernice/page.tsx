import { prisma } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";

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
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Naše kadeřnice
        </h1>
        <p className="text-gray-500 max-w-md mx-auto text-sm">
          Profesionální specialistky na prodlužování vlasů
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {stylists.map((s) => {
          const specs: string[] = JSON.parse(s.specializations || "[]");
          const langs: string[] = JSON.parse(s.languages || "[]");

          return (
            <Link
              key={s.id}
              href={`/kadernice/${s.slug}`}
              className="group flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all overflow-hidden"
            >
              {/* Header with gradient */}
              <div className="h-20 bg-gradient-to-r from-indigo-500 to-purple-500 relative flex-shrink-0">
                {s.featured && (
                  <span className="absolute top-2.5 right-2.5 bg-white/90 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    ⭐ Doporučená
                  </span>
                )}
              </div>

              {/* Avatar overlapping header */}
              <div className="flex justify-center -mt-9 flex-shrink-0">
                <div className="w-[72px] h-[72px] rounded-full border-[3px] border-white bg-gray-100 shadow-md overflow-hidden">
                  {s.photo ? (
                    <Image
                      src={s.photo}
                      alt={s.name}
                      width={72}
                      height={72}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-2xl">
                      💇‍♀️
                    </div>
                  )}
                </div>
              </div>

              {/* Content — flex-1 to fill remaining space */}
              <div className="flex flex-col flex-1 px-5 pb-4 pt-2 text-center">
                <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {s.name}
                </h3>

                <p className="text-xs text-gray-500 mt-0.5">
                  📍 {s.city || "—"}
                  {s.experience ? ` · ${s.experience} let praxe` : ""}
                </p>

                {s.salon && (
                  <p className="text-[11px] text-indigo-600 mt-0.5">{s.salon.name}</p>
                )}

                {/* Languages */}
                <div className="flex justify-center gap-1 mt-2">
                  {langs.map((l) => (
                    <span key={l} className="text-base" title={l}>
                      {langFlags[l] || l}
                    </span>
                  ))}
                </div>

                {/* Bio — fixed 2 lines */}
                <p className="text-xs text-gray-600 mt-2 line-clamp-2 min-h-[2.5rem]">
                  {s.bio || ""}
                </p>

                {/* Specs — pushed to bottom */}
                <div className="mt-auto pt-2">
                  {specs.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1">
                      {specs.slice(0, 3).map((sp) => (
                        <span
                          key={sp}
                          className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full"
                        >
                          {sp}
                        </span>
                      ))}
                      {specs.length > 3 && (
                        <span className="text-[10px] text-gray-400">+{specs.length - 3}</span>
                      )}
                    </div>
                  )}

                  <div className="mt-3 text-xs text-indigo-600 font-medium group-hover:underline">
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
