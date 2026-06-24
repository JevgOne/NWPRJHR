import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OrdersClient } from "./OrdersClient";

export default async function OrdersPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return <OrdersClient role={session.user.role} />;
}
