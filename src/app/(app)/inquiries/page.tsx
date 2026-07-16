import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { InquiriesClient } from "./InquiriesClient";

export default async function InquiriesPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER" && session.user.role !== "EMPLOYEE")
    redirect("/dashboard");

  return <InquiriesClient />;
}
