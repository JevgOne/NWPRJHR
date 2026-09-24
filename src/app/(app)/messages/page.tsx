import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MessagesClient } from "./MessagesClient";

export default async function MessagesPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER" && session.user.role !== "EMPLOYEE") redirect("/dashboard");

  return <MessagesClient />;
}
