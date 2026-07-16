import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { AppShell } from "@/components/AppShell";

const getCachedBadgeCounts = unstable_cache(
  async (userId: string, role: string) => {
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
  },
  ["app-shell-badges"],
  { revalidate: 30, tags: ["badges"] }
);

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const [badges, currentUser] = await Promise.all([
    getCachedBadgeCounts(session.user.id, session.user.role),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { color: true },
    }),
  ]);

  return (
    <AppShell session={session} badgeCounts={badges} userColor={currentUser?.color ?? undefined}>
      {children}
    </AppShell>
  );
}
