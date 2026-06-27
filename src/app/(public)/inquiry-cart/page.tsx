import type { Metadata } from "next";
import { InquiryCartClient } from "./InquiryCartClient";

export const metadata: Metadata = {
  title: "Poptávkový košík",
  description: "Váš poptávkový košík — nezávazná poptávka prémiových vlasů k prodloužení.",
  alternates: { canonical: "/inquiry-cart" },
  robots: { index: false },
};

export default function InquiryCartPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <InquiryCartClient />
    </div>
  );
}
