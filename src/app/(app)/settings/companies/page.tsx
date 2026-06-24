import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CompaniesClient } from "./CompaniesClient";

export default async function CompaniesSettingsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  return <CompaniesClient />;
}
