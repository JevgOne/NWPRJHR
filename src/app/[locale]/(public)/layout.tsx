import { Suspense } from "react";
import Script from "next/script";
import { TopInfoBar } from "@/components/public/TopInfoBar";
import { PublicNavbar } from "@/components/public/PublicNavbar";
import { PublicFooter } from "@/components/public/PublicFooter";
import { BatchPopup } from "@/components/public/BatchPopup";
import { ScrollToTop } from "@/components/public/ScrollToTop";
import { ReferralTracker } from "@/components/public/ReferralTracker";
import { InquiryCartProvider } from "@/lib/inquiry-cart";
import { WishlistProvider } from "@/lib/wishlist";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <InquiryCartProvider>
      <WishlistProvider>
        <div className="flex flex-col min-h-screen">
          <Suspense fallback={null}>
            <ReferralTracker />
          </Suspense>
          <TopInfoBar />
          <PublicNavbar />
          <main className="flex-1">{children}</main>
          <PublicFooter />
          <BatchPopup />
          <ScrollToTop />
        </div>
        <Script
          src="https://widget.packeta.com/www/js/library.js"
          strategy="lazyOnload"
        />
      </WishlistProvider>
    </InquiryCartProvider>
  );
}
