import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BlogListClient } from "./BlogListClient";

export default async function BlogAdminPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  return <BlogListClient />;
}
