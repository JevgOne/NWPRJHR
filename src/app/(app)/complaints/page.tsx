import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ComplaintsClient } from "./ComplaintsClient";

export default async function ComplaintsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  const users = await prisma.user.findMany({
    where: { role: { in: ["OWNER", "EMPLOYEE"] } },
    select: { name: true, color: true },
  });

  const userColors: Record<string, string> = {};
  for (const u of users) {
    if (u.name && u.color) userColors[u.name] = u.color;
  }

  return <ComplaintsClient userColors={userColors} />;
}
