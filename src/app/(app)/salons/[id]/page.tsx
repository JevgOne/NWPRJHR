import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SalonDetailClient } from "./SalonDetailClient";

export default async function SalonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  return <SalonDetailClient id={id} role={session.user.role} />;
}
