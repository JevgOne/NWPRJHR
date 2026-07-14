import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { StylistForm } from "../StylistForm";

export default async function StylistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER") redirect("/dashboard");

  const { id } = await params;
  const [t, stylist] = await Promise.all([
    getTranslations("stylist"),
    prisma.stylist.findUnique({ where: { id } }),
  ]);
  if (!stylist) notFound();

  const salons = await prisma.salon.findMany({
    where: { archived: false },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-6">{t("editTitle")}</h1>
      <StylistForm stylist={stylist} salons={salons} />
    </div>
  );
}
