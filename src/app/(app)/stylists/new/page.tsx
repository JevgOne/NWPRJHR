import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { StylistForm } from "../StylistForm";

export default async function NewStylistPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER") redirect("/dashboard");

  const salons = await prisma.salon.findMany({
    where: { archived: false },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-6">Nová kadeřnice</h1>
      <StylistForm salons={salons} />
    </div>
  );
}
