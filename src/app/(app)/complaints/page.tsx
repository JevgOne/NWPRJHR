import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ComplaintsClient } from "./ComplaintsClient";

export default async function ComplaintsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  return <ComplaintsClient />;
}
