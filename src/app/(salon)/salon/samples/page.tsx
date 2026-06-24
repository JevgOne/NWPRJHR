import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SalonSamplesClient } from "./SalonSamplesClient";

export default async function SalonSamplesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return <SalonSamplesClient salonId={session.user.salonId!} />;
}
