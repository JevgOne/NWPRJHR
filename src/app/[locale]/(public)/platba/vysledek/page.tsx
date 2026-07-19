import { getTranslations } from "next-intl/server";

interface Props {
  searchParams: Promise<{ refId?: string; transId?: string; status?: string }>;
}

export default async function PaymentResultPage({ searchParams }: Props) {
  const params = await searchParams;
  const t = await getTranslations("public.paymentResult");

  const status = (params.status || "pending").toLowerCase();

  return (
    <div className="max-w-lg mx-auto py-20 px-4 text-center">
      {status === "paid" && (
        <>
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-green-600 mb-4">{t("paidTitle")}</h1>
          <p className="text-muted">{t("paidDesc")}</p>
        </>
      )}
      {status === "pending" && (
        <>
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-yellow-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-yellow-600 mb-4">{t("pendingTitle")}</h1>
          <p className="text-muted">{t("pendingDesc")}</p>
        </>
      )}
      {status === "cancelled" && (
        <>
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">{t("cancelledTitle")}</h1>
          <p className="text-muted">{t("cancelledDesc")}</p>
        </>
      )}
    </div>
  );
}
