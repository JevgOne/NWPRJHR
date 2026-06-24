import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { InvoiceDetailClient } from "./InvoiceDetailClient";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  return <InvoiceDetailClient id={id} role={session.user.role} />;
}
