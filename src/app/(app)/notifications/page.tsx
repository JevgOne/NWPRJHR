import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NotificationsClient } from "./NotificationsClient";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return <NotificationsClient />;
}
