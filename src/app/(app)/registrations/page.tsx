import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RegistrationsClient } from "./RegistrationsClient";

export default async function RegistrationsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER" && session.user.role !== "EMPLOYEE") redirect("/dashboard");

  return <RegistrationsClient role={session.user.role} />;
}
