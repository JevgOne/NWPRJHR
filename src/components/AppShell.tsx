"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { NotificationBell } from "./NotificationBell";
import type { Session } from "next-auth";
import { UserBadge } from "./ui/UserBadge";

interface BadgeCounts {
  pendingRegCount: number;
  newInquiryCount: number;
  unreadCount: number;
  pendingReviewCount: number;
}

interface AppShellProps {
  session: Session;
  children: React.ReactNode;
  badgeCounts: BadgeCounts;
}

export function AppShell({ session, children, badgeCounts }: AppShellProps) {
  const t = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const role = session.user.role;

  const { pendingRegCount, newInquiryCount, unreadCount: initialUnread, pendingReviewCount } = badgeCounts;

  // Keep notification count live (poll every 30s like NotificationBell)
  const [liveUnread, setLiveUnread] = useState(initialUnread);
  useEffect(() => {
    let active = true;
    const poll = () => {
      fetch("/api/notifications?unread=true&limit=1")
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (active && data) setLiveUnread(data.unreadCount); })
        .catch(() => {});
    };
    poll();
    const id = setInterval(poll, 60000);
    return () => { active = false; clearInterval(id); };
  }, []);

  type NavItem = { href: string; label: string; roles: string[]; badge?: number; badgeColor?: string };
  type NavGroup = { label: string | null; items: NavItem[] };

  const navGroups: NavGroup[] = [
    {
      label: null,
      items: [
        { href: "/dashboard", label: t("dashboard"), roles: ["OWNER", "EMPLOYEE", "SALON"] },
        { href: "/notifications", label: t("notifications"), roles: ["OWNER", "EMPLOYEE", "SALON"], badge: liveUnread, badgeColor: "bg-red-500" },
      ],
    },
    {
      label: t("groupProducts"),
      items: [
        { href: "/products", label: t("products"), roles: ["OWNER", "EMPLOYEE"] },
        { href: "/inventory", label: t("inventory"), roles: ["OWNER", "EMPLOYEE"] },
        { href: "/suppliers", label: t("suppliers"), roles: ["OWNER"] },
      ],
    },
    {
      label: t("groupSales"),
      items: [
        { href: "/sales", label: t("sales"), roles: ["OWNER", "EMPLOYEE"] },
        { href: "/orders", label: t("orders"), roles: ["OWNER", "EMPLOYEE", "SALON"] },
        { href: "/inquiries", label: t("inquiries"), roles: ["OWNER", "EMPLOYEE"], badge: newInquiryCount, badgeColor: "bg-blue-500" },
        { href: "/invoices", label: t("invoices"), roles: ["OWNER", "EMPLOYEE", "SALON"] },
        { href: "/payments", label: t("payments"), roles: ["OWNER"] },
      ],
    },
    {
      label: t("groupClients"),
      items: [
        { href: "/salons", label: t("salons"), roles: ["OWNER", "EMPLOYEE"] },
        { href: "/stylists", label: t("stylists"), roles: ["OWNER", "EMPLOYEE"] },
        { href: "/customers", label: t("customers"), roles: ["OWNER", "EMPLOYEE"] },
        { href: "/registrations", label: t("registrations"), roles: ["OWNER", "EMPLOYEE"], badge: pendingRegCount, badgeColor: "bg-amber-500" },
      ],
    },
    {
      label: t("groupQuality"),
      items: [
        { href: "/reviews", label: t("reviews"), roles: ["OWNER", "EMPLOYEE"], badge: pendingReviewCount, badgeColor: "bg-amber-500" },
        { href: "/complaints", label: t("complaints"), roles: ["OWNER"] },
        { href: "/returns", label: t("returns"), roles: ["OWNER"] },
        { href: "/samples", label: t("samples"), roles: ["OWNER"] },
      ],
    },
    {
      label: t("groupFinance"),
      items: [
        { href: "/finance", label: t("finance"), roles: ["OWNER"] },
        { href: "/discounts", label: t("discounts"), roles: ["OWNER"] },
        { href: "/export", label: t("export"), roles: ["OWNER"] },
      ],
    },
    {
      label: t("groupMarketing"),
      items: [
        { href: "/promo-codes", label: t("promoCodes"), roles: ["OWNER"] },
        { href: "/referrals", label: t("referrals"), roles: ["OWNER"] },
        { href: "/posts", label: t("blog"), roles: ["OWNER"] },
      ],
    },
    {
      label: t("groupSystem"),
      items: [
        { href: "/settings/loyalty", label: t("loyalty"), roles: ["OWNER"] },
        { href: "/settings/pricing", label: t("pricing"), roles: ["OWNER"] },
        { href: "/settings/companies", label: t("companies"), roles: ["OWNER"] },
        { href: "/settings/homepage", label: t("homepage"), roles: ["OWNER"] },
        { href: "/audit-log", label: t("auditLog"), roles: ["OWNER"] },
      ],
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-espresso text-nude-100 transform transition-transform lg:translate-x-0 lg:static lg:flex-shrink-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 h-16 border-b border-nude-200/20">
            <Link href="/dashboard" className="flex items-center gap-2">
              <img src="/seal-dark.svg" alt="Hairland" className="w-8 h-8 rounded-lg" />
              <span className="text-xl font-bold text-white">Hairland</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-nude-200 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 px-2 py-4 overflow-y-auto">
            {navGroups.map((group) => {
              const visibleItems = group.items.filter((item) => item.roles.includes(role));
              if (visibleItems.length === 0) return null;
              return (
                <div key={group.label ?? "_main"} className={group.label ? "mt-4" : ""}>
                  {group.label && (
                    <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-nude-200/50">
                      {group.label}
                    </p>
                  )}
                  <div className="space-y-0.5">
                    {visibleItems.map((item) => {
                      const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-rose text-white"
                              : "text-nude-100 hover:bg-white/10 hover:text-white"
                          }`}
                          onClick={() => setSidebarOpen(false)}
                        >
                          {item.label}
                          {item.badge != null && item.badge > 0 && (
                            <span className={`ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white rounded-full ${item.badgeColor ?? "bg-amber-500"}`}>
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="px-4 py-4 border-t border-nude-200/20">
            <div className="flex items-center gap-2 mb-2">
              <UserBadge name={session.user.name} size="md" showName={false} />
              <span className="text-sm text-nude-200">
                {session.user.name || session.user.email}
              </span>
            </div>
            <LocaleSwitcher />
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="mt-2 w-full text-left text-sm text-nude-200 hover:text-white transition-colors"
            >
              {tAuth("logout")}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-line h-16 flex items-center px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mr-4 text-gray-600 hover:text-ink"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="ml-auto">
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
