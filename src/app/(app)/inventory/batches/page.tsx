import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { BatchOverviewClient } from "./BatchOverviewClient";

export const dynamic = "force-dynamic";

export default async function BatchOverviewPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  const [t, batches] = await Promise.all([
    getTranslations(),
    prisma.stockBatch.findMany({
      include: {
        deliveries: {
          include: {
            variant: {
              select: {
                lengthCm: true,
                color: true,
                retailPricePerGram: true,
                retailPricePerPiece: true,
                sellingMode: true,
                product: { select: { name: true, category: true, texture: true } },
              },
            },
            supplier: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted mb-1">
            <a href="/inventory" className="hover:text-espresso">
              {t("stock.overview")}
            </a>
            <span>&gt;</span>
            <span>{t("stock.batches")}</span>
          </div>
          <h1 className="text-2xl font-bold text-ink">
            {t("stock.batchOverview")}
          </h1>
        </div>
      </div>
      <BatchOverviewClient batches={JSON.parse(JSON.stringify(batches))} />
    </div>
  );
}
