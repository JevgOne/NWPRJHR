import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ExportClient } from "./ExportClient";

export default async function ExportPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  return <ExportClient />;
}
