import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BlogEditorClient } from "./BlogEditorClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BlogEditPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  const { id } = await params;
  return <BlogEditorClient postId={id} />;
}
