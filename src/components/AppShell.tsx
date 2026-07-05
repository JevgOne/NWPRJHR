"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { NotificationBell } from "./NotificationBell";
import type { Session } from "next-auth";

interface BadgeCounts {
  pendingRegCount: number;
  newInquiryCount: number;
  unreadCount: number;
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

  const { pendingRegCount, newInquiryCount, unreadCount } = badgeCounts;

  type NavItem = { href: string; label: string; roles: string[]; badge?: number; badgeColor?: string };
  type NavGroup = { label: string | null; items: NavItem[] };

  const navGroups: NavGroup[] = [
    {
      label: null,
      items: [
        { href: "/dashboard", label: t("dashboard"), roles: ["OWNER", "EMPLOYEE", "SALON"] },
        { href: "/notifications", label: "Oznámení", roles: ["OWNER", "EMPLOYEE", "SALON"], badge: unreadCount, badgeColor: "bg-red-500" },
      ],
    },
    {
      label: "Produkty a sklad",
      items: [
        { href: "/products", label: t("products"), roles: ["OWNER", "EMPLOYEE"] },
        { href: "/inventory", label: t("inventory"), roles: ["OWNER", "EMPLOYEE"] },
        { href: "/suppliers", label: t("suppliers"), roles: ["OWNER"] },
      ],
    },
    {
      label: "Prodej",
      items: [
        { href: "/sales", label: t("sales"), roles: ["OWNER", "EMPLOYEE"] },
        { href: "/orders", label: t("orders"), roles: ["OWNER", "EMPLOYEE", "SALON"] },
        { href: "/inquiries", label: "Poptávky", roles: ["OWNER", "EMPLOYEE"], badge: newInquiryCount, badgeColor: "bg-blue-500" },
        { href: "/invoices", label: t("invoices"), roles: ["OWNER", "EMPLOYEE", "SALON"] },
        { href: "/payments", label: t("payments"), roles: ["OWNER"] },
      ],
    },
    {
      label: "Klienti",
      items: [
        { href: "/salons", label: t("salons"), roles: ["OWNER", "EMPLOYEE"] },
        { href: "/stylists", label: "Kadeřnice", roles: ["OWNER", "EMPLOYEE"] },
        { href: "/customers", label: t("customers"), roles: ["OWNER", "EMPLOYEE"] },
        { href: "/registrations", label: t("registrations"), roles: ["OWNER", "EMPLOYEE"], badge: pendingRegCount, badgeColor: "bg-amber-500" },
      ],
    },
    {
      label: "Kvalita",
      items: [
        { href: "/reviews", label: "Recenze", roles: ["OWNER", "EMPLOYEE"] },
        { href: "/complaints", label: t("complaints"), roles: ["OWNER"] },
        { href: "/returns", label: t("returns"), roles: ["OWNER"] },
        { href: "/samples", label: t("samples"), roles: ["OWNER"] },
      ],
    },
    {
      label: "Finance",
      items: [
        { href: "/finance", label: t("finance"), roles: ["OWNER"] },
        { href: "/discounts", label: t("discounts"), roles: ["OWNER"] },
        { href: "/export", label: t("export"), roles: ["OWNER"] },
      ],
    },
    {
      label: "Marketing",
      items: [
        { href: "/promo-codes", label: t("promoCodes"), roles: ["OWNER"] },
        { href: "/posts", label: "Blog", roles: ["OWNER"] },
      ],
    },
    {
      label: "Systém",
      items: [
        { href: "/settings/loyalty", label: "Věrnostní program", roles: ["OWNER"] },
        { href: "/settings/b2b", label: "B2B", roles: ["OWNER"] },
        { href: "/settings/pricing", label: "Cenotvorba", roles: ["OWNER"] },
        { href: "/settings/companies", label: "Firmy", roles: ["OWNER"] },
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
              <img src="/icons/icon-192x192.png" alt="Hairland" className="w-8 h-8 rounded-lg" />
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
            <div className="text-sm text-nude-200 mb-2">
              {session.user.name || session.user.email}
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
