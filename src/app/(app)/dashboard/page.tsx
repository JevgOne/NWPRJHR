import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";

export default function DashboardPage() {
  const t = useTranslations("dashboard");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("title")}</h1>
      <Card>
        <p className="text-gray-600">{t("welcome")}</p>
      </Card>
    </div>
  );
}
