import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DiscountHistoryClient } from "./DiscountHistoryClient";

export default async function DiscountHistoryPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  return <DiscountHistoryClient />;
}
