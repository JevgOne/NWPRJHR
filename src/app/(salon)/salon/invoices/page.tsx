import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SalonInvoicesClient } from "./SalonInvoicesClient";

export default async function SalonInvoicesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return <SalonInvoicesClient />;
}
