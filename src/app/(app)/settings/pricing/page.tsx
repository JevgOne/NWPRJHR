import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PricingSettingsClient } from "./PricingSettingsClient";

export default async function PricingSettingsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  return <PricingSettingsClient />;
}
