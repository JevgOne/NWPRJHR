import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReservationsClient } from "./ReservationsClient";

export default async function ReservationsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return <ReservationsClient role={session.user.role} />;
}
