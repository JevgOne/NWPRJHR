import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { B2BSettingsClient } from "./B2BSettingsClient";

export default async function B2BSettingsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  return <B2BSettingsClient />;
}
