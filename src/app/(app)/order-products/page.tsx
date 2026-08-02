import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { OrderProductsClient } from "./OrderProductsClient";

export default async function OrderProductsPage() {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") redirect("/dashboard");

  const products = await prisma.product.findMany({
    where: { orderOnly: true, archived: false },
    select: {
      id: true,
      name: true,
      photos: true,
      supplierCode: true,
      photoCode: true,
      createdAt: true,
      variants: {
        where: { active: true },
        select: {
          id: true,
          lengthCm: true,
          color: true,
          retailPricePerGram: true,
          retailPricePerPiece: true,
          sellingMode: true,
          availableToOrder: true,
          orderLeadDays: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return <OrderProductsClient products={products} />;
}
