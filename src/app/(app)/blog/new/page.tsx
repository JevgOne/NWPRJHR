import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BlogEditorClient } from "../[id]/BlogEditorClient";

export default async function BlogNewPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  return <BlogEditorClient />;
}
