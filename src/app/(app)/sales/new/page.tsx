import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { NewSaleWizard } from "./NewSaleWizard";

export default async function NewSalePage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "SALON") redirect("/dashboard");

  const products = await prisma.product.findMany({
    where: { archived: false },
    include: {
      variants: {
        where: { active: true },
        orderBy: [{ lengthCm: "asc" }, { color: "asc" }],
      },
    },
    orderBy: { name: "asc" },
  });

  const productOptions = products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    processingType: p.processingType,
    variants: p.variants.map((v) => ({
      id: v.id,
      lengthCm: v.lengthCm,
      color: v.color,
    })),
  }));

  return (
    <NewSaleWizard
      products={productOptions}
      role={session.user.role}
    />
  );
}
