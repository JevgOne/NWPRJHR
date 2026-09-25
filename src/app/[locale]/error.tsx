"use client";

import { useTranslations } from "next-intl";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const t = useTranslations("errorPages");

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-20">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-rose mb-4">500</p>
        <h1 className="text-2xl font-semibold text-espresso mb-3">
          {t("errorTitle")}
        </h1>
        <p className="text-muted mb-8">
          {t("errorText")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={unstable_retry}
            className="inline-flex items-center justify-center px-6 py-3 bg-espresso text-white rounded-lg hover:bg-espresso/90 transition-colors"
          >
            {t("errorRetry")}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-espresso text-espresso rounded-lg hover:bg-nude-100 transition-colors"
          >
            {t("errorHome")}
          </a>
        </div>
      </div>
    </div>
  );
}
