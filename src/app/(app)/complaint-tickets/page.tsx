import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ComplaintTicketsClient } from "./ComplaintTicketsClient";

export default async function ComplaintTicketsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  return <ComplaintTicketsClient />;
}
