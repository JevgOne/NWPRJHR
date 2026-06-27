import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReviewsClient } from "./ReviewsClient";

export default async function ReviewsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER" && session.user.role !== "EMPLOYEE") redirect("/dashboard");

  return <ReviewsClient />;
}
