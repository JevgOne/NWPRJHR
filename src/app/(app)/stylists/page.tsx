import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

const langFlags: Record<string, string> = {
  cs: "🇨🇿",
  uk: "🇺🇦",
  ru: "🇷🇺",
  en: "🇬🇧",
};

export default async function StylistsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER") redirect("/dashboard");

  const [t, stylists] = await Promise.all([
    getTranslations("stylist"),
    prisma.stylist.findMany({
      orderBy: { name: "asc" },
      include: { salon: { select: { name: true } } },
    }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink">{t("listTitle")}</h1>
        <Link
          href="/stylists/new"
          className="inline-flex items-center px-4 py-2 bg-rose text-white rounded-lg text-sm font-medium hover:bg-rose-deep"
        >
          {t("addStylist")}
        </Link>
      </div>

      {stylists.length === 0 ? (
        <div className="bg-white rounded-xl border border-line shadow-sm p-8 text-center text-muted">
          {t("noStylists")}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stylists.map((s) => {
            const specs: string[] = JSON.parse(s.specializations || "[]");
            const langs: string[] = JSON.parse(s.languages || "[]");
            return (
              <Link
                key={s.id}
                href={`/stylists/${s.id}`}
                className="bg-white rounded-xl border border-line shadow-sm p-5 hover:border-rose/40 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-rose/15 flex items-center justify-center text-2xl flex-shrink-0">
                    {s.photo ? (
                      <img src={s.photo} alt={s.name} className="w-14 h-14 rounded-full object-cover" />
                    ) : (
                      "💇‍♀️"
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-ink truncate">{s.name}</h3>
                      {s.featured && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">⭐</span>
                      )}
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      📍 {s.city || "—"} {s.experience ? `· ${s.experience} ${t("yearsExperience")}` : ""}
                    </p>
                    {s.salon && (
                      <p className="text-xs text-espresso mt-0.5">🏠 {s.salon.name}</p>
                    )}
                    <div className="flex gap-1 mt-2">
                      {langs.map((l) => (
                        <span key={l} className="text-sm" title={l}>
                          {langFlags[l] || l}
                        </span>
                      ))}
                    </div>
                    {specs.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {specs.slice(0, 3).map((sp) => (
                          <span key={sp} className="text-xs bg-nude-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {sp}
                          </span>
                        ))}
                        {specs.length > 3 && (
                          <span className="text-xs text-muted">+{specs.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {!s.active && (
                  <div className="mt-3 text-xs text-red-600 font-medium">⚠️ {t("inactive")}</div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
