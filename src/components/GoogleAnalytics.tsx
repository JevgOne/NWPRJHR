"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

const GA_ID = "G-1TL9NDPVCB";
const CONSENT_KEY = "hairland_cookie_consent";

export function GoogleAnalytics() {
  const [consentReady, setConsentReady] = useState(false);

  useEffect(() => {
    const check = () => {
      const consent = localStorage.getItem(CONSENT_KEY);
      if (consent === "all" && !consentReady) {
        setConsentReady(true);
        // Update Google Consent Mode to granted
        const w = window as any; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (typeof w.gtag === "function") {
          w.gtag("consent", "update", {
            ad_storage: "granted",
            ad_user_data: "granted",
            ad_personalization: "granted",
            analytics_storage: "granted",
          });
        }
      }
    };
    check();
    window.addEventListener("cookie-consent-change", check);
    return () => window.removeEventListener("cookie-consent-change", check);
  }, [consentReady]);

  return (
    <>
      {/* Consent Mode v2 — default denied, always loaded */}
      <Script id="gtag-consent" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
            'analytics_storage': 'denied'
          });
        `}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
