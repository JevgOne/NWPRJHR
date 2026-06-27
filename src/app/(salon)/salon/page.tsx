import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardClient } from "./DashboardClient";

export default async function SalonDashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <DashboardClient
      salonName={session.user.name ?? ""}
      salonId={session.user.salonId ?? ""}
    />
  );
}
