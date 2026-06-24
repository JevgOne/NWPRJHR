import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SalesHistoryClient } from "./SalesHistoryClient";

export default async function SalesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return <SalesHistoryClient role={session.user.role} />;
}
