import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CustomersClient } from "./CustomersClient";

export default async function CustomersPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "SALON") redirect("/dashboard");

  return <CustomersClient />;
}
