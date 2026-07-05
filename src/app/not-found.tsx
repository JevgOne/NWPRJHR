import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-rose mb-4">404</p>
        <h1 className="text-2xl font-bold text-ink mb-2">
          Stránka nenalezena
        </h1>
        <p className="text-muted mb-8">
          Omlouváme se, ale tato stránka neexistuje nebo byla přesunuta.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="px-5 py-2.5 bg-rose text-white rounded-lg font-medium hover:bg-rose-deep transition-colors"
          >
            Zpět na hlavní stránku
          </Link>
          <Link
            href="/offer"
            className="px-5 py-2.5 bg-nude-100 text-espresso rounded-lg font-medium hover:bg-nude-200 transition-colors"
          >
            Nabídka vlasů
          </Link>
          <Link
            href="/contact"
            className="px-5 py-2.5 text-muted hover:text-ink transition-colors font-medium"
          >
            Kontakt
          </Link>
        </div>
      </div>
    </div>
  );
}
