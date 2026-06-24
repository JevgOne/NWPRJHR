import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { InvoicesClient } from "./InvoicesClient";

export default async function InvoicesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return <InvoicesClient role={session.user.role} />;
}
