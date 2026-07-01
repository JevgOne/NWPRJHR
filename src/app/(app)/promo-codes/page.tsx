import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PromoCodesClient } from "./PromoCodesClient";

export default async function PromoCodesPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  return <PromoCodesClient />;
}
