import Link from "next/link";

export default function RootNotFound() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-20 min-h-screen bg-nude-50 font-[family-name:var(--font-geist)]">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-rose-600 mb-4">404</p>
        <h1 className="text-2xl font-semibold text-neutral-900 mb-3">
          Page not found
        </h1>
        <p className="text-neutral-500 mb-8">
          Sorry, this page does not exist.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
        >
          Go to homepage
        </Link>
      </div>
    </div>
  );
}
