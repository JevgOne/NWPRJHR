import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { serializeProductForRole } from "@/lib/api/product-serializer";
import { ProductDetailClient } from "./ProductDetailClient";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: [{ lengthCm: "asc" }, { color: "asc" }] },
    },
  });

  if (!product) notFound();

  const serialized = serializeProductForRole(product, session.user.role);

  return (
    <ProductDetailClient
      product={serialized}
      isOwner={session.user.role === "OWNER"}
    />
  );
}
