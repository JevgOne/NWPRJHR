import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PaymentsClient } from "./PaymentsClient";

export default async function PaymentsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  return <PaymentsClient />;
}
