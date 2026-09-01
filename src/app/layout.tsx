import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { Geist } from "next/font/google";
import Script from "next/script";
import { CookieBanner } from "@/components/CookieBanner";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { OG_LOCALES } from "@/lib/seo";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin", "latin-ext"],
});

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("metadata"), getLocale()]);
  return {
    metadataBase: new URL("https://www.hairland.cz"),
    title: {
      template: "%s | Hairland",
      default: `${t("homeTitle")} | Hairland`,
    },
    description: t("description"),
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
      locale: OG_LOCALES[locale] ?? "cs_CZ",
      images: [
        {
          url: "/og/og-home.jpg",
          width: 1200,
          height: 630,
          alt: `Hairland — ${t("homeTitle")}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: ["/og/og-home.jpg"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      google: "O8JDMlKM9MF___Aq8x5gKn4EZ7kKvBSKON524_qSnvU",
    },
    other: {
      "geo.region": "CZ-10",
      "geo.placename": "Praha",
      "geo.position": "50.0804;14.4261",
      "ICBM": "50.0804, 14.4261",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#3a2c2a",
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
      <head />
      <body className="min-h-full flex flex-col bg-nude-50 font-[family-name:var(--font-geist)] overflow-x-hidden">
        <Script
          src="https://analytics.ahrefs.com/analytics.js"
          data-key="dvHojEq9nJCvQqOBTpLlag"
          strategy="afterInteractive"
        />
        <NextIntlClientProvider messages={messages}>
          {children}
          <CookieBanner />
          <GoogleAnalytics />
        </NextIntlClientProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function loadMerchantWidget() {
                  if (document.getElementById('merchantWidgetScript')) return;
                  var s = document.createElement('script');
                  s.id = 'merchantWidgetScript';
                  s.src = 'https://www.gstatic.com/shopping/merchant/merchantwidget.js';
                  s.defer = true;
                  s.onload = function() {
                    merchantwidget.start({
                      merchant_id: 5837040724,
                      position: 'BOTTOM_RIGHT',
                      region: 'CZ',
                    });
                  };
                  document.body.appendChild(s);
                }
                if (localStorage.getItem('hairland_cookie_consent') === 'all') {
                  loadMerchantWidget();
                }
                window.addEventListener('cookie-consent-change', function() {
                  if (localStorage.getItem('hairland_cookie_consent') === 'all') {
                    loadMerchantWidget();
                  }
                });
              })();
            `,
          }}
        />
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
