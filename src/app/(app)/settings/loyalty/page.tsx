import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoyaltySettingsClient } from "./LoyaltySettingsClient";

export default async function LoyaltySettingsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  return <LoyaltySettingsClient />;
}
