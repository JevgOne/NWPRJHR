import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/AppShell";

async function getBadgeCounts(userId: string, role: string) {
  const isStaff = role === "OWNER" || role === "EMPLOYEE";

  const [pendingRegCount, newInquiryCount, unreadCount, pendingReviewCount] = await Promise.all([
    isStaff
      ? prisma.salon.count({ where: { approved: false, archived: false } })
      : Promise.resolve(0),
    isStaff
      ? prisma.inquiry.count({ where: { status: "NEW" } })
      : Promise.resolve(0),
    prisma.notification.count({ where: { recipientId: userId, read: false } }),
    isStaff
      ? prisma.review.count({ where: { active: false } })
      : Promise.resolve(0),
  ]);

  return { pendingRegCount, newInquiryCount, unreadCount, pendingReviewCount };
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const badges = await getBadgeCounts(session.user.id, session.user.role);

  return (
    <AppShell session={session} badgeCounts={badges}>
      {children}
    </AppShell>
  );
}
