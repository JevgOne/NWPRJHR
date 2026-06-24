import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SamplesClient } from "./SamplesClient";

export default async function SamplesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return <SamplesClient role={session.user.role} />;
}
