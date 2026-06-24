import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SalonsClient } from "./SalonsClient";

export default async function SalonsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return <SalonsClient role={session.user.role} />;
}
