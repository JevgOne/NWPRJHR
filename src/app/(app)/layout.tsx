import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { AppShell } from "@/components/AppShell";

const getCachedBadgeCounts = unstable_cache(
  async (userId: string, role: string) => {
    const isStaff = role === "OWNER" || role === "EMPLOYEE";

    const [pendingRegCount, newInquiryCount, unreadCount] = await Promise.all([
      isStaff
        ? prisma.salon.count({ where: { approved: false, archived: false } })
        : Promise.resolve(0),
      isStaff
        ? prisma.inquiry.count({ where: { status: "NEW" } })
        : Promise.resolve(0),
      prisma.notification.count({ where: { recipientId: userId, read: false } }),
    ]);

    return { pendingRegCount, newInquiryCount, unreadCount };
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

  const badges = await getCachedBadgeCounts(session.user.id, session.user.role);

  return (
    <AppShell session={session} badgeCounts={badges}>
      {children}
    </AppShell>
  );
}
