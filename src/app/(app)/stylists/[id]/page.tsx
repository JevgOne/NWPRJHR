import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { StylistForm } from "../StylistForm";

export default async function StylistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "SALON") redirect("/dashboard");

  const { id } = await params;
  const stylist = await prisma.stylist.findUnique({ where: { id } });
  if (!stylist) notFound();

  const salons = await prisma.salon.findMany({
    where: { archived: false },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Upravit kadeřnici</h1>
      <StylistForm stylist={stylist} salons={salons} />
    </div>
  );
}
