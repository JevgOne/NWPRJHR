"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { LocaleSwitcher } from "./LocaleSwitcher";
import type { Session } from "next-auth";

interface AppShellProps {
  session: Session;
  children: React.ReactNode;
}

export function AppShell({ session, children }: AppShellProps) {
  const t = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const role = session.user.role;

  const navItems = [
    { href: "/dashboard", label: t("dashboard"), roles: ["OWNER", "EMPLOYEE", "SALON"] },
    { href: "/products", label: t("products"), roles: ["OWNER", "EMPLOYEE"] },
    { href: "/inventory", label: t("inventory"), roles: ["OWNER", "EMPLOYEE"] },
    { href: "/sales", label: t("sales"), roles: ["OWNER", "EMPLOYEE"] },
    { href: "/orders", label: t("orders"), roles: ["OWNER", "EMPLOYEE", "SALON"] },
    { href: "/invoices", label: t("invoices"), roles: ["OWNER", "EMPLOYEE", "SALON"] },
    { href: "/salons", label: t("salons"), roles: ["OWNER", "EMPLOYEE"] },
    { href: "/customers", label: t("customers"), roles: ["OWNER", "EMPLOYEE"] },
    { href: "/suppliers", label: t("suppliers"), roles: ["OWNER"] },
    { href: "/finance", label: t("finance"), roles: ["OWNER"] },
    { href: "/settings", label: t("settings"), roles: ["OWNER"] },
  ].filter((item) => item.roles.includes(role));

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
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform lg:translate-x-0 lg:static lg:flex-shrink-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 h-16 border-b border-gray-800">
            <Link href="/dashboard" className="text-xl font-bold">
              Hairora
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="px-4 py-4 border-t border-gray-800">
            <div className="text-sm text-gray-400 mb-2">
              {session.user.name || session.user.email}
            </div>
            <LocaleSwitcher />
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="mt-2 w-full text-left text-sm text-gray-400 hover:text-white transition-colors"
            >
              {tAuth("logout")}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mr-4 text-gray-600 hover:text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
