import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PartnersClient } from "./PartnersClient";

export default async function PartnersPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  return <PartnersClient />;
}
