import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AuditLogClient } from "./AuditLogClient";

export default async function AuditLogPage() {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") redirect("/dashboard");

  const t = await getTranslations("auditLog");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">{t("title")}</h1>
      <AuditLogClient />
    </div>
  );
}
