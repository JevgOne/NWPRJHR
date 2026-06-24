import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DiscountsClient } from "./DiscountsClient";

export default async function DiscountsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  return <DiscountsClient />;
}
