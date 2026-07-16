import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReservationDetailClient } from "./ReservationDetailClient";

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  return (
    <ReservationDetailClient
      id={id}
      role={session.user.role}
    />
  );
}
