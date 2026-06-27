import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { Geist } from "next/font/google";
import { CookieBanner } from "@/components/CookieBanner";
import { HreflangTags } from "@/components/HreflangTags";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin", "latin-ext"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    metadataBase: new URL("https://www.hairland.cz"),
    title: {
      template: "%s | Hairland",
      default: "Prémiové vlasy k prodloužení — skladem v Praze | Hairland",
    },
    description:
      "Prémiové přírodní vlasy k prodloužení — clip-in, tape-in, micro ring. Přímý import z Ukrajiny, Ruska, Kazachstánu. Skladem v Praze, dovoz zdarma.",
    manifest: "/manifest.json",
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "32x32" },
        { url: "/icon.svg", type: "image/svg+xml" },
      ],
      apple: [
        { url: "/icons/icon-192x192.png", sizes: "192x192" },
      ],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Hairland",
    },
    openGraph: {
      type: "website",
      siteName: "Hairland",
      locale: "cs_CZ",
      images: [
        {
          url: "/og-image.jpg",
          width: 1200,
          height: 630,
          alt: "Hairland — Prémiové vlasy k prodloužení",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: ["/og-image.jpg"],
    },
    alternates: {
      canonical: "/",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#1a1a2e",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${geist.variable} h-full antialiased`}>
      <head>
        <HreflangTags />
      </head>
      <body className="min-h-full flex flex-col bg-gray-50 font-[family-name:var(--font-geist)]">
        <NextIntlClientProvider messages={messages}>
          {children}
          <CookieBanner />
        </NextIntlClientProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
