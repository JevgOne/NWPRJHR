import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReturnsClient } from "./ReturnsClient";

export default async function ReturnsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  return <ReturnsClient />;
}
