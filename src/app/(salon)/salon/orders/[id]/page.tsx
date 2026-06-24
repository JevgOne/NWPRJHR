import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OrderDetailClient } from "@/app/(app)/orders/[id]/OrderDetailClient";

export default async function SalonOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  return (
    <OrderDetailClient id={id} role={session.user.role} userId={session.user.id} />
  );
}
