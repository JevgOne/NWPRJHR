"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { LocaleSwitcher } from "./LocaleSwitcher";
import type { Session } from "next-auth";

interface SalonShellProps {
  session: Session;
  children: React.ReactNode;
}

export function SalonShell({ session, children }: SalonShellProps) {
  const t = useTranslations("salonPortal");
  const tAuth = useTranslations("auth");
  const pathname = usePathname();

  const navItems = [
    { href: "/salon/catalog", label: t("catalog") },
    { href: "/salon/orders", label: t("myOrders") },
    { href: "/salon/invoices", label: t("myInvoices") },
    { href: "/salon/samples", label: t("mySamples") },
    { href: "/salon/profile", label: t("profile") },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/salon/catalog" className="text-lg font-bold text-indigo-600">
              Hairora
            </Link>
            <div className="flex gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith(item.href)
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{session.user.name}</span>
            <LocaleSwitcher />
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {tAuth("logout")}
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto p-4">{children}</main>
    </div>
  );
}
