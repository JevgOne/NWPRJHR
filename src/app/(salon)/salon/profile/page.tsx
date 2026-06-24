import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileClient } from "./ProfileClient";

export default async function SalonProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  return <ProfileClient />;
}
