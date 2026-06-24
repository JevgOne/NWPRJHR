import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NewSalonClient } from "./NewSalonClient";

export default async function NewSalonPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  return <NewSalonClient />;
}
