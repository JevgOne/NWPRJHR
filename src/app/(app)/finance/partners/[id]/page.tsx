import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PartnerDetailClient } from "./PartnerDetailClient";

export default async function PartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  const { id } = await params;
  return <PartnerDetailClient partnerId={id} />;
}
