import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SalonShell } from "@/components/SalonShell";

export default async function SalonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "SALON" && session.user.role !== "HAIRDRESSER") redirect("/dashboard");

  return <SalonShell session={session}>{children}</SalonShell>;
}
