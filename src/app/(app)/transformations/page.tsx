import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TransformationsClient } from "./TransformationsClient";

export default async function TransformationsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER" && session.user.role !== "EMPLOYEE") redirect("/dashboard");

  return <TransformationsClient />;
}
