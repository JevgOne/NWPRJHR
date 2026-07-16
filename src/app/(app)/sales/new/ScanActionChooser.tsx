"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { NewSaleWizard } from "./NewSaleWizard";
import type { Role } from "@prisma/client";

interface ProductOption {
  id: string;
  name: string;
  category: string;
  processingType: string;
  origin: string | null;
  texture: string | null;
  variants: { id: string; lengthCm: number; color: string }[];
}

export function ScanActionChooser({
  variantId,
  variantLabel,
  role,
  products,
}: {
  variantId: string;
  variantLabel: string;
  role: Role;
  products: ProductOption[];
}) {
  const [action, setAction] = useState<"choose" | "sell">("choose");
  const router = useRouter();
  const t = useTranslations("sale");

  if (action === "sell") {
    return (
      <NewSaleWizard
        products={products}
        role={role}
        initialVariantId={variantId}
      />
    );
  }

  return (
    <div className="max-w-sm mx-auto space-y-6 pt-8">
      <Card>
        <div className="text-center space-y-2">
          <p className="text-sm text-muted">{t("scannedProduct")}</p>
          <p className="font-bold text-lg">{variantLabel}</p>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={() => setAction("sell")}
          className="p-6 rounded-xl border-2 border-green-500 bg-green-50 hover:bg-green-100 text-center transition-colors"
        >
          <div className="text-2xl font-bold text-green-700">
            {t("sell")}
          </div>
          <div className="text-sm text-green-600 mt-1">
            {t("sellDescription")}
          </div>
        </button>

        <button
          onClick={() =>
            router.push(`/reservations/new?variantId=${variantId}`)
          }
          className="p-6 rounded-xl border-2 border-blue-500 bg-blue-50 hover:bg-blue-100 text-center transition-colors"
        >
          <div className="text-2xl font-bold text-blue-700">
            {t("reserve")}
          </div>
          <div className="text-sm text-blue-600 mt-1">
            {t("reserveDescription")}
          </div>
        </button>
      </div>
    </div>
  );
}
