import { LoginForm } from "./LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    title: "Přihlášení | Hairland",
    siteName: "Hairland",
    images: [{ url: "https://www.hairland.cz/og/og-login.jpg", width: 1200, height: 630, alt: "Hairland" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://www.hairland.cz/og/og-login.jpg"],
  },
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-nude-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/seal-light.svg" alt="Hairland" className="w-24 h-24 mx-auto mb-2" />
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
