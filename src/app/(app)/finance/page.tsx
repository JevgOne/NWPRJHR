import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FinanceOverviewClient } from "./FinanceOverviewClient";

export default async function FinancePage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  return <FinanceOverviewClient />;
}
