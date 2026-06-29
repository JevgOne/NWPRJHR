import { PublicNavbar } from "@/components/public/PublicNavbar";
import { PublicFooter } from "@/components/public/PublicFooter";
import { BatchPopup } from "@/components/public/BatchPopup";
import { InquiryCartProvider } from "@/lib/inquiry-cart";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <InquiryCartProvider>
      <div className="flex flex-col min-h-screen">
        <PublicNavbar />
        <main className="flex-1">{children}</main>
        <PublicFooter />
        <BatchPopup />
      </div>
    </InquiryCartProvider>
  );
}
