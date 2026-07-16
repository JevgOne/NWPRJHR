import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { NewReservationForm } from "./NewReservationForm";

export default async function NewReservationPage({
  searchParams,
}: {
  searchParams: Promise<{ variantId?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER")
    redirect("/dashboard");

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
    variants: p.variants.map((v) => ({
      id: v.id,
      lengthCm: v.lengthCm,
      color: v.color,
      sellingMode: v.sellingMode,
      retailPricePerGram: v.retailPricePerGram,
      retailPricePerPiece: v.retailPricePerPiece,
      pricePerPiece: v.pricePerPiece,
    })),
  }));

  return (
    <NewReservationForm
      products={productOptions}
      initialVariantId={params.variantId}
    />
  );
}
