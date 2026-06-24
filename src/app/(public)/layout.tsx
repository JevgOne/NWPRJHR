import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import Link from "next/link";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Hairora
            </Link>
            <div className="flex items-center gap-4">
              <LocaleSwitcher />
              <Link
                href="/login"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Hairora
        </div>
      </footer>
    </>
  );
}
