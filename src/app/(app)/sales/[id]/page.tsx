import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SaleDetailClient } from "./SaleDetailClient";

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  return <SaleDetailClient id={id} role={session.user.role} />;
}
