import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { SuppliersClient } from "./SuppliersClient";

export default async function SuppliersPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  const [t, suppliers] = await Promise.all([
    getTranslations(),
    prisma.supplier.findMany({
      where: { archived: false },
      include: { _count: { select: { deliveries: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const serialized = suppliers.map((s) => ({
    id: s.id,
    name: s.name,
    contactName: s.contactName,
    email: s.email,
    phone: s.phone,
    country: s.country,
    deliveryCount: s._count.deliveries,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink">
          {t("supplier.title")}
        </h1>
      </div>
      <SuppliersClient suppliers={serialized} />
    </div>
  );
}
