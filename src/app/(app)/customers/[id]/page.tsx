import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CustomerDetailClient } from "./CustomerDetailClient";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER") redirect("/dashboard");

  const { id } = await params;

  return <CustomerDetailClient id={id} />;
}
