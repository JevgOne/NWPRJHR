import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { NewSaleWizard } from "./NewSaleWizard";
import { ScanActionChooser } from "./ScanActionChooser";

export default async function NewSalePage({
  searchParams,
}: {
  searchParams: Promise<{ variantId?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER") redirect("/dashboard");

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
    origin: p.origin,
    texture: p.texture,
    variants: p.variants.map((v) => ({
      id: v.id,
      lengthCm: v.lengthCm,
      color: v.color,
    })),
  }));

  // QR scan flow: variantId present → show action chooser (Sell / Reserve)
  if (params.variantId) {
    const variant = await prisma.variant.findUnique({
      where: { id: params.variantId },
      include: { product: { select: { name: true } } },
    });

    const variantLabel = variant
      ? `${variant.product.name} ${variant.lengthCm}cm ${variant.color}`
      : params.variantId;

    return (
      <ScanActionChooser
        variantId={params.variantId}
        variantLabel={variantLabel}
        role={session.user.role}
        products={productOptions}
      />
    );
  }

  // Normal flow — no QR scan, go straight to wizard
  return (
    <NewSaleWizard
      products={productOptions}
      role={session.user.role}
    />
  );
}
