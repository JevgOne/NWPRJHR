import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HomepageSettingsClient } from "./HomepageSettingsClient";

export default async function HomepageSettingsPage() {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") redirect("/");

  return <HomepageSettingsClient />;
}
