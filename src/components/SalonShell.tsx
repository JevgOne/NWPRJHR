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
    <div className="min-h-screen bg-nude-50">
      <nav className="bg-white border-b border-line px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/salon/catalog" className="text-lg font-bold text-espresso">
              Hairland
            </Link>
            <div className="flex gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith(item.href)
                      ? "bg-rose/10 text-espresso"
                      : "text-gray-600 hover:bg-nude-100"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted">{session.user.name}</span>
            <LocaleSwitcher />
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm text-muted hover:text-espresso"
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
