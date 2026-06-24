import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OrdersClient } from "@/app/(app)/orders/OrdersClient";

export default async function SalonOrdersPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return <OrdersClient role={session.user.role} />;
}
